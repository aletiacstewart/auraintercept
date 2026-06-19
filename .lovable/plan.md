## Goal
Today the platform already routes every company through a **PROFILE_A–J** spec (consoles + agents + widget set) using `getProfileForBusinessType()` against all 185 business types from the spec doc. That part works.

What is **not** yet generated from the uploaded `AuraIntercept_MarketingPlatformGuide.xlsx`:

- Per-business-type **channel priorities** (P/S/O across GMB, Facebook, IG, TikTok, LinkedIn, YouTube, Nextdoor, Yelp, Angi, Thumbtack, Google Ads, Meta Ads, SEO, Email, SMS, Referral, Direct Mail).
- Per-business-type **Best Ad Format**, **Top Content Types**, **Key Marketing Notes**.
- Per-industry-group **Top Paid Channel / Top Organic Channel** (from the "Top Platforms by Industry Group" sheet).

Marketing & Outreach console and Social Media console currently only show **cluster-level** copy from `industryMarketingPlaybooks.ts`. Dashboard widgets come from profile-level lists only. This plan threads the xlsx data through to those surfaces.

## Changes

### 1. New data registry — `src/lib/marketingPlatformMatrix.ts`
- Generated from the xlsx (build-time `scripts/build-marketing-matrix.ts` reads `/mnt/user-uploads/AuraIntercept_MarketingPlatformGuide.xlsx` and writes a typed TS module; checked into the repo so runtime has no xlsx dependency).
- Exports:
  - `CHANNELS` — ordered channel list with display labels + icon keys.
  - `BUSINESS_TYPE_MATRIX: Record<normalizedBusinessType, MatrixRow>` — `{ category, priorities: Record<Channel,'P'|'S'|'O'|'-'>, bestAdFormat, topContentTypes, keyNotes }`.
  - `GROUP_PLATFORM_SUMMARY: Record<Category, { primaries[], secondaries[], topPaid, topOrganic }>` — from the third sheet.
  - `getMatrixForBusinessType(input)` — normalizes via existing `normalizeBusinessType`, falls back to `getGroupSummary(category)` via the existing `getProfileForBusinessType` category map, then to a generic "service business" default.

### 2. Marketing & Sales console (C4) — `src/pages/ai-consoles/MarketingSalesConsole.tsx`
- Resolve business type from `companies.industry_config.business_type` (already stored at signup) with `industry_vertical` fallback.
- Render a new **"Recommended Channel Mix"** card under the existing playbook header:
  - Grid of channel chips, color-coded P (primary), S (secondary), O (optional), dimmed for "—".
  - Highlight badges for `Top Paid Channel` and `Top Organic Channel` from group summary.
- Render a **"Content & Ad Guidance"** card with `bestAdFormat`, `topContentTypes`, `keyNotes` straight from the matrix.
- Existing cluster playbook stays as the "Suggested Campaigns" section.

### 3. Social Media console (C5) — `src/pages/ai-consoles/SocialMediaConsole.tsx`
- Add the same channel-priority chips but filtered to the **social** subset (Facebook, IG, TikTok, LinkedIn, YouTube, Nextdoor, Yelp).
- Re-use `topContentTypes` from the matrix as the "Content Pillars" panel.

### 4. Dashboard — `src/components/dashboard/ProfileWidgetGrid.tsx`
- Below the existing profile-priority widgets, add a compact **"Marketing focus for your business type"** strip that shows the 3 highest-priority channels and the top organic + paid channel for the resolved business type. Hidden when the resolver cannot find a match (so generic profiles still render cleanly).

### 5. Resolver helper — extend `src/lib/businessTypeProfileMap.ts`
- Add `getCategoryForBusinessType(input)` returning the matrix category ("HVAC & Mechanical", etc.) so the dashboard / marketing console can look up the group summary without duplicating the lookup table.

### 6. Sidebar / consoles audit
Already correct: `navItemAllowedByProfile` + `profileHasConsole` hide consoles the profile doesn't list, and `initialize-company-agents` strips hidden agents. No changes needed — this plan just confirms it's in place.

### 7. Tests
- Snapshot tests for `getMatrixForBusinessType` on representative inputs across each of the 18 categories (plumber, hvac, roofer, lawn care, mover, real estate agent, dj/event, pet groomer, etc.).
- A test asserting **every** entry in `BUSINESS_TYPE_TO_PROFILE` resolves to a non-default matrix row.

## Out of scope
- No DB migrations (the matrix is static; companies already store `industry_vertical` + `industry_config.business_type`).
- No changes to the 4-tier pricing, the C1/C2/C3/C6/C7 consoles, or the Profile A–J definitions themselves.
- No edits to the homepage / signup industry pickers (already updated in earlier turns).

## Technical detail
- Build script writes a deterministic, sorted TS file so diffs are reviewable.
- Channel chip styling uses theme tokens only (`bg-primary/15`, `bg-secondary/15`, `bg-muted`) — no hard-coded colors, per Cyber-Sentry rules.
- All new strings render through existing `useIndustryPack` terminology where applicable (e.g. "Job" vs "Project" vs "Appointment").
