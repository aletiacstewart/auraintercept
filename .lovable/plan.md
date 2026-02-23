
# Dual-Mode Social Media: Manual Bridge + Per-Tenant Own API Option

## Overview

The goal is to offer companies **two distinct paths** for social media posting on their integration settings page:

1. **Manual Bridge (Default — Available Now)**: AI generates content, company logs into each platform, copies content with one click, and opens the platform composer via deep link. No API setup needed.
2. **Own API Credentials (Advanced — For companies that can get approved)**: Company registers their own developer app on each platform, enters their own Client ID/Secret, and connects via OAuth for fully automatic posting. Step-by-step approval guides already exist for this.

The existing Platform Admin section (master "Tech Provider" credentials in `platform_settings`) is left completely untouched — it stays in the admin dashboard for when global approval is obtained.

---

## Architecture Summary

The `tenant_integrations` table **already has all the per-tenant credential columns**:
- `meta_app_id`, `meta_app_secret`
- `linkedin_client_id`, `linkedin_client_secret`
- `tiktok_client_key`, `tiktok_client_secret`
- `google_business_client_id`, `google_business_client_secret`

The `social-oauth` edge function currently reads credentials **only** from `platform_settings` (global). It needs to be updated to check for **tenant-level credentials first**, falling back to platform-level if not set.

---

## What Changes

### 1. `SocialMediaIntegration.tsx` — Redesigned Integration Page

The page currently shows one view per platform with a single "Connect" button. It needs to be restructured to show **two posting method options** per platform, plus a "Coming Soon" notice for when the platform-level auto-posting becomes available.

**New page structure per platform tab:**

```text
[ Tab: Facebook ] [ Tab: Instagram ] [ Tab: LinkedIn ] [ Tab: TikTok ] [ Tab: Google Business ]

┌─────────────────────────────────────────────────────────┐
│  Choose Your Posting Method                              │
│                                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │ ✅ Manual Bridge       │  │ ⚙️  Own API Setup      │   │
│  │ (Available Now)        │  │ (Advanced)            │   │
│  │                        │  │                       │   │
│  │ AI generates content   │  │ Register your own     │   │
│  │ → Copy with 1 click    │  │ developer app on this │   │
│  │ → Open platform        │  │ platform, enter your  │   │
│  │   composer             │  │ credentials, and      │   │
│  │ → Paste & publish      │  │ connect for automatic │   │
│  │                        │  │ posting.              │   │
│  │ [Use Manual Bridge]    │  │ [Set Up Own API →]    │   │
│  └───────────────────────┘  └───────────────────────┘   │
│                                                          │
│  ⚡ Platform Auto-Post (Coming Soon)                     │
│  Once our platform-level API approval is complete,       │
│  all companies will be able to connect with one click.   │
└─────────────────────────────────────────────────────────┘
```

**"Manual Bridge" card** (left):
- Description of the copy + deep link workflow
- A "How it works" link or inline 3-step summary
- No credentials needed, works immediately

**"Own API Setup" card** (right):
- Expands to show: credential input fields (Client ID, Client Secret, + any platform-specific fields like Page ID or Org ID)
- Save button to write credentials to `tenant_integrations`
- Once saved, shows the existing "Connect [Platform]" OAuth button (same OAuth flow, but now uses tenant credentials)
- Shows connected account status (same as current)
- The existing `SocialMediaSetupGuide` accordion (with the full step-by-step approval guide) is shown below this card only when "Own API Setup" is selected/expanded

**"Coming Soon" notice** (bottom):
- Amber info banner explaining platform-level auto-posting is in development
- No UI controls needed

---

### 2. New Component: `TenantSocialCredentialsForm.tsx`

A new form component (placed at `src/components/integrations/TenantSocialCredentialsForm.tsx`) that allows a company to enter their own developer app credentials per platform.

**Fields per platform:**

| Platform | Fields |
|---|---|
| Facebook / Instagram | Meta App ID, Meta App Secret |
| LinkedIn | LinkedIn Client ID, LinkedIn Client Secret, LinkedIn Organization ID (optional) |
| TikTok | TikTok Client Key, TikTok Client Secret |
| Google Business | Google Client ID, Google Client Secret |

- Reads existing values from `tenant_integrations` via a query (masked, showing only last 4 chars like `****abcd`)
- On Save: upserts the relevant columns in `tenant_integrations`
- Requires `company_admin` or `platform_admin` role
- After saving, the "Connect [Platform]" button becomes active — same OAuth popup flow as current, but the edge function will now use the tenant's own credentials

---

### 3. `social-oauth/index.ts` — Credential Resolution Fallback Logic

Update `getPlatformCredentials()` to check tenant-level credentials first before falling back to platform-level.

**New resolution order:**
1. Query `tenant_integrations` for the company's own `meta_app_id` / `meta_app_secret` (or other platform fields)
2. If found and non-empty → use them
3. If not found → fall back to `platform_settings` (global platform admin credentials)
4. If neither found → return error "No credentials configured"

This change requires passing `company_id` into `getPlatformCredentials()`. The `company_id` is already available in the OAuth init handler from the query param.

---

### 4. `SocialPublishBridge.tsx` — New Component (Manual Bridge)

As described in previous planning, a reusable dialog/panel for the Schedule Queue and Content Wizard. Per platform:
- Read-only content preview
- Copy to Clipboard button
- "Open [Platform]" deep link button
- "Mark as Posted" button → sets `status: 'published'`

---

### 5. `SocialContentWizard.tsx` + `SocialScheduleQueue.tsx` — Manual Bridge Integration

- **Wizard Step 3**: Replace "Save Drafts" with "Approve & Ready to Post" (sets `status: 'ready_to_post'`)
- **Schedule Queue**: Replace "Publish Now" with "Post This →" button that opens `SocialPublishBridge`; add `ready_to_post` as a filter/status badge

---

### 6. Database Migration

Add `ready_to_post` to the `scheduled_social_posts` status check constraint:

```sql
ALTER TABLE public.scheduled_social_posts
  DROP CONSTRAINT IF EXISTS scheduled_social_posts_status_check;

ALTER TABLE public.scheduled_social_posts
  ADD CONSTRAINT scheduled_social_posts_status_check
  CHECK (status IN ('pending', 'approved', 'ready_to_post', 'published', 'rejected', 'failed'));
```

No new columns needed — `tenant_integrations` already has all per-tenant social credential columns.

---

### 7. Help, Guides, and Landing Page Updates

**`AIHelpCenter.tsx`** — System prompt:
- Update "Social media 'Not Configured' error" troubleshooting to explain the two paths: Manual Bridge (no setup) vs Own API (requires company app registration)
- Update page suggestions for `/dashboard/integrations/social` to include "How does manual posting work?" and "Can I use my own API credentials?"

**`documentationConfig.ts`**:
- Update social media agent descriptions to reflect the manual bridge workflow and "own API" option

**`SocialMediaIntegration.tsx`** page header description:
- Change from "Connect your social accounts for automated posting" to "Post content with the Manual Bridge or connect your own developer app for automatic posting"

**`ComprehensiveGuidesPDF.tsx`** + **`CompanyGuidesPDF.tsx`**:
- Update social media section to explain both posting methods side by side
- Add "Manual Bridge" section: AI generates → copy → open composer → paste → mark as posted
- Add "Own API" section: register developer app → enter credentials → OAuth connect → automatic posting

**`PricingComparisonTable.tsx`**:
- Update social media tooltips to mention "Manual Bridge (available now) + Automatic posting via own API credentials or coming platform-level connection"

---

## Files Changed Summary

| File | Change Type |
|---|---|
| `src/pages/integrations/SocialMediaIntegration.tsx` | Restructure per-platform tab to show two method cards + coming soon banner |
| `src/components/integrations/TenantSocialCredentialsForm.tsx` | **New** — per-tenant credential input form |
| `src/components/social/SocialPublishBridge.tsx` | **New** — copy + deep link dialog |
| `src/components/social/SocialContentWizard.tsx` | Replace "Save Drafts"; add bridge in Step 3 |
| `src/components/social/SocialScheduleQueue.tsx` | Replace "Publish Now"; add `ready_to_post` status |
| `supabase/functions/social-oauth/index.ts` | Add tenant-credential fallback in `getPlatformCredentials()` |
| `src/components/help/AIHelpCenter.tsx` | Update social media troubleshooting + page suggestions |
| `src/lib/documentationConfig.ts` | Update agent/console descriptions |
| `src/components/documentation/ComprehensiveGuidesPDF.tsx` | Update social media guide sections |
| `src/components/documentation/CompanyGuidesPDF.tsx` | Update social media guide sections |
| `src/components/landing/PricingComparisonTable.tsx` | Update social media tooltips |
| `supabase/migrations/` | Add `ready_to_post` to status constraint |

---

## What Stays Exactly the Same

- `PlatformCredentialsSettings` (admin dashboard) — untouched
- `SocialMediaSetupGuide` accordion component — reused as-is, just surfaced under "Own API Setup" option
- All AI content generation logic
- `publish-social-content` edge function — untouched
- All scheduling, calendar, approval workflow, and analytics components
