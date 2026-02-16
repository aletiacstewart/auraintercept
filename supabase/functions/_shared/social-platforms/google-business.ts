import { SocialPostRequest, SocialPostResult, TokenRefreshResult } from "./types.ts";

const GBP_API_BASE = "https://mybusiness.googleapis.com/v4";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Publish a local post to Google Business Profile.
 */
export async function publishToGoogleBusiness(req: SocialPostRequest): Promise<SocialPostResult> {
  const { content, imageUrl, accessToken, accountId, locationId } = req;

  if (!accessToken) {
    return { success: false, error: "Missing Google Business access token" };
  }
  if (!accountId || !locationId) {
    return { success: false, error: "Missing Google Business Account ID or Location ID" };
  }

  try {
    const parent = `accounts/${accountId}/locations/${locationId}`;

    const postBody: Record<string, unknown> = {
      languageCode: "en",
      summary: content,
      topicType: "STANDARD",
    };

    if (imageUrl) {
      postBody.media = [
        {
          mediaFormat: "PHOTO",
          sourceUrl: imageUrl,
        },
      ];
    }

    const res = await fetch(`${GBP_API_BASE}/${parent}/localPosts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postBody),
    });

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: `Invalid GBP response: ${text.substring(0, 200)}` };
    }

    if (!res.ok) {
      const errorMsg = ((data.error as Record<string, unknown>)?.message as string) || text;
      return { success: false, error: `Google Business API error: ${errorMsg}` };
    }

    const postName = data.name as string;
    return {
      success: true,
      postId: postName,
      platformUrl: (data.searchUrl as string) || undefined,
      metadata: { topicType: "STANDARD" },
    };
  } catch (error) {
    return { success: false, error: `Google Business publish failed: ${(error as Error).message}` };
  }
}

/**
 * Refresh a Google OAuth2 access token using a refresh token.
 */
export async function refreshGoogleBusinessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenRefreshResult> {
  try {
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: `Invalid token response: ${text.substring(0, 200)}` };
    }

    if (!res.ok || data.error) {
      return { success: false, error: (data.error_description as string) || text };
    }

    const expiresIn = (data.expires_in as number) || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      success: true,
      accessToken: data.access_token as string,
      expiresAt,
    };
  } catch (error) {
    return { success: false, error: `Google token refresh failed: ${(error as Error).message}` };
  }
}
