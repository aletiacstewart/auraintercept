import { createClient } from "npm:@supabase/supabase-js@2";
import { refreshMetaToken } from "./meta.ts";
import { refreshLinkedInToken } from "./linkedin.ts";
import { refreshTikTokToken } from "./tiktok.ts";
import { refreshGoogleBusinessToken } from "./google-business.ts";
import { TokenRefreshResult } from "./types.ts";

/**
 * Check and refresh tokens for a company's social integrations if they're
 * expiring within the threshold (default: 7 days).
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
        const appId = integrations.meta_app_id;
        const appSecret = integrations.meta_app_secret;
        if (!appId || !appSecret) {
          return { accessToken: token, error: "Cannot refresh: missing Meta App ID or Secret" };
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
        const clientId = integrations.linkedin_client_id;
        const clientSecret = integrations.linkedin_client_secret;
        if (!clientId || !clientSecret) {
          return { accessToken: token, error: "Cannot refresh: missing LinkedIn client credentials" };
        }

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
        const clientKey = integrations.tiktok_client_key;
        const clientSecret = integrations.tiktok_client_secret;
        if (!clientKey || !clientSecret) {
          return { accessToken: token, error: "Cannot refresh: missing TikTok client credentials" };
        }

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
        const clientId = integrations.google_business_client_id;
        const clientSecret = integrations.google_business_client_secret;
        if (!clientId || !clientSecret) {
          return { accessToken: token, error: "Cannot refresh: missing Google Business client credentials" };
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
