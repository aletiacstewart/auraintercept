
# Option A: Platform-Level OAuth for All Social Media

## What Changes

Instead of each tenant company creating their own developer apps and entering API credentials manually, **Aura Intercept registers ONE app per platform** (as a Tech Provider). Tenants simply click "Connect with Facebook/LinkedIn/TikTok/Google" and authorize through a standard OAuth popup.

## Architecture Shift

**Current flow (per-tenant):**
Tenant creates Meta App --> copies App ID/Secret --> pastes into form --> manually generates tokens

**New flow (platform app):**
Tenant clicks "Connect Facebook" --> OAuth popup --> authorizes Aura Intercept --> tokens stored automatically

The platform's App ID and App Secret for each platform become **backend secrets** (environment variables), not per-tenant fields. The `tenant_integrations` table still stores each tenant's **access tokens, page IDs, and account IDs** -- but no longer stores `meta_app_id`, `meta_app_secret`, `linkedin_client_id`, etc.

## Implementation Steps

### 1. Create `social-oauth` Edge Function
A new backend function that handles the complete OAuth flow for all 4 platforms:
- **`/init`** -- Generates the OAuth authorization URL with the correct scopes and redirect URI, returns it to the frontend to open in a popup
- **`/callback`** -- Receives the authorization code from the platform, exchanges it for access tokens, fetches page/account details, and stores everything in `tenant_integrations` and `social_accounts`

Platform-specific logic:
- **Meta (Facebook/Instagram):** Exchange code for user token, then get Page tokens, then exchange for long-lived tokens (60 days). Fetch linked Instagram Business Account ID automatically.
- **LinkedIn:** Exchange code for access token (60-day expiry). Fetch organization list for company pages.
- **TikTok:** Exchange code for access token + refresh token. Fetch user open_id.
- **Google Business:** Exchange code for access token + refresh token. Fetch account and location IDs.

### 2. Create `social-oauth-deauthorize` Edge Function
Handles deauthorization callbacks from Meta (required for App Review).

### 3. Create `social-oauth-data-deletion` Edge Function
Handles data deletion requests from Meta (required for App Review and GDPR compliance). Returns a confirmation URL and tracking code.

### 4. Add Platform Secrets
The following secrets need to be configured (these are YOUR platform-level credentials, not per-tenant):
- `META_APP_ID` and `META_APP_SECRET` -- From your Meta Tech Provider app
- `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` -- From your LinkedIn Developer app
- `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` -- From your TikTok Developer app
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` already exist as secrets

### 5. Update `SocialMediaIntegration.tsx` Page
- **Remove** the manual credential input dialog (App ID/Secret fields)
- **Replace** with "Connect with [Platform]" buttons that trigger the OAuth popup flow
- Show connection status with account name, connected date, and a disconnect button
- The `SOCIAL_INTEGRATIONS` array drops the `fields` property entirely

### 6. Rewrite `SocialMediaSetupGuide.tsx` -- All 5 Platforms
The guides shift from "how to create your own developer app" to **"how Aura Intercept's platform admin registers the master app once"**. This is a one-time setup by the platform owner, not by each tenant.

**Meta (Facebook + Instagram) -- New Guide:**
1. Register as a Meta Developer at developers.facebook.com
2. Create a "Business" type app and select "Tech Provider" use case
3. In Settings > Basic: set App Domains, Privacy Policy URL, Terms of Service URL, Data Deletion URL, Deauthorize Callback URL (copyable URLs provided)
4. Configure Facebook Login product: add Valid OAuth Redirect URI (copyable)
5. Add permissions: pages_manage_posts, pages_read_engagement, pages_show_list, instagram_basic, instagram_content_publish, instagram_manage_messages
6. Configure Webhooks: set Callback URL and Verify Token, subscribe to feed, messages, messaging_postbacks
7. Business Verification: upload legal documents (business license, utility bill, etc.)
8. App Review: submit all permissions with screencast demo and use-case descriptions
9. Go Live: toggle from Development to Live mode
10. Required documents checklist: Privacy Policy, Terms of Service, Data Processing Agreement

**LinkedIn -- New Guide:**
1. Go to linkedin.com/developers/apps and create app
2. Link to a LinkedIn Company Page (verified admin required)
3. In Auth tab: add OAuth Redirect URI (copyable), note Client ID and Secret
4. Request Products: "Share on LinkedIn" (instant) and "Sign In with LinkedIn using OpenID Connect"
5. For Company Page posting: apply for "Marketing Developer Platform" (include use-case description, expected volume, company website)
6. Required scopes: w_member_social, r_liteprofile, r_organization_social, w_organization_social
7. Submit verification documents if requested

**TikTok -- New Guide:**
1. Register at developers.tiktok.com
2. Create app, select "Content Posting API" use case
3. Add OAuth Redirect URI (copyable)
4. Enable Login Kit and Content Posting products
5. Request "Direct Post" scope
6. Submit for review with use-case description and demo video
7. Note: AI-generated content must include is_aigc flag (handled automatically)

**Google Business -- New Guide:**
1. Go to Google Cloud Console, create/select project
2. Enable "Business Profile API" and "My Business Business Information API"
3. Create OAuth 2.0 credentials (Web Application type), add redirect URI (copyable)
4. Configure OAuth Consent Screen: add business.manage scope
5. Submit verification request for production access
6. Add test users during development

Each guide includes:
- Required documents (Privacy Policy, ToS, etc.)
- Copyable URLs for OAuth redirect, webhooks, deauthorize, data deletion endpoints
- Direct links to developer consoles and documentation
- Estimated review timelines

### 7. Update `token-refresh.ts`
Change Meta token refresh to use platform-level secrets (`META_APP_ID`, `META_APP_SECRET` from environment) instead of reading `meta_app_id`/`meta_app_secret` from the `tenant_integrations` table. Same for LinkedIn, TikTok -- use platform secrets.

### 8. Update `publish-social-content` Function
Minor change: when fetching credentials for token refresh, pass platform-level secrets from environment instead of per-tenant credentials.

## Database Changes
- No new tables needed
- The existing `tenant_integrations` columns for per-tenant app credentials (`meta_app_id`, `meta_app_secret`, `linkedin_client_id`, `linkedin_client_secret`, `tiktok_client_key`, `tiktok_client_secret`) become unused (can be deprecated later)
- The token and account ID columns remain (`meta_page_access_token`, `meta_page_id`, `linkedin_access_token`, etc.)

## Files to Create
- `supabase/functions/social-oauth/index.ts` -- OAuth init + callback handler
- `supabase/functions/social-oauth-deauthorize/index.ts` -- Meta deauth handler
- `supabase/functions/social-oauth-data-deletion/index.ts` -- Meta data deletion handler

## Files to Modify
- `src/components/integrations/SocialMediaSetupGuide.tsx` -- Complete rewrite of all 5 platform guides for Option A
- `src/pages/integrations/SocialMediaIntegration.tsx` -- Replace manual credential forms with OAuth connect buttons
- `supabase/functions/_shared/social-platforms/token-refresh.ts` -- Use platform env secrets
- `supabase/functions/publish-social-content/index.ts` -- Pass platform secrets from env

## Secrets to Add
- `META_APP_ID` -- Your platform Meta App ID
- `META_APP_SECRET` -- Your platform Meta App Secret
- `LINKEDIN_CLIENT_ID` -- Your platform LinkedIn Client ID
- `LINKEDIN_CLIENT_SECRET` -- Your platform LinkedIn Client Secret
- `TIKTOK_CLIENT_KEY` -- Your platform TikTok Client Key
- `TIKTOK_CLIENT_SECRET` -- Your platform TikTok Client Secret
- `GOOGLE_CLIENT_ID` already exists
- `GOOGLE_CLIENT_SECRET` already exists

## Tenant Experience After Implementation
1. Tenant goes to Social Media integrations page
2. Reads the setup guide (now simplified -- explains what the platform does, what permissions are needed)
3. Clicks "Connect with Facebook"
4. OAuth popup opens, tenant logs in and authorizes their Page
5. Tokens and Page IDs are captured and stored automatically
6. Tenant's Social Media AI agents can now generate and post content -- no change to how agents work
