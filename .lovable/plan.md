
# Implementation: Platform-Level OAuth with "Add Later" Credentials

## Overview
Build the full Option A architecture but instead of requiring secrets upfront, create a **Platform Credentials Settings** section where the platform admin can input their API keys when ready. The secrets will be stored securely as backend environment variables.

## What Gets Built

### 1. New Edge Functions (3 files)

**`supabase/functions/social-oauth/index.ts`**
- Handles `/init` (generate OAuth URL) and `/callback` (exchange code for tokens)
- Reads platform credentials from environment secrets: `META_APP_ID`, `META_APP_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Platform-specific flows: Meta long-lived token exchange, LinkedIn org fetch, TikTok open_id, Google refresh tokens
- Stores tokens in `tenant_integrations` and creates `social_accounts` records
- Returns clear error if platform credentials are not yet configured

**`supabase/functions/social-oauth-deauthorize/index.ts`**
- Handles Meta deauthorization callbacks
- Marks social accounts as inactive when users revoke access

**`supabase/functions/social-oauth-data-deletion/index.ts`**
- Handles Meta GDPR data deletion requests
- Returns confirmation URL and tracking code as required by Meta

### 2. Platform Credentials Management

**New component: `src/components/integrations/PlatformCredentialsSettings.tsx`**
- Only visible to `platform_admin` role
- Shows a card for each platform (Meta, LinkedIn, TikTok, Google)
- Each card has fields for the platform's Client ID and Secret
- Saves credentials by calling a new edge function that sets them as backend secrets
- Shows status: "Configured" or "Not configured" for each platform
- Includes help text explaining these are ONE-TIME platform-level settings, not per-tenant

**New edge function: `supabase/functions/manage-platform-secrets/index.ts`**
- Accepts platform credential key-value pairs from the admin UI
- Validates the caller is a platform_admin
- Stores values as Supabase secrets (Deno.env won't persist -- we'll store in a `platform_settings` table instead)

**Actually -- simpler approach:** Store platform credentials in a new `platform_settings` table (key-value, RLS restricted to platform_admin). The OAuth edge functions read from this table. This avoids needing to manage secrets dynamically.

### 3. Database Changes

**New table: `platform_settings`**
- `id` (uuid, primary key)
- `setting_key` (text, unique) -- e.g. 'META_APP_ID', 'META_APP_SECRET'
- `setting_value` (text) -- encrypted at rest by database
- `updated_at` (timestamptz)
- `updated_by` (uuid, references auth.users)
- RLS: Only `platform_admin` can SELECT, INSERT, UPDATE, DELETE

### 4. Updated Frontend Files

**`src/pages/integrations/SocialMediaIntegration.tsx`** -- Major rewrite:
- Remove manual credential input dialog (App ID/Secret per-tenant fields)
- Replace with "Connect with [Platform]" buttons that open OAuth popup
- Show connection status with account name, connected date, disconnect button
- If platform credentials aren't configured, show a message directing platform admin to set them up
- Remove the `fields` property from `SOCIAL_INTEGRATIONS` array

**`src/components/integrations/SocialMediaSetupGuide.tsx`** -- Complete rewrite:
- All 5 platform guides rewritten for the Tech Provider model
- Guides explain how the platform admin registers the master app ONCE
- Detailed step-by-step for Meta, LinkedIn, TikTok, Google Business
- Includes required documents checklists, copyable URLs, review timelines
- Each guide references where to input credentials (Platform Credentials Settings)

### 5. Updated Backend Files

**`supabase/functions/_shared/social-platforms/token-refresh.ts`**
- Read `META_APP_ID`/`META_APP_SECRET` from `platform_settings` table instead of per-tenant `tenant_integrations`
- Same for LinkedIn, TikTok, Google credentials

**`supabase/functions/publish-social-content/index.ts`**
- Minor update: platform credentials come from `platform_settings` table via token-refresh

### 6. Config Updates

**`supabase/config.toml`** -- Add entries for new edge functions:
- `social-oauth` (verify_jwt = false, since OAuth callbacks come from external platforms)
- `social-oauth-deauthorize` (verify_jwt = false)
- `social-oauth-data-deletion` (verify_jwt = false)
- `manage-platform-secrets` is not needed since we use a table approach

## Technical Details

### OAuth Flow
1. Tenant clicks "Connect with Facebook"
2. Frontend calls `social-oauth?action=init&platform=facebook&tenant_id=xxx`
3. Edge function reads `META_APP_ID` from `platform_settings`, builds OAuth URL with correct scopes
4. Returns URL, frontend opens popup
5. User authorizes, redirected to callback URL
6. `social-oauth?action=callback` receives code, exchanges for tokens
7. Stores tokens in `tenant_integrations`, creates `social_accounts` record
8. Frontend detects success, refreshes connection status

### Platform Settings Table Approach
Using a database table instead of environment secrets because:
- Platform admin can update credentials through the UI without redeploying
- Edge functions can read from the table using the service role key
- RLS ensures only platform_admin can view/edit
- Simpler than dynamic secret management

### Files to Create
- `supabase/functions/social-oauth/index.ts`
- `supabase/functions/social-oauth-deauthorize/index.ts`
- `supabase/functions/social-oauth-data-deletion/index.ts`
- `src/components/integrations/PlatformCredentialsSettings.tsx`

### Files to Modify
- `src/components/integrations/SocialMediaSetupGuide.tsx`
- `src/pages/integrations/SocialMediaIntegration.tsx`
- `supabase/functions/_shared/social-platforms/token-refresh.ts`
- `supabase/functions/publish-social-content/index.ts`

### Database Migration
- Create `platform_settings` table with RLS policies for platform_admin only

## Implementation Order
1. Create `platform_settings` table with RLS
2. Create `PlatformCredentialsSettings.tsx` component and add to the Social Media integration page
3. Create `social-oauth` edge function (init + callback)
4. Create `social-oauth-deauthorize` and `social-oauth-data-deletion` edge functions
5. Rewrite `SocialMediaSetupGuide.tsx` with all 5 platform guides for Tech Provider model
6. Rewrite `SocialMediaIntegration.tsx` with OAuth connect buttons
7. Update `token-refresh.ts` to read from `platform_settings`
8. Update `publish-social-content` to use platform-level credentials
