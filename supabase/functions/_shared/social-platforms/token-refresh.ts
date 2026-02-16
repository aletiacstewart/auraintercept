import { createClient } from "npm:@supabase/supabase-js@2";
import { refreshMetaToken } from "./meta.ts";
import { refreshLinkedInToken } from "./linkedin.ts";
import { refreshTikTokToken } from "./tiktok.ts";
import { refreshGoogleBusinessToken } from "./google-business.ts";
import { TokenRefreshResult } from "./types.ts";

/**
 * Helper to read platform-level credentials from the platform_settings table.
 */
async function getPlatformSetting(
  supabase: ReturnType<typeof createClient>,
  key: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .maybeSingle();

  if (error || !data) return null;
  return data.setting_value;
}

/**
 * Check and refresh tokens for a company's social integrations if they're
 * expiring within the threshold (default: 7 days).
 * 
 * Platform-level credentials (App ID/Secret) are read from the platform_settings table
 * instead of per-tenant tenant_integrations.
 */
export async function ensureFreshTokens(
  companyId: string,
  platform: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ accessToken: string | null; error?: string }> {
  const { data: integrations, error } = await supabase
    .from("tenant_integrations")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error || !integrations) {
    return { accessToken: null, error: "No integrations found for company" };
  }

  const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();

  switch (platform) {
    case "facebook":
    case "instagram": {
      const token = integrations.meta_page_access_token;
      const expiresAt = integrations.meta_token_expires_at;

      if (!token) {
        return { accessToken: null, error: "Meta access token not configured" };
      }

      // Check if token needs refresh
      if (expiresAt && new Date(expiresAt).getTime() - now < REFRESH_THRESHOLD_MS) {
        // Read platform-level credentials
        const appId = await getPlatformSetting(supabase, "META_APP_ID");
        const appSecret = await getPlatformSetting(supabase, "META_APP_SECRET");
        if (!appId || !appSecret) {
          return { accessToken: token, error: "Cannot refresh: platform Meta App ID or Secret not configured" };
        }

        const result = await refreshMetaToken(appId, appSecret, token);
        if (result.success && result.accessToken) {
          await supabase
            .from("tenant_integrations")
            .update({
              meta_page_access_token: result.accessToken,
              meta_token_expires_at: result.expiresAt,
            })
            .eq("company_id", companyId);

          return { accessToken: result.accessToken };
        }
        // If refresh fails, return existing token (may still work)
        console.warn(`[token-refresh] Meta token refresh failed: ${result.error}`);
      }

      return { accessToken: token };
    }

    case "linkedin": {
      const token = integrations.linkedin_access_token;
      const expiresAt = integrations.linkedin_token_expires_at;

      if (!token) {
        return { accessToken: null, error: "LinkedIn access token not configured" };
      }

      if (expiresAt && new Date(expiresAt).getTime() - now < REFRESH_THRESHOLD_MS) {
        // LinkedIn doesn't support refresh_token for all app types
        // Return existing token with a warning
        console.warn("[token-refresh] LinkedIn token expiring soon, manual re-auth may be needed");
      }

      return { accessToken: token };
    }

    case "tiktok": {
      const token = integrations.tiktok_access_token;
      const expiresAt = integrations.tiktok_token_expires_at;

      if (!token) {
        return { accessToken: null, error: "TikTok access token not configured" };
      }

      if (expiresAt && new Date(expiresAt).getTime() - now < REFRESH_THRESHOLD_MS) {
        // TikTok uses refresh tokens but we'd need to store them separately
        // For now, warn about expiring token
        console.warn("[token-refresh] TikTok token expiring soon, manual re-auth may be needed");
      }

      return { accessToken: token };
    }

    case "google_business": {
      const token = integrations.google_business_access_token;
      const refreshToken = integrations.google_business_refresh_token;

      if (!token && !refreshToken) {
        return { accessToken: null, error: "Google Business access token not configured" };
      }

      // Google tokens expire after 1 hour, always refresh if we have a refresh token
      if (refreshToken) {
        const clientId = await getPlatformSetting(supabase, "GOOGLE_CLIENT_ID");
        const clientSecret = await getPlatformSetting(supabase, "GOOGLE_CLIENT_SECRET");
        if (!clientId || !clientSecret) {
          return { accessToken: token, error: "Cannot refresh: platform Google Client ID or Secret not configured" };
        }

        const result = await refreshGoogleBusinessToken(clientId, clientSecret, refreshToken);
        if (result.success && result.accessToken) {
          await supabase
            .from("tenant_integrations")
            .update({
              google_business_access_token: result.accessToken,
            })
            .eq("company_id", companyId);

          return { accessToken: result.accessToken };
        }
        console.warn(`[token-refresh] Google Business token refresh failed: ${result.error}`);
      }

      return { accessToken: token };
    }

    default:
      return { accessToken: null, error: `Unknown platform: ${platform}` };
  }
}
