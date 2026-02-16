
# Unified Social Media Publishing: Architecture Options

## Current State
Your `publish-social-content` edge function currently **simulates** publishing -- it doesn't actually call any platform APIs. The `social-webhook` function only handles Meta webhook verification. This means you're starting from scratch for real publishing, which is actually a good position to pick the right architecture.

## Option Comparison

| Approach | Cost | Pros | Cons |
|----------|------|------|------|
| **UniAPI (browser automation)** | Free (self-hosted) | No API approval needed, bypasses rate limits | Requires a server running Playwright 24/7, fragile (breaks when platforms update UI), violates platform ToS, accounts can get banned |
| **Mixpost (self-hosted)** | Free (self-hosted) | Full-featured, Laravel-based, 11 platforms, scheduling, analytics | Requires separate VPS, PHP/Laravel stack (different from your architecture), heavy to maintain |
| **SocialRing (self-hosted)** | Free (self-hosted) | OAuth-based (legitimate), open source, self-hosted | Early-stage project, limited platform support |
| **Postproxy (hosted API)** | Paid per post | Single API call for all platforms, handles OAuth/tokens, delivery guarantees | Monthly cost, external dependency |
| **Build a Unified Edge Function (recommended)** | Free (API-level) | Fits your existing architecture, uses official APIs you're already setting up credentials for, no extra servers | You still need per-platform API credentials (which you're already configuring) |

## Recommendation: Unified Social Publisher Edge Function

Since you're already walking users through setting up Meta, LinkedIn, TikTok, and Google Business API credentials via the setup guide, the most practical approach is to **replace your simulated publisher with a real unified edge function** that routes to each platform's official API through a single interface.

This avoids:
- Running a separate server (browser automation needs Playwright/Puppeteer running 24/7)
- ToS violations and account bans (browser automation risk)
- Monthly fees from third-party services
- Maintaining a separate tech stack (PHP/Laravel for Mixpost)

## Implementation Plan

### 1. Create a shared social API adapter layer

Create `supabase/functions/_shared/social-platforms/` with platform-specific posting modules:

- `meta.ts` -- Handles both Facebook and Instagram via Graph API v24.0
- `tiktok.ts` -- TikTok Content Posting API
- `linkedin.ts` -- LinkedIn Share API (UGC Posts)
- `google-business.ts` -- Google Business Profile API

Each adapter exports a unified interface:
```typescript
interface SocialPostResult {
  success: boolean;
  postId?: string;
  platformUrl?: string;
  error?: string;
}

interface SocialPostRequest {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  accessToken: string;
  pageId?: string;      // For Facebook/Instagram
  accountId?: string;   // For platform-specific IDs
}

export async function publishToMeta(req: SocialPostRequest): Promise<SocialPostResult>
export async function publishToTikTok(req: SocialPostRequest): Promise<SocialPostResult>
export async function publishToLinkedIn(req: SocialPostRequest): Promise<SocialPostResult>
export async function publishToGoogleBusiness(req: SocialPostRequest): Promise<SocialPostResult>
```

### 2. Rewrite `publish-social-content` edge function

Replace the simulated logic with real API calls:
- Read the draft from `social_content_drafts`
- Look up the tenant's stored credentials from `tenant_integrations`
- Route to the correct platform adapter
- Handle errors, retries, and status updates
- Return the real post ID and URL

### 3. Add a token refresh utility

Create `supabase/functions/_shared/social-platforms/token-refresh.ts`:
- Auto-refresh Meta long-lived tokens (they expire after 60 days)
- Handle LinkedIn token refresh
- Store updated tokens back in `tenant_integrations`

### 4. Update the setup guide

Add a "Test Connection" step at the end of each platform's setup that calls the edge function with a test post to verify credentials are working.

## Files to Create/Modify

- **Create**: `supabase/functions/_shared/social-platforms/types.ts` -- Shared interfaces
- **Create**: `supabase/functions/_shared/social-platforms/meta.ts` -- Facebook + Instagram posting
- **Create**: `supabase/functions/_shared/social-platforms/tiktok.ts` -- TikTok posting
- **Create**: `supabase/functions/_shared/social-platforms/linkedin.ts` -- LinkedIn posting
- **Create**: `supabase/functions/_shared/social-platforms/google-business.ts` -- Google Business posting
- **Create**: `supabase/functions/_shared/social-platforms/token-refresh.ts` -- Token management
- **Modify**: `supabase/functions/publish-social-content/index.ts` -- Replace simulation with real API calls

## Why Not Browser Automation?

Browser automation (UniAPI, social-poster) is tempting but comes with serious risks:
- **Account bans**: Platforms actively detect and ban automated browser sessions
- **Fragility**: Any UI change by the platform breaks your automation
- **Infrastructure**: Requires a persistent server running headless browsers (not possible in edge functions)
- **ToS violations**: Can result in permanent account suspension for your clients

Since you're already guiding users through official API setup, you already have the credentials needed -- you just need the code to use them.
