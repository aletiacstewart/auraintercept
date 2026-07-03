import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = "hubspot" | "salesforce" | "zoho" | "pipedrive" | "generic";

interface NormLead {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
  external_id?: string;
}

async function pullContacts(provider: Provider, creds: Record<string, string>, limit = 100): Promise<NormLead[]> {
  if (provider === "hubspot") {
    const r = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,hs_lead_status`, {
      headers: { Authorization: `Bearer ${creds.access_token || creds.api_key}` },
    });
    if (!r.ok) throw new Error(`HubSpot pull ${r.status}`);
    const j = await r.json();
    return (j.results || []).map((c: any) => ({
      external_id: String(c.id),
      email: c.properties?.email,
      phone: c.properties?.phone,
      name: [c.properties?.firstname, c.properties?.lastname].filter(Boolean).join(" ").trim(),
      source: "hubspot",
    }));
  }
  if (provider === "pipedrive") {
    const base = (creds.domain || "api");
    const url = base.startsWith("http") ? `${base}/v1/persons` : `https://${base}.pipedrive.com/v1/persons`;
    const r = await fetch(`${url}?limit=${limit}&api_token=${encodeURIComponent(creds.api_key)}`);
    if (!r.ok) throw new Error(`Pipedrive pull ${r.status}`);
    const j = await r.json();
    return (j.data || []).map((p: any) => ({
      external_id: String(p.id),
      email: p.email?.[0]?.value,
      phone: p.phone?.[0]?.value,
      name: p.name,
      source: "pipedrive",
    }));
  }
  if (provider === "zoho") {
    const dc = creds.dc || "com";
    const r = await fetch(`https://www.zohoapis.${dc}/crm/v2/Contacts?per_page=${limit}`, {
      headers: { Authorization: `Zoho-oauthtoken ${creds.access_token}` },
    });
    if (!r.ok) throw new Error(`Zoho pull ${r.status}`);
    const j = await r.json();
    return (j.data || []).map((c: any) => ({
      external_id: String(c.id),
      email: c.Email,
      phone: c.Phone || c.Mobile,
      name: [c.First_Name, c.Last_Name].filter(Boolean).join(" ").trim() || c.Full_Name,
      source: "zoho",
    }));
  }
  if (provider === "salesforce") {
    const instance = (creds.instance_url || "").replace(/\/$/, "");
    const soql = encodeURIComponent(`SELECT Id, Name, Email, Phone FROM Contact ORDER BY LastModifiedDate DESC LIMIT ${limit}`);
    const r = await fetch(`${instance}/services/data/v59.0/query?q=${soql}`, {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });
    if (!r.ok) throw new Error(`Salesforce pull ${r.status}`);
    const j = await r.json();
    return (j.records || []).map((c: any) => ({
      external_id: String(c.Id),
      email: c.Email,
      phone: c.Phone,
      name: c.Name,
      source: "salesforce",
    }));
  }
  return [];
}

async function pushLead(provider: Provider, creds: Record<string, string>, lead: any): Promise<{ external_id?: string; error?: string }> {
  try {
    if (provider === "hubspot") {
      const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.access_token || creds.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            email: lead.email || undefined,
            phone: lead.phone || undefined,
            firstname: (lead.name || "").split(" ")[0] || undefined,
            lastname: (lead.name || "").split(" ").slice(1).join(" ") || undefined,
          },
        }),
      });
      if (!r.ok) return { error: `HubSpot ${r.status}` };
      const j = await r.json();
      return { external_id: String(j.id) };
    }
    if (provider === "pipedrive") {
      const base = (creds.domain || "api");
      const url = base.startsWith("http") ? `${base}/v1/persons` : `https://${base}.pipedrive.com/v1/persons`;
      const r = await fetch(`${url}?api_token=${encodeURIComponent(creds.api_key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: lead.name || lead.email || lead.phone || "New Lead", email: lead.email ? [lead.email] : undefined, phone: lead.phone ? [lead.phone] : undefined }),
      });
      if (!r.ok) return { error: `Pipedrive ${r.status}` };
      const j = await r.json();
      return { external_id: String(j?.data?.id) };
    }
    if (provider === "zoho") {
      const dc = creds.dc || "com";
      const r = await fetch(`https://www.zohoapis.${dc}/crm/v2/Leads`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${creds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ data: [{ Last_Name: lead.name || lead.email || "Lead", Email: lead.email, Phone: lead.phone }] }),
      });
      if (!r.ok) return { error: `Zoho ${r.status}` };
      const j = await r.json();
      return { external_id: String(j?.data?.[0]?.details?.id) };
    }
    if (provider === "salesforce") {
      const instance = (creds.instance_url || "").replace(/\/$/, "");
      const r = await fetch(`${instance}/services/data/v59.0/sobjects/Lead`, {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          LastName: (lead.name || "Lead").split(" ").slice(1).join(" ") || lead.name || "Lead",
          FirstName: (lead.name || "").split(" ")[0],
          Email: lead.email,
          Phone: lead.phone,
          Company: lead.company || "Unknown",
        }),
      });
      if (!r.ok) return { error: `Salesforce ${r.status}` };
      const j = await r.json();
      return { external_id: String(j?.id) };
    }
    if (provider === "generic") {
      if (!creds.webhook_url) return { error: "webhook_url missing" };
      const r = await fetch(creds.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(creds.webhook_secret ? { "X-Aura-Signature": creds.webhook_secret } : {}) },
        body: JSON.stringify({ event: "lead.created", lead }),
      });
      if (!r.ok) return { error: `Generic ${r.status}` };
      return { external_id: undefined };
    }
    return { error: "Unknown provider" };
  } catch (e) {
    return { error: String((e as Error).message || e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json();
    const { company_id, mode = "both", lead_id } = body as { company_id: string; mode?: "push" | "pull" | "both"; lead_id?: string };
    if (!company_id) {
      return new Response(JSON.stringify({ ok: false, error: "company_id required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Require either the service role key (server-to-server) or an authenticated
    // user with marketing/full-company access to the target company. Prevents
    // anonymous CRM writes using another tenant's stored credentials.
    const authz = await authorizeInternalRequest(req, company_id);
    if (!authz.ok) {
      return new Response(JSON.stringify({ ok: false, error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!authz.ctx.isService) {
      // Require marketing / full-company access for user-initiated syncs
      const { data: perms } = await supabase.rpc("has_marketing_access", { _user_id: authz.ctx.userId });
      if (perms !== true) {
        return new Response(JSON.stringify({ ok: false, error: "Forbidden — marketing access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: conn } = await supabase.from("crm_connections").select("*").eq("company_id", company_id).eq("status", "connected").maybeSingle();
    if (!conn) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no_connection" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provider = conn.provider as Provider;
    const creds = conn.credentials as Record<string, string>;
    const result: any = { pushed: 0, pulled: 0, errors: 0 };

    // PUSH
    if ((mode === "push" || mode === "both") && (conn.sync_direction === "push" || conn.sync_direction === "two_way")) {
      let leadsQ = supabase.from("leads").select("id,name,email,phone,external_crm_id,external_crm_provider").eq("company_id", company_id).is("external_crm_id", null).limit(50);
      if (lead_id) leadsQ = supabase.from("leads").select("id,name,email,phone,external_crm_id,external_crm_provider").eq("id", lead_id);
      const { data: leads } = await leadsQ;
      for (const l of leads || []) {
        const r = await pushLead(provider, creds, l);
        await supabase.from("crm_sync_log").insert({
          connection_id: conn.id, company_id, direction: "out", entity: "lead",
          external_id: r.external_id, lead_id: l.id, status: r.error ? "error" : "success", error: r.error,
        });
        if (r.external_id) await supabase.from("leads").update({ external_crm_id: r.external_id, external_crm_provider: provider }).eq("id", l.id);
        if (r.error) result.errors++; else result.pushed++;
      }
    }

    // PULL
    if ((mode === "pull" || mode === "both") && (conn.sync_direction === "pull" || conn.sync_direction === "two_way")) {
      try {
        const remote = await pullContacts(provider, creds, 100);
        for (const c of remote) {
          // Dedupe by external_id, then email, then phone
          const matchOr: string[] = [];
          if (c.external_id) matchOr.push(`external_crm_id.eq.${c.external_id}`);
          if (c.email) matchOr.push(`email.eq.${c.email}`);
          if (c.phone) matchOr.push(`phone.eq.${c.phone}`);
          let existing: any = null;
          if (matchOr.length) {
            const { data } = await supabase.from("leads").select("id").eq("company_id", company_id).or(matchOr.join(",")).limit(1).maybeSingle();
            existing = data;
          }
          if (existing) {
            await supabase.from("leads").update({ external_crm_id: c.external_id, external_crm_provider: provider }).eq("id", existing.id);
            await supabase.from("crm_sync_log").insert({ connection_id: conn.id, company_id, direction: "in", entity: "lead", external_id: c.external_id, lead_id: existing.id, status: "skipped" });
          } else {
            const { data: ins } = await supabase.from("leads").insert({
              company_id, name: c.name || c.email || c.phone || "Imported Contact",
              email: c.email, phone: c.phone, source: c.source || provider,
              external_crm_id: c.external_id, external_crm_provider: provider, status: "new",
            }).select("id").single();
            await supabase.from("crm_sync_log").insert({ connection_id: conn.id, company_id, direction: "in", entity: "lead", external_id: c.external_id, lead_id: ins?.id, status: "success" });
            result.pulled++;
          }
        }
      } catch (e) {
        result.errors++;
        await supabase.from("crm_sync_log").insert({ connection_id: conn.id, company_id, direction: "in", entity: "lead", status: "error", error: String((e as Error).message || e) });
      }
    }

    await supabase.from("crm_connections").update({ last_sync_at: new Date().toISOString(), last_error: result.errors > 0 ? `errors: ${result.errors}` : null }).eq("id", conn.id);

    return new Response(JSON.stringify({ ok: true, ...result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message || e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});