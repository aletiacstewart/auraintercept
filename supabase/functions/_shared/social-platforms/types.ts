export interface SocialPostRequest {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  hashtags?: string[];
  accessToken: string;
  pageId?: string;
  accountId?: string;
  locationId?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface SocialPostResult {
  success: boolean;
  postId?: string;
  platformUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
}
