// Shared outbound SMS guard.
// Ensures every outbound SMS goes to a number that belongs to a Lead/Customer
// (or, opt-in, a staff member or a recent inbound caller) for the company
// that owns the campaign/reminder/event. Also centralizes E.164 normalization,
// SignalWire sending, and sms_logs writes with a `source` tag.

export type SmsSource = "campaign" | "reminder" | "missed_call" | "staff" | "aura";

export interface GuardOptions {
  allowStaff?: boolean;
  allowInboundCaller?: boolean; // requires recent matching call_logs row
}

export interface GuardedSmsArgs {
  supabase: any;
  companyId: string;
  from: string;
  to: string;
  body: string;
  source: SmsSource;
  appointmentId?: string | null;
  customerName?: string | null;
  allowStaff?: boolean;
  allowInboundCaller?: boolean;
}

export interface GuardedSmsResult {
  ok: boolean;
  status: "sent" | "failed" | "blocked";
  to: string;
  error?: string;
  providerCode?: string;
  providerMessageId?: string;
}

// US area codes start 2-9 (NANP), middle digit 0-9, last 0-9.
// Reject obviously bogus area codes (e.g. starting with 0 or 1).
export function normalizeE164US(value?: string | null): string | null {
  const digits = String(value || "").replace(/\D/g, "");
  let core = "";
  if (digits.length === 10) core = digits;
  else if (digits.length === 11 && digits.startsWith("1")) core = digits.slice(1);
  else return null;
  // NANP area code: first digit 2-9
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(core)) return null;
  return `+1${core}`;
}

function digitsOnly(value?: string | null): string {
  return String(value || "").replace(/\D/g, "");
}

async function logSms(
  supabase: any,
  row: {
    companyId: string;
    from: string;
    to: string;
    body: string;
    direction: "outbound" | "inbound";
    status: "sent" | "failed" | "blocked";
    source: SmsSource;
    error?: string | null;
    providerMessageId?: string | null;
    metadata?: Record<string, any>;
  },
) {
  try {
    await supabase.from("sms_logs").insert({
      company_id: row.companyId,
      from_number: row.from,
      to_number: row.to,
      message: row.body,
      direction: row.direction,
      status: row.status,
      source: row.source,
      error: row.error ?? null,
      provider_message_id: row.providerMessageId ?? null,
      metadata: row.metadata ?? {},
    });
  } catch (e) {
    console.error("[sms-guard] failed to write sms_logs:", e);
  }
}

export async function isAllowedRecipient(
  supabase: any,
  companyId: string,
  e164: string,
  opts: GuardOptions = {},
): Promise<{ allowed: boolean; reason?: string; matchedName?: string }> {
  const digits = digitsOnly(e164);
  if (!digits) return { allowed: false, reason: "invalid_phone" };

  // Match against customer_profiles (primary contact store)
  const { data: cp } = await supabase
    .from("customer_profiles")
    .select("id, name, phone")
    .eq("company_id", companyId)
    .limit(500);
  for (const r of cp || []) {
    if (digitsOnly(r.phone).endsWith(digits.slice(-10))) {
      return { allowed: true, matchedName: r.name };
    }
  }

  // Match against leads
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, phone")
    .eq("company_id", companyId)
    .limit(500);
  for (const r of leads || []) {
    if (digitsOnly(r.phone).endsWith(digits.slice(-10))) {
      return { allowed: true, matchedName: r.name };
    }
  }

  // Match against customers (CRM-synced)
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, mobile_phone")
    .eq("company_id", companyId)
    .limit(500);
  for (const r of customers || []) {
    if (
      digitsOnly(r.phone).endsWith(digits.slice(-10)) ||
      digitsOnly(r.mobile_phone).endsWith(digits.slice(-10))
    ) {
      return {
        allowed: true,
        matchedName: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
      };
    }
  }

  if (opts.allowStaff) {
    // Staff phone numbers live on staff_notification_preferences
    const { data: staff } = await supabase
      .from("staff_notification_preferences")
      .select("sms_phone_number, profiles!inner(full_name, company_id)")
      .eq("profiles.company_id", companyId)
      .limit(200);
    for (const r of staff || []) {
      if (digitsOnly(r.sms_phone_number).endsWith(digits.slice(-10))) {
        return { allowed: true, matchedName: (r as any).profiles?.full_name || "Staff" };
      }
    }
  }

  if (opts.allowInboundCaller) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: calls } = await supabase
      .from("call_logs")
      .select("from_number")
      .eq("company_id", companyId)
      .gte("started_at", cutoff)
      .limit(200);
    for (const r of calls || []) {
      if (digitsOnly(r.from_number).endsWith(digits.slice(-10))) {
        return { allowed: true, matchedName: "Recent caller" };
      }
    }
  }

  return { allowed: false, reason: "recipient_not_in_contacts" };
}

export async function sendGuardedSms(args: GuardedSmsArgs): Promise<GuardedSmsResult> {
  const { supabase, companyId, source } = args;
  const from = normalizeE164US(args.from);
  const to = normalizeE164US(args.to);

  if (!from || !to) {
    await logSms(supabase, {
      companyId,
      from: args.from || "",
      to: args.to || "",
      body: args.body,
      direction: "outbound",
      status: "blocked",
      source,
      error: "invalid_phone",
      metadata: { customer_name: args.customerName, appointment_id: args.appointmentId },
    });
    return { ok: false, status: "blocked", to: args.to || "", error: "invalid_phone" };
  }

  // Allowlist check
  const guard = await isAllowedRecipient(supabase, companyId, to, {
    allowStaff: args.allowStaff,
    allowInboundCaller: args.allowInboundCaller,
  });
  if (!guard.allowed) {
    await logSms(supabase, {
      companyId,
      from,
      to,
      body: args.body,
      direction: "outbound",
      status: "blocked",
      source,
      error: guard.reason || "recipient_not_in_contacts",
      metadata: { customer_name: args.customerName, appointment_id: args.appointmentId },
    });
    return {
      ok: false,
      status: "blocked",
      to,
      error:
        "Recipient is not in your Leads or Customers list for this company. SMS was not sent.",
    };
  }

  // Load SignalWire credentials for this company
  const { data: integ } = await supabase
    .from("tenant_integrations")
    .select(
      "signalwire_project_id, signalwire_api_token, signalwire_space_url, signalwire_phone_number",
    )
    .eq("company_id", companyId)
    .maybeSingle();

  if (!integ?.signalwire_project_id || !integ?.signalwire_api_token || !integ?.signalwire_space_url) {
    const err = "SignalWire is not configured for this company.";
    await logSms(supabase, {
      companyId,
      from,
      to,
      body: args.body,
      direction: "outbound",
      status: "failed",
      source,
      error: err,
      metadata: { customer_name: args.customerName, appointment_id: args.appointmentId, matched: guard.matchedName },
    });
    return { ok: false, status: "failed", to, error: err };
  }

  const fromNumber = normalizeE164US(integ.signalwire_phone_number) || from;
  const url = `https://${integ.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integ.signalwire_project_id}/Messages.json`;
  const auth = "Basic " + btoa(`${integ.signalwire_project_id}:${integ.signalwire_api_token}`);

  try {
    const params = new URLSearchParams({ From: fromNumber, To: to, Body: args.body });
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });
    const text = await resp.text();
    let payload: any = {};
    try { payload = JSON.parse(text); } catch { /* keep raw text */ }

    if (!resp.ok) {
      const code = payload?.code ? String(payload.code) : String(resp.status);
      const baseMsg = payload?.message || text;
      const friendly = code === "10000"
        ? `SignalWire 10000: ${baseMsg} — The SignalWire account must verify the recipient or upgrade from trial to send to this number.`
        : `SignalWire ${code}: ${baseMsg}`;
      await logSms(supabase, {
        companyId,
        from: fromNumber,
        to,
        body: args.body,
        direction: "outbound",
        status: "failed",
        source,
        error: friendly,
        metadata: {
          customer_name: args.customerName,
          appointment_id: args.appointmentId,
          provider: "signalwire",
          provider_code: code,
          provider_status: resp.status,
          matched: guard.matchedName,
        },
      });
      return { ok: false, status: "failed", to, error: friendly, providerCode: code };
    }

    await logSms(supabase, {
      companyId,
      from: fromNumber,
      to,
      body: args.body,
      direction: "outbound",
      status: "sent",
      source,
      providerMessageId: payload?.sid || null,
      metadata: {
        customer_name: args.customerName,
        appointment_id: args.appointmentId,
        provider: "signalwire",
        matched: guard.matchedName,
      },
    });
    return { ok: true, status: "sent", to, providerMessageId: payload?.sid };
  } catch (e: any) {
    const err = e?.message || String(e);
    await logSms(supabase, {
      companyId,
      from: fromNumber,
      to,
      body: args.body,
      direction: "outbound",
      status: "failed",
      source,
      error: err,
      metadata: { customer_name: args.customerName, appointment_id: args.appointmentId },
    });
    return { ok: false, status: "failed", to, error: err };
  }
}