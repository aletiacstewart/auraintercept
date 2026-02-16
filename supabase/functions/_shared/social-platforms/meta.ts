import { SocialPostRequest, SocialPostResult, TokenRefreshResult } from "./types.ts";

const GRAPH_API_VERSION = "v24.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Publish a post to a Facebook Page via the Graph API.
 * Supports text-only and text+image posts.
 */
export async function publishToFacebook(req: SocialPostRequest): Promise<SocialPostResult> {
  const { content, imageUrl, accessToken, pageId } = req;

  if (!pageId) {
    return { success: false, error: "Missing Facebook Page ID" };
  }
  if (!accessToken) {
    return { success: false, error: "Missing Facebook Page Access Token" };
  }

  try {
    let response: Response;
    let postId: string;

    if (imageUrl) {
      // Photo post
      const url = `${GRAPH_API_BASE}/${pageId}/photos`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          message: content,
          access_token: accessToken,
        }),
      });
    } else {
      // Text-only post
      const url = `${GRAPH_API_BASE}/${pageId}/feed`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          access_token: accessToken,
        }),
      });
    }

    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: `Invalid API response: ${text.substring(0, 200)}` };
    }

    if (!response.ok) {
      const errorMsg = (data.error as Record<string, string>)?.message || text;
      return { success: false, error: `Facebook API error: ${errorMsg}` };
    }

    postId = (data.id || data.post_id) as string;
    return {
      success: true,
      postId,
      platformUrl: `https://www.facebook.com/${postId}`,
      metadata: { apiVersion: GRAPH_API_VERSION },
    };
  } catch (error) {
    return { success: false, error: `Facebook publish failed: ${(error as Error).message}` };
  }
}

/**
 * Publish a photo to Instagram via the Content Publishing API.
 * Requires an image URL (Instagram does not support text-only posts).
 */
export async function publishToInstagram(req: SocialPostRequest): Promise<SocialPostResult> {
  const { content, imageUrl, accessToken, accountId } = req;

  if (!accountId) {
    return { success: false, error: "Missing Instagram Business Account ID" };
  }
  if (!accessToken) {
    return { success: false, error: "Missing access token" };
  }
  if (!imageUrl) {
    return { success: false, error: "Instagram requires an image URL for publishing" };
  }

  try {
    // Step 1: Create a media container
    const containerUrl = `${GRAPH_API_BASE}/${accountId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken,
      }),
    });

    const containerText = await containerRes.text();
    let containerData: Record<string, unknown>;
    try {
      containerData = JSON.parse(containerText);
    } catch {
      return { success: false, error: `Invalid container response: ${containerText.substring(0, 200)}` };
    }

    if (!containerRes.ok) {
      const errorMsg = (containerData.error as Record<string, string>)?.message || containerText;
      return { success: false, error: `Instagram container error: ${errorMsg}` };
    }

    const containerId = containerData.id as string;

    // Step 2: Wait for container to be ready (poll status)
    let ready = false;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
      );
      const statusText = await statusRes.text();
      try {
        const statusData = JSON.parse(statusText);
        if (statusData.status_code === "FINISHED") {
          ready = true;
          break;
        }
        if (statusData.status_code === "ERROR") {
          return { success: false, error: "Instagram media processing failed" };
        }
      } catch {
        // Continue polling
      }
    }

    if (!ready) {
      return { success: false, error: "Instagram media processing timed out" };
    }

    // Step 3: Publish the container
    const publishUrl = `${GRAPH_API_BASE}/${accountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const publishText = await publishRes.text();
    let publishData: Record<string, unknown>;
    try {
      publishData = JSON.parse(publishText);
    } catch {
      return { success: false, error: `Invalid publish response: ${publishText.substring(0, 200)}` };
    }

    if (!publishRes.ok) {
      const errorMsg = (publishData.error as Record<string, string>)?.message || publishText;
      return { success: false, error: `Instagram publish error: ${errorMsg}` };
    }

    const postId = publishData.id as string;
    return {
      success: true,
      postId,
      platformUrl: `https://www.instagram.com/p/${postId}`,
      metadata: { containerId, apiVersion: GRAPH_API_VERSION },
    };
  } catch (error) {
    return { success: false, error: `Instagram publish failed: ${(error as Error).message}` };
  }
}

/**
 * Exchange a short-lived token for a long-lived one (60-day validity).
 */
export async function refreshMetaToken(
  appId: string,
  appSecret: string,
  shortLivedToken: string
): Promise<TokenRefreshResult> {
  try {
    const url = `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const res = await fetch(url);
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: `Invalid token response: ${text.substring(0, 200)}` };
    }

    if (!res.ok || data.error) {
      return { success: false, error: (data.error as Record<string, string>)?.message || text };
    }

    const expiresIn = (data.expires_in as number) || 5184000; // default 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      success: true,
      accessToken: data.access_token as string,
      expiresAt,
    };
  } catch (error) {
    return { success: false, error: `Token refresh failed: ${(error as Error).message}` };
  }
}
