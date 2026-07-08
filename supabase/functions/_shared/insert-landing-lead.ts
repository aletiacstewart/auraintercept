import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Aura Intercept's own company — leads from the marketing site land here so the
// internal sales team sees them in the standard leads console under
// auraintercept@gmail.com.
export const AURA_INTERCEPT_COMPANY_ID = "04c57cbe-358e-4036-a3ad-b777a55f5be0";

export interface LandingLeadInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  notes?: string | null;
  source: string; // e.g. "message_aura_website", "talk_to_aura_website", "voice_post_call"
  metadata?: Record<string, unknown>;
}

function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

function normPhone(p?: string | null): string | null {
  if (!p) return null;
  const digits = p.replace(/[^\d]/g, "");
  return digits.length >= 7 ? digits : null;
}

/**
 * Insert (or refresh) a lead under the Aura Intercept company from the
 * marketing site chat or voice widget. Dedupes on email/phone within 24h
 * so retries and safety-net scans don't spam the leads console.
 */
export async function insertAuraInterceptLead(
  input: LandingLeadInput,
): Promise<{ ok: boolean; id?: string; deduped?: boolean; error?: string }> {
  const admin = getAdminClient();
  const email = input.email?.trim().toLowerCase() || null;
  const phoneDigits = normPhone(input.phone);
  const name = (input.name?.trim() || "").slice(0, 120) || "Website visitor";

  if (!email && !phoneDigits) {
    return { ok: false, error: "no contact info" };
  }

  // Dedupe within last 24h on either email or phone digits
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const orParts: string[] = [];
  if (email) orParts.push(`email.eq.${email}`);
  if (phoneDigits) orParts.push(`phone.ilike.%${phoneDigits}%`);
  if (orParts.length) {
    const { data: existing } = await admin
      .from("leads")
      .select("id")
      .eq("company_id", AURA_INTERCEPT_COMPANY_ID)
      .gte("created_at", since)
      .or(orParts.join(","))
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      // Refresh last_activity_at + append notes so recurring visits still register.
      await admin
        .from("leads")
        .update({
          last_activity_at: new Date().toISOString(),
          notes: input.notes ? String(input.notes).slice(0, 2000) : undefined,
        })
        .eq("id", existing.id);
      return { ok: true, id: existing.id, deduped: true };
    }
  }

  const { data, error } = await admin
    .from("leads")
    .insert({
      company_id: AURA_INTERCEPT_COMPANY_ID,
      name,
      email,
      phone: input.phone?.trim() || null,
      source: input.source,
      channel: input.source.startsWith("voice") ? "voice" : "chat",
      intent: "demo_request",
      service_interest: input.industry?.trim() || null,
      notes: input.notes ? String(input.notes).slice(0, 2000) : null,
      priority: "high",
      status: "new",
      score: 75,
      intake_data: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("[insertAuraInterceptLead] insert error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}

// Regex helpers used by the safety-net scans.
export const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
export const PHONE_RE = /(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;

export function extractContact(text: string): { email?: string; phone?: string } {
  const email = text.match(EMAIL_RE)?.[0]?.toLowerCase();
  const phone = text.match(PHONE_RE)?.[0];
  return { email, phone };
}