import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlatformCredentials {
  clientId: string;
  clientSecret: string;
}

async function getPlatformCredentials(
  supabase: ReturnType<typeof createClient>,
  platform: string,
  companyId?: string
): Promise<PlatformCredentials | null> {
  const keyMap: Record<string, { id: string; secret: string; tenantId: string; tenantSecret: string }> = {
    facebook: { id: "META_APP_ID", secret: "META_APP_SECRET", tenantId: "meta_app_id", tenantSecret: "meta_app_secret" },
    instagram: { id: "META_APP_ID", secret: "META_APP_SECRET", tenantId: "meta_app_id", tenantSecret: "meta_app_secret" },
    linkedin: { id: "LINKEDIN_CLIENT_ID", secret: "LINKEDIN_CLIENT_SECRET", tenantId: "linkedin_client_id", tenantSecret: "linkedin_client_secret" },
    tiktok: { id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET", tenantId: "tiktok_client_key", tenantSecret: "tiktok_client_secret" },
    google_business: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET", tenantId: "google_business_client_id", tenantSecret: "google_business_client_secret" },
  };

  const keys = keyMap[platform];
  if (!keys) return null;

  // 1. Check tenant-level credentials first
  if (companyId) {
    const { data: tenantData } = await supabase
      .from("tenant_integrations")
      .select(`${keys.tenantId}, ${keys.tenantSecret}`)
      .eq("company_id", companyId)
      .maybeSingle();

    if (tenantData) {
      const tenantId = (tenantData as any)[keys.tenantId];
      const tenantSecret = (tenantData as any)[keys.tenantSecret];
      if (tenantId && tenantSecret) {
        console.log(`[social-oauth] Using tenant-level credentials for ${platform}`);
        return { clientId: tenantId, clientSecret: tenantSecret };
      }
    }
  }

  // 2. Fall back to platform-level (global) credentials
  const { data, error } = await supabase
    .from("platform_settings")
    .select("setting_key, setting_value")
    .in("setting_key", [keys.id, keys.secret]);

  if (error || !data || data.length < 2) return null;

  const idRow = data.find((r: any) => r.setting_key === keys.id);
  const secretRow = data.find((r: any) => r.setting_key === keys.secret);

  if (!idRow?.setting_value || !secretRow?.setting_value) return null;

  return { clientId: idRow.setting_value, clientSecret: secretRow.setting_value };
}

function buildOAuthUrl(platform: string, creds: PlatformCredentials, redirectUri: string, state: string): string {
  switch (platform) {
    case "facebook":
    case "instagram": {
      const scopes = platform === "instagram"
        ? "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management,pages_manage_posts"
        : "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,pages_manage_metadata";
      return `https://www.facebook.com/v24.0/dialog/oauth?client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
    }
    case "linkedin":
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20w_member_social%20r_organization_social%20w_organization_social&state=${state}`;
    case "tiktok":
      return `https://www.tiktok.com/v2/auth/authorize/?client_key=${creds.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user.info.basic,video.publish,video.upload&response_type=code&state=${state}`;
    case "google_business":
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/business.manage&response_type=code&state=${state}&access_type=offline&prompt=consent`;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function exchangeCodeForTokens(
  platform: string,
  code: string,
  creds: PlatformCredentials,
  redirectUri: string,
  supabase: ReturnType<typeof createClient>,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (platform) {
      case "facebook":
      case "instagram": {
        // Exchange code for short-lived token
        const tokenRes = await fetch(
          `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${creds.clientSecret}&code=${code}`
        );
        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error.message);

        // Exchange for long-lived token
        const longRes = await fetch(
          `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${creds.clientId}&client_secret=${creds.clientSecret}&fb_exchange_token=${tokenData.access_token}`
        );
        const longData = await longRes.json();
        const userToken = longData.access_token || tokenData.access_token;

        // Get pages
        const pagesRes = await fetch(
          `https://graph.facebook.com/v24.0/me/accounts?access_token=${userToken}`
        );
        const pagesData = await pagesRes.json();
        const pages = pagesData.data || [];

        if (pages.length === 0) {
          return { success: false, error: "No Facebook Pages found. Please ensure you manage at least one Facebook Page." };
        }

        const page = pages[0]; // Use first page
        const pageToken = page.access_token;
        const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // ~60 days

        // Update tenant_integrations
        const updates: Record<string, any> = {
          meta_page_access_token: pageToken,
          meta_page_id: page.id,
          meta_token_expires_at: expiresAt,
        };

        // For Instagram, also fetch IG business account
        if (platform === "instagram") {
          const igRes = await fetch(
            `https://graph.facebook.com/v24.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`
          );
          const igData = await igRes.json();
          if (igData.instagram_business_account) {
            updates.meta_instagram_account_id = igData.instagram_business_account.id;
          }
        }

        // Upsert tenant_integrations
        const { data: existing } = await supabase
          .from("tenant_integrations")
          .select("id")
          .eq("company_id", companyId)
          .maybeSingle();

        if (existing) {
          await supabase.from("tenant_integrations").update(updates).eq("company_id", companyId);
        } else {
          await supabase.from("tenant_integrations").insert({ company_id: companyId, ...updates });
        }

        // Upsert social_accounts
        await supabase.from("social_accounts").upsert({
          company_id: companyId,
          platform,
          platform_account_id: platform === "instagram" ? (updates.meta_instagram_account_id || page.id) : page.id,
          platform_account_name: page.name,
          is_active: true,
          connected_at: new Date().toISOString(),
          last_error: null,
        }, { onConflict: "company_id,platform" });

        return { success: true };
      }

      case "linkedin": {
        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        const expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000).toISOString();

        // Get user profile
        const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();

        const { data: existing } = await supabase
          .from("tenant_integrations")
          .select("id")
          .eq("company_id", companyId)
          .maybeSingle();

        const updates = {
          linkedin_access_token: tokenData.access_token,
          linkedin_token_expires_at: expiresAt,
        };

        if (existing) {
          await supabase.from("tenant_integrations").update(updates).eq("company_id", companyId);
        } else {
          await supabase.from("tenant_integrations").insert({ company_id: companyId, ...updates });
        }

        await supabase.from("social_accounts").upsert({
          company_id: companyId,
          platform: "linkedin",
          platform_account_id: profile.sub || "linkedin-user",
          platform_account_name: profile.name || profile.email || "LinkedIn User",
          is_active: true,
          connected_at: new Date().toISOString(),
          last_error: null,
        }, { onConflict: "company_id,platform" });

        return { success: true };
      }

      case "tiktok": {
        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_key: creds.clientId,
            client_secret: creds.clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error || !tokenData.data?.access_token) {
          throw new Error(tokenData.error?.message || "Failed to get TikTok token");
        }

        const data = tokenData.data;
        const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString();

        const { data: existing } = await supabase
          .from("tenant_integrations")
          .select("id")
          .eq("company_id", companyId)
          .maybeSingle();

        const updates = {
          tiktok_access_token: data.access_token,
          tiktok_token_expires_at: expiresAt,
        };

        if (existing) {
          await supabase.from("tenant_integrations").update(updates).eq("company_id", companyId);
        } else {
          await supabase.from("tenant_integrations").insert({ company_id: companyId, ...updates });
        }

        await supabase.from("social_accounts").upsert({
          company_id: companyId,
          platform: "tiktok",
          platform_account_id: data.open_id || "tiktok-user",
          platform_account_name: "TikTok Account",
          is_active: true,
          connected_at: new Date().toISOString(),
          last_error: null,
        }, { onConflict: "company_id,platform" });

        return { success: true };
      }

      case "google_business": {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        const { data: existing } = await supabase
          .from("tenant_integrations")
          .select("id")
          .eq("company_id", companyId)
          .maybeSingle();

        const updates: Record<string, any> = {
          google_business_access_token: tokenData.access_token,
          google_business_refresh_token: tokenData.refresh_token || null,
        };

        if (existing) {
          await supabase.from("tenant_integrations").update(updates).eq("company_id", companyId);
        } else {
          await supabase.from("tenant_integrations").insert({ company_id: companyId, ...updates });
        }

        // Try to get account info
        let accountName = "Google Business";
        try {
          const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const accData = await accRes.json();
          if (accData.accounts?.[0]) {
            accountName = accData.accounts[0].accountName || accountName;
            await supabase.from("tenant_integrations").update({
              google_business_account_id: accData.accounts[0].name,
            }).eq("company_id", companyId);
          }
        } catch (e) {
          console.warn("[social-oauth] Could not fetch Google Business accounts:", e);
        }

        await supabase.from("social_accounts").upsert({
          company_id: companyId,
          platform: "google_business",
          platform_account_id: "google-business",
          platform_account_name: accountName,
          is_active: true,
          connected_at: new Date().toISOString(),
          last_error: null,
        }, { onConflict: "company_id,platform" });

        return { success: true };
      }

      default:
        return { success: false, error: `Unsupported platform: ${platform}` };
    }
  } catch (error) {
    console.error(`[social-oauth] Token exchange error for ${platform}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Token exchange failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "init") {
      const platform = url.searchParams.get("platform");
      const companyId = url.searchParams.get("company_id");
      const redirectUri = url.searchParams.get("redirect_uri");

      if (!platform || !companyId || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Missing required params: platform, company_id, redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const creds = await getPlatformCredentials(supabase, platform, companyId);
      if (!creds) {
        return new Response(
          JSON.stringify({ error: `Platform credentials not configured for ${platform}. A platform admin must configure them in Platform Settings.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const state = btoa(JSON.stringify({ platform, companyId }));
      const oauthUrl = buildOAuthUrl(platform, creds, redirectUri, state);

      return new Response(
        JSON.stringify({ url: oauthUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        return new Response(
          JSON.stringify({ error: `OAuth denied: ${error}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: "Missing code or state parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let stateData: { platform: string; companyId: string };
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { platform, companyId } = stateData;
      const redirectUri = url.searchParams.get("redirect_uri") || `${supabaseUrl}/functions/v1/social-oauth?action=callback`;

      const creds = await getPlatformCredentials(supabase, platform, companyId);
      if (!creds) {
        return new Response(
          JSON.stringify({ error: `Platform credentials not configured for ${platform}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await exchangeCodeForTokens(platform, code, creds, redirectUri, supabase, companyId);

      if (result.success) {
        // Return HTML that closes the popup and signals success to opener
        return new Response(
          `<!DOCTYPE html><html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'social-oauth-success', platform: '${platform}' }, '*');
            }
            window.close();
          </script><p>Connected successfully! You can close this window.</p></body></html>`,
          { headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      } else {
        return new Response(
          `<!DOCTYPE html><html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'social-oauth-error', platform: '${platform}', error: '${result.error?.replace(/'/g, "\\'")}' }, '*');
            }
            window.close();
          </script><p>Connection failed: ${result.error}. You can close this window.</p></body></html>`,
          { headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=init or ?action=callback" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[social-oauth] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
