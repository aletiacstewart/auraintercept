import { SocialPostRequest, SocialPostResult, TokenRefreshResult } from "./types.ts";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_COMMUNITY_BASE = "https://api.linkedin.com/rest";

/**
 * Publish a post to a LinkedIn Organization page.
 * Uses the Community Management API (Posts API).
 */
export async function publishToLinkedIn(req: SocialPostRequest): Promise<SocialPostResult> {
  const { content, imageUrl, accessToken, accountId } = req;

  if (!accessToken) {
    return { success: false, error: "Missing LinkedIn access token" };
  }
  if (!accountId) {
    return { success: false, error: "Missing LinkedIn Organization ID" };
  }

  try {
    const author = `urn:li:organization:${accountId}`;

    if (imageUrl) {
      return await publishImagePost(content, imageUrl, accessToken, author);
    } else {
      return await publishTextPost(content, accessToken, author);
    }
  } catch (error) {
    return { success: false, error: `LinkedIn publish failed: ${(error as Error).message}` };
  }
}

async function publishTextPost(
  content: string,
  accessToken: string,
  author: string
): Promise<SocialPostResult> {
  const res = await fetch(`${LINKEDIN_COMMUNITY_BASE}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
    body: JSON.stringify({
      author,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    let errorMsg = text;
    try {
      const data = JSON.parse(text);
      errorMsg = data.message || data.error || text;
    } catch { /* use raw text */ }
    return { success: false, error: `LinkedIn API error: ${errorMsg}` };
  }

  // LinkedIn returns the post URN in the x-restli-id header
  const postUrn = res.headers.get("x-restli-id") || "";
  return {
    success: true,
    postId: postUrn,
    platformUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined,
  };
}

async function publishImagePost(
  content: string,
  imageUrl: string,
  accessToken: string,
  author: string
): Promise<SocialPostResult> {
  // Step 1: Initialize image upload
  const initRes = await fetch(`${LINKEDIN_COMMUNITY_BASE}/images?action=initializeUpload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: author,
      },
    }),
  });

  const initText = await initRes.text();
  let initData: Record<string, unknown>;
  try {
    initData = JSON.parse(initText);
  } catch {
    return { success: false, error: `Invalid LinkedIn upload init response: ${initText.substring(0, 200)}` };
  }

  if (!initRes.ok) {
    return { success: false, error: `LinkedIn upload init failed: ${(initData as Record<string, string>).message || initText}` };
  }

  const uploadUrl = ((initData.value as Record<string, string>)?.uploadUrl) as string;
  const imageUrn = ((initData.value as Record<string, string>)?.image) as string;

  if (!uploadUrl || !imageUrn) {
    return { success: false, error: "LinkedIn did not return upload URL or image URN" };
  }

  // Step 2: Download image and upload to LinkedIn
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return { success: false, error: `Failed to download image from ${imageUrl}` };
  }
  const imageBuffer = await imageRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    return { success: false, error: "Failed to upload image to LinkedIn" };
  }

  // Step 3: Create the post with the image
  const postRes = await fetch(`${LINKEDIN_COMMUNITY_BASE}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
    body: JSON.stringify({
      author,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          id: imageUrn,
        },
      },
      lifecycleState: "PUBLISHED",
    }),
  });

  const postText = await postRes.text();
  if (!postRes.ok) {
    let errorMsg = postText;
    try {
      const data = JSON.parse(postText);
      errorMsg = data.message || data.error || postText;
    } catch { /* use raw text */ }
    return { success: false, error: `LinkedIn post error: ${errorMsg}` };
  }

  const postUrn = postRes.headers.get("x-restli-id") || "";
  return {
    success: true,
    postId: postUrn,
    platformUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined,
    metadata: { imageUrn },
  };
}

/**
 * Refresh a LinkedIn access token.
 */
export async function refreshLinkedInToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenRefreshResult> {
  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
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

    const expiresIn = (data.expires_in as number) || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      success: true,
      accessToken: data.access_token as string,
      expiresAt,
    };
  } catch (error) {
    return { success: false, error: `LinkedIn token refresh failed: ${(error as Error).message}` };
  }
}
