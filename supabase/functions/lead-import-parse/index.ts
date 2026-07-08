import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NormRow { name?: string; email?: string; phone?: string; address?: string; source?: string; notes?: string; tags?: string[]; }

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 1) return [];
  const splitCsv = (line: string): string[] => {
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur); return out;
  };
  const headers = splitCsv(lines[0]).map(h => h.trim());
  return lines.slice(1).map(l => {
    const vals = splitCsv(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || "").trim(); });
    return row;
  });
}

function normalizeFromHeaders(rows: Record<string, string>[]): NormRow[] {
  const headerMap = (h: string) => {
    const k = h.toLowerCase().trim();
    if (/(^| )name|full.?name|contact/.test(k)) return "name";
    if (/first.?name/.test(k)) return "first_name";
    if (/last.?name|surname/.test(k)) return "last_name";
    if (/e.?mail/.test(k)) return "email";
    if (/phone|mobile|cell|tel/.test(k)) return "phone";
    if (/address|street|city|zip|postal/.test(k)) return "address";
    if (/source|channel|origin/.test(k)) return "source";
    if (/notes?|comment|message/.test(k)) return "notes";
    if (/tag/.test(k)) return "tags";
    return null;
  };
  return rows.map(row => {
    const out: NormRow = {};
    let first = "", last = "";
    for (const [h, v] of Object.entries(row)) {
      if (!v) continue;
      const k = headerMap(h);
      if (!k) continue;
      if (k === "first_name") first = v;
      else if (k === "last_name") last = v;
      else if (k === "tags") out.tags = v.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
      else (out as any)[k] = v;
    }
    if (!out.name && (first || last)) out.name = `${first} ${last}`.trim();
    return out;
  }).filter(r => r.name || r.email || r.phone);
}

async function aiNormalizeText(text: string): Promise<NormRow[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return [];
  const prompt = `Extract every lead/contact from this text. Return ONLY JSON: {"leads":[{"name":"","email":"","phone":"","address":"","notes":""}]}. Skip rows without enough info.\n\nTEXT:\n${text.slice(0, 50000)}`;
  const { response: r, modelUsed: rModel, fellBackFromPrimary: rFellBack } = await callAIGatewayWithFallback({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
  if (rFellBack) console.warn(`[lead-import-parse] primary model unavailable, served by ${rModel}`);
  if (!r.ok) return [];
  const j = await r.json();
  try {
    const parsed = JSON.parse(j.choices?.[0]?.message?.content || "{}");
    return Array.isArray(parsed.leads) ? parsed.leads : [];
  } catch { return []; }
}

async function extractDocxText(bytes: Uint8Array): Promise<string> {
  // Minimal docx text extraction by reading the zip's word/document.xml
  const { unzip } = await import("https://esm.sh/unzipit@1.4.3");
  const { entries } = await unzip(bytes);
  const e = entries["word/document.xml"];
  if (!e) return "";
  const xml = await e.text();
  return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdfjs: any = await import("https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: false });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let p = 1; p <= Math.min(pdf.numPages, 25); p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map((i: any) => i.str).join(" ") + "\n";
    }
    return text;
  } catch { return ""; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { job_id } = await req.json();
    if (!job_id) return new Response(JSON.stringify({ ok: false, error: "job_id required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: job, error: jobErr } = await supabase.from("lead_import_jobs").select("*").eq("id", job_id).single();
    if (jobErr || !job) throw new Error("job not found");

    const authz = await authorizeInternalRequest(req, job.company_id);
    if (!authz.ok) {
      return new Response(JSON.stringify({ ok: false, error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("lead_import_jobs").update({ status: "parsing" }).eq("id", job_id);

    const { data: file, error: dlErr } = await supabase.storage.from("lead-imports").download(job.storage_path);
    if (dlErr || !file) throw new Error(`download: ${dlErr?.message}`);
    const buf = new Uint8Array(await file.arrayBuffer());
    const name = job.source_filename.toLowerCase();

    let normalized: NormRow[] = [];
    let rawRows: any[] = [];

    if (name.endsWith(".csv") || job.mime_type === "text/csv") {
      const text = new TextDecoder().decode(buf);
      rawRows = parseCsv(text);
      normalized = normalizeFromHeaders(rawRows);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      normalized = normalizeFromHeaders(rawRows);
    } else if (name.endsWith(".docx")) {
      const text = await extractDocxText(buf);
      normalized = await aiNormalizeText(text);
      rawRows = normalized.map(n => ({ ...n }));
    } else if (name.endsWith(".pdf")) {
      const text = await extractPdfText(buf);
      normalized = await aiNormalizeText(text);
      rawRows = normalized.map(n => ({ ...n }));
    } else {
      throw new Error("Unsupported file type. Use CSV, XLSX, PDF, or DOCX.");
    }

    // Dedupe vs existing leads
    const inserts = [];
    let dupCount = 0;
    for (let i = 0; i < normalized.length; i++) {
      const n = normalized[i];
      let matchId: string | null = null;
      if (n.email || n.phone) {
        const filters: string[] = [];
        if (n.email) filters.push(`email.eq.${n.email}`);
        if (n.phone) filters.push(`phone.eq.${n.phone}`);
        const { data: m } = await supabase.from("leads").select("id").eq("company_id", job.company_id).or(filters.join(",")).limit(1).maybeSingle();
        if (m) { matchId = m.id; dupCount++; }
      }
      inserts.push({
        job_id, company_id: job.company_id, row_index: i,
        raw: rawRows[i] || {}, normalized: n,
        dedupe_match_lead_id: matchId,
        decision: matchId ? "duplicate" : "pending",
      });
    }
    if (inserts.length) {
      // Insert in chunks
      for (let i = 0; i < inserts.length; i += 200) {
        await supabase.from("lead_import_rows").insert(inserts.slice(i, i + 200));
      }
    }

    const nextStatus = job.mode === "auto" ? "importing" : "ready_for_review";
    await supabase.from("lead_import_jobs").update({
      status: nextStatus, total_rows: inserts.length, duplicate_count: dupCount,
    }).eq("id", job_id);

    // Auto-commit if mode = auto
    if (job.mode === "auto") {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/lead-import-commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ job_id, approve_all: true }),
      });
    }

    return new Response(JSON.stringify({ ok: true, total: inserts.length, duplicates: dupCount }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { job_id } = await req.clone().json().catch(() => ({}));
      if (job_id) await supabase.from("lead_import_jobs").update({ status: "failed", parser_notes: String((e as Error).message || e) }).eq("id", job_id);
    } catch {}
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message || e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});