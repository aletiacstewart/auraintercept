// Shared, side-effect-free probes for third-party integrations.
// Used by both the nightly sweep (integration-health-check) and the
// on-demand per-company check (check-integration-health).

export interface TenantIntegrationRow {
  company_id: string;
  resend_api_key?: string | null;
  signalwire_project_id?: string | null;
  signalwire_api_token?: string | null;
  signalwire_space_url?: string | null;
  signalwire_campaign_status?: string | null;
  google_refresh_token?: string | null;
  elevenlabs_api_key?: string | null;
  stripe_secret_key?: string | null;
}

export interface ProbeResult {
  company_id: string;
  integration_name: string;
  status: "connected" | "degraded" | "error" | "not_configured";
  error_message: string | null;
}

async function probe(
  company_id: string,
  integration_name: string,
  run: () => Promise<Response>,
): Promise<ProbeResult> {
  try {
    const resp = await run();
    if (resp.ok) {
      return { company_id, integration_name, status: "connected", error_message: null };
    }
    return {
      company_id,
      integration_name,
      status: "error",
      error_message: `Provider responded ${resp.status}`,
    };
  } catch (e) {
    return {
      company_id,
      integration_name,
      status: "error",
      error_message: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Probe every configured integration on a tenant_integrations row. */
export async function probeTenantIntegrations(
  r: TenantIntegrationRow,
): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];
  const cid = r.company_id;

  // Google Calendar: refresh-token exchange
  if (r.google_refresh_token) {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    if (clientId && clientSecret) {
      results.push(
        await probe(cid, "google_calendar", () =>
          fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: r.google_refresh_token!,
              grant_type: "refresh_token",
            }),
          }),
        ),
      );
    }
  }

  // SignalWire (calls & texts)
  if (r.signalwire_project_id && r.signalwire_api_token && r.signalwire_space_url) {
    results.push(
      await probe(cid, "signalwire", () =>
        fetch(
          `https://${r.signalwire_space_url}/api/laml/2010-04-01/Accounts/${r.signalwire_project_id}.json`,
          {
            headers: {
              Authorization: `Basic ${btoa(`${r.signalwire_project_id}:${r.signalwire_api_token}`)}`,
            },
          },
        ),
      ),
    );
  }

  // Resend (email)
  if (r.resend_api_key) {
    results.push(
      await probe(cid, "resend", () =>
        fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${r.resend_api_key}` },
        }),
      ),
    );
  }

  // ElevenLabs (AI voice)
  if (r.elevenlabs_api_key) {
    results.push(
      await probe(cid, "elevenlabs", () =>
        fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": r.elevenlabs_api_key! },
        }),
      ),
    );
  }

  // Stripe (payments)
  if (r.stripe_secret_key) {
    results.push(
      await probe(cid, "stripe", () =>
        fetch("https://api.stripe.com/v1/account", {
          headers: { Authorization: `Bearer ${r.stripe_secret_key}` },
        }),
      ),
    );
  }

  // A2P 10DLC registration state (reported only, never re-registered)
  const badA2P = new Set(["REJECTED", "FAILED", "EXPIRED", "SUSPENDED"]);
  if (r.signalwire_campaign_status) {
    const s = String(r.signalwire_campaign_status).toUpperCase();
    results.push({
      company_id: cid,
      integration_name: "a2p_10dlc",
      status: badA2P.has(s) ? "error" : s === "REGISTERED" || s === "APPROVED" ? "connected" : "degraded",
      error_message: badA2P.has(s) ? `Campaign status ${r.signalwire_campaign_status}` : null,
    });
  }

  return results;
}
