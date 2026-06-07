// send-walkthrough-demo
//
// Voice-driven entrypoint that turns a "Talk to Aura" conversation into a
// real, industry-matched 24-hour live walkthrough demo. Aura captures the
// caller's industry + name + phone + email, then calls this function. It:
//
//   1. Canonicalizes the industry and refuses HIPAA-gated verticals.
//   2. Rate-limits to 1 send per phone+email per 10 minutes (anti-pumping).
//   3. Internally calls `create-demo-trial` to spin up a real industry-loaded
//      demo company (already seeds appointments/leads with the right pack).
//   4. Inserts the prospect as a Lead on the Aura Intercept tenant so the
//      outbound SMS passes the sms-guard allowlist check.
//   5. Sends the share_url via SMS (SignalWire on the Aura tenant) plus the
//      transactional credentials email already produced by create-demo-trial.
//   6. Returns a short, voice-friendly confirmation string Aura can read back.
//
// CORS-open and verify_jwt=false so the ElevenLabs web client tool and the
// SignalWire SWAIG webhook can both invoke it without auth.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  toCanonicalIndustryId,
  isIndustryHipaaGated,
} from "../_shared/industry-aliases.ts";
import { sendGuardedSms, normalizeE164US } from "../_shared/sms-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Aura Intercept tenant — owns the outbound sales SMS line.
const AURA_TENANT_COMPANY_ID = "04c57cbe-358e-4036-a3ad-b777a55f5be0";
const PUBLIC_URL = "https://auraintercept.ai";
const RATE_LIMIT_MIN = 10;

// Human-friendly industry labels for SMS copy. Kept lightweight; the demo
// itself loads the full industry pack on auto-login.
const INDUSTRY_LABELS: Record<string, string> = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roofing: "Roofing",
  solar: "Solar",
  landscape: "Landscaping",
  pool_spa: "Pool & Spa",
  pest_control: "Pest Control",
  appliance_repair: "Appliance Repair",
  handyman: "Handyman",
  construction: "Construction",
  auto_care: "Auto Care",
  security_systems: "Security Systems",
  real_estate: "Real Estate",
  beauty_wellness: "Beauty & Wellness",
  restaurants: "Restaurants",
  personal_assistant: "Personal Assistant",
  fencing: "Fencing & Decking",
  other: "Service",
};

interface InvokePayload {
  industry?: string;
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  source?: "voice_web" | "voice_phone" | string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const payload = (await req.json().catch(() => ({}))) as InvokePayload;
    const rawIndustry = String(payload.industry || "").trim().toLowerCase();
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();
    const businessName = String(
      payload.company_name || `${name || "New"} Demo Co.`,
    ).trim();
    const source = payload.source === "voice_phone"
      ? "voice_phone"
      : "voice_web";

    if (!rawIndustry || !name || !email || !phone) {
      return jsonResponse({
        ok: false,
        spoken:
          "I still need a few details — could you confirm your industry, name, mobile number, and email?",
      });
    }

    // 1. Canonicalize industry + refuse HIPAA-gated verticals.
    const canonical = toCanonicalIndustryId(rawIndustry) ?? "other";
    if (isIndustryHipaaGated(canonical)) {
      return jsonResponse({
        ok: false,
        reason: "industry_unavailable",
        spoken:
          "That vertical isn't open for self-serve demos yet — let me have someone from our team reach out to you instead.",
      });
    }
    const industryLabel = INDUSTRY_LABELS[canonical] || "Service";

    // 2. Normalize phone and rate-limit per phone+email.
    const normalizedPhone = normalizeE164US(phone) || phone;
    const cutoff = new Date(Date.now() - RATE_LIMIT_MIN * 60 * 1000)
      .toISOString();
    const { data: recent } = await admin
      .from("demo_trials")
      .select("id, created_at, company_id")
      .or(
        `prospect_email.eq.${email},prospect_phone.eq.${normalizedPhone}`,
      )
      .gt("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      return jsonResponse({
        ok: true,
        already_sent: true,
        spoken:
          "I already sent you that link a few minutes ago — check your texts and email. Want me to walk you through it once you've tapped it?",
      });
    }

    // 3. Insert prospect as a Lead on the Aura Intercept tenant so the
    //    outbound SMS guard accepts the recipient. Best-effort; failure here
    //    still allows the demo to be created and emailed.
    try {
      await admin.from("leads").insert({
        company_id: AURA_TENANT_COMPANY_ID,
        name,
        email,
        phone: normalizedPhone,
        source: source === "voice_phone" ? "voice" : "widget",
        intent: "demo_walkthrough",
        service_interest: `${industryLabel} live walkthrough`,
        priority: "hot",
        score: 85,
        status: "new",
      });
    } catch (leadErr) {
      console.warn("[send-walkthrough-demo] lead insert failed:", leadErr);
    }

    // 4. Spin up the real industry-matched demo via the existing trial flow.
    const trialResp = await admin.functions.invoke("create-demo-trial", {
      body: {
        name,
        email,
        phone: normalizedPhone,
        business_name: businessName,
        industry: canonical,
        sms_opt_in: true,
        email_opt_in: false,
      },
    });
    if (trialResp.error || !(trialResp.data as any)?.success) {
      const err = (trialResp.data as any)?.error ||
        trialResp.error?.message || "trial_create_failed";
      // create-demo-trial returns success:false with a friendly message when
      // the prospect already has an active trial — surface it to Aura.
      if (typeof err === "string" && err.toLowerCase().includes("already")) {
        return jsonResponse({
          ok: true,
          already_sent: true,
          spoken:
            "Looks like you already have an active Aura demo — check your email for the link, or I can have a person walk you through it live.",
        });
      }
      console.error("[send-walkthrough-demo] trial create failed:", err);
      return jsonResponse({
        ok: false,
        spoken:
          "I hit a snag setting up the live demo. Want me to grab your details so a teammate can text you the link in a minute?",
      });
    }

    const trial = trialResp.data as {
      trial_id: string;
      share_url: string;
      industry_label: string;
      expires_at: string;
    };

    // 5. SMS the share_url via the Aura tenant's SignalWire line.
    let smsStatus: "sent" | "failed" | "blocked" = "failed";
    try {
      const { data: integ } = await admin
        .from("tenant_integrations")
        .select("signalwire_phone_number")
        .eq("company_id", AURA_TENANT_COMPANY_ID)
        .maybeSingle();

      const fromNumber = integ?.signalwire_phone_number || "";
      const smsBody =
        `Hey ${name.split(" ")[0] || ""}, here's your live ${industryLabel} ` +
        `walkthrough of Aura: ${trial.share_url}\n` +
        `Tap to open — your demo is pre-loaded with sample ${industryLabel} ` +
        `jobs and an AI receptionist ready to take calls. Expires in 48h.`;

      const result = await sendGuardedSms({
        supabase: admin,
        companyId: AURA_TENANT_COMPANY_ID,
        from: fromNumber,
        to: normalizedPhone,
        body: smsBody,
        source: "aura",
        customerName: name,
      });
      smsStatus = result.status;
      if (!result.ok) {
        console.warn(
          `[send-walkthrough-demo] SMS not sent: ${result.error || result.status}`,
        );
      }
    } catch (smsErr) {
      console.error("[send-walkthrough-demo] SMS error:", smsErr);
    }

    // 6. Voice-friendly confirmation string for Aura to read back.
    const channelsSent =
      smsStatus === "sent" ? "text and email" : "email";
    const spoken =
      `Perfect, ${name.split(" ")[0] || "there"} — I just sent your live ` +
      `${industryLabel} walkthrough to your ${channelsSent}. ` +
      `Tap the link and I'll meet you inside the demo. It's good for 48 hours.`;

    return jsonResponse({
      ok: true,
      spoken,
      demo_url: trial.share_url,
      industry: canonical,
      industry_label: industryLabel,
      expires_at: trial.expires_at,
      sms_status: smsStatus,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-walkthrough-demo] fatal:", msg);
    return jsonResponse(
      {
        ok: false,
        spoken:
          "Something went wrong on my end. Can a teammate text you the demo link in a couple minutes?",
        error: msg,
      },
      200,
    );
  }
});