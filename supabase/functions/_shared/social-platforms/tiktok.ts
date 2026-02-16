import { SocialPostRequest, SocialPostResult, TokenRefreshResult } from "./types.ts";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

/**
 * Publish content to TikTok using the Content Posting API.
 * TikTok requires a video or photo for posting — text-only posts are not supported.
 * 
 * Flow:
 * 1. Initialize a photo/video post via the creator info endpoint
 * 2. Upload media to the provided upload URL
 * 3. TikTok processes and publishes
 */
export async function publishToTikTok(req: SocialPostRequest): Promise<SocialPostResult> {
  const { content, imageUrl, videoUrl, accessToken } = req;

  if (!accessToken) {
    return { success: false, error: "Missing TikTok access token" };
  }

  try {
    if (videoUrl) {
      return await publishVideoToTikTok(content, videoUrl, accessToken);
    } else if (imageUrl) {
      return await publishPhotoToTikTok(content, imageUrl, accessToken);
    } else {
      return { success: false, error: "TikTok requires a video or photo for publishing" };
    }
  } catch (error) {
    return { success: false, error: `TikTok publish failed: ${(error as Error).message}` };
  }
}

async function publishPhotoToTikTok(
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<SocialPostResult> {
  // Step 1: Initialize photo post
  const initRes = await fetch(`${TIKTOK_API_BASE}/post/publish/content/init/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: "SELF_ONLY", // Start as private, user can change
        disable_comment: false,
        auto_add_music: true,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: [imageUrl],
      },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    }),
  });

  const initText = await initRes.text();
  let initData: Record<string, unknown>;
  try {
    initData = JSON.parse(initText);
  } catch {
    return { success: false, error: `Invalid TikTok response: ${initText.substring(0, 200)}` };
  }

  if (!initRes.ok || (initData.error as Record<string, string>)?.code !== "ok") {
    const errMsg = (initData.error as Record<string, string>)?.message || initText;
    return { success: false, error: `TikTok API error: ${errMsg}` };
  }

  const publishId = (initData.data as Record<string, string>)?.publish_id;
  return {
    success: true,
    postId: publishId,
    metadata: { mediaType: "photo", status: "processing" },
  };
}

async function publishVideoToTikTok(
  caption: string,
  videoUrl: string,
  accessToken: string
): Promise<SocialPostResult> {
  const initRes = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: "SELF_ONLY",
        disable_comment: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const initText = await initRes.text();
  let initData: Record<string, unknown>;
  try {
    initData = JSON.parse(initText);
  } catch {
    return { success: false, error: `Invalid TikTok response: ${initText.substring(0, 200)}` };
  }

  if (!initRes.ok || (initData.error as Record<string, string>)?.code !== "ok") {
    const errMsg = (initData.error as Record<string, string>)?.message || initText;
    return { success: false, error: `TikTok video API error: ${errMsg}` };
  }

  const publishId = (initData.data as Record<string, string>)?.publish_id;
  return {
    success: true,
    postId: publishId,
    metadata: { mediaType: "video", status: "processing" },
  };
}

/**
 * Refresh a TikTok access token using the refresh token.
 */
export async function refreshTikTokToken(
  clientKey: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenRefreshResult> {
  try {
    const res = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
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

    const expiresIn = (data.expires_in as number) || 86400;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      success: true,
      accessToken: data.access_token as string,
      expiresAt,
    };
  } catch (error) {
    return { success: false, error: `TikTok token refresh failed: ${(error as Error).message}` };
  }
}
