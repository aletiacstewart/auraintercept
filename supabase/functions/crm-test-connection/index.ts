import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = "hubspot" | "salesforce" | "zoho" | "pipedrive" | "generic";

interface TestBody {
  provider: Provider;
  credentials: Record<string, string>;
}

async function probe(provider: Provider, creds: Record<string, string>): Promise<{ ok: boolean; label?: string; error?: string }> {
  try {
    if (provider === "hubspot") {
      const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${creds.access_token || creds.api_key}` },
      });
      if (!r.ok) return { ok: false, error: `HubSpot ${r.status}` };
      return { ok: true, label: "HubSpot account" };
    }
    if (provider === "pipedrive") {
      const base = (creds.domain || "api").replace(/\/$/, "");
      const url = base.startsWith("http") ? `${base}/v1/users/me` : `https://${base}.pipedrive.com/v1/users/me`;
      const r = await fetch(`${url}?api_token=${encodeURIComponent(creds.api_key)}`);
      if (!r.ok) return { ok: false, error: `Pipedrive ${r.status}` };
      const j = await r.json();
      return { ok: true, label: j?.data?.email || "Pipedrive account" };
    }
    if (provider === "zoho") {
      const dc = creds.dc || "com";
      const r = await fetch(`https://www.zohoapis.${dc}/crm/v2/users?type=CurrentUser`, {
        headers: { Authorization: `Zoho-oauthtoken ${creds.access_token}` },
      });
      if (!r.ok) return { ok: false, error: `Zoho ${r.status}` };
      const j = await r.json();
      return { ok: true, label: j?.users?.[0]?.email || "Zoho CRM account" };
    }
    if (provider === "salesforce") {
      const instance = (creds.instance_url || "").replace(/\/$/, "");
      if (!instance || !creds.access_token) return { ok: false, error: "Missing instance_url or access_token" };
      const r = await fetch(`${instance}/services/data/v59.0/sobjects/Contact/?limit=1`, {
        headers: { Authorization: `Bearer ${creds.access_token}` },
      });
      if (!r.ok) return { ok: false, error: `Salesforce ${r.status}` };
      return { ok: true, label: instance.replace(/^https?:\/\//, "") };
    }
    if (provider === "generic") {
      // Generic webhook: just verify URL is reachable
      if (!creds.webhook_url) return { ok: false, error: "webhook_url required" };
      try { new URL(creds.webhook_url); } catch { return { ok: false, error: "Invalid webhook_url" }; }
      return { ok: true, label: new URL(creds.webhook_url).host };
    }
    return { ok: false, error: "Unknown provider" };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = (await req.json()) as TestBody;
    if (!body?.provider || !body?.credentials) {
      return new Response(JSON.stringify({ ok: false, error: "provider+credentials required" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await probe(body.provider, body.credentials);
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message || e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});