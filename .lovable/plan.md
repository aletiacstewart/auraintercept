## Goal
Guarantee every Live Demo signup gets a full 60-day Aura Elite trial with consoles/dashboards tailored to the industry they picked on `/for-business`.

## What's already correct (no change)
- `/for-business` deep-links to `/signup?mode=company&tier=command&industry=<id>`.
- `SignUp.tsx` persists `subscription_tier='command'`, `industry_vertical=<canonical>`, `trial_ends_at = now + 60d`.
- `check-subscription` returns `tier='command'`, `subscribed=true`, `in_trial=true` for active trial; tier-gating + `useIndustryPack` already render the Elite agent suite and industry-tailored consoles.

## Changes

### 1. Lock the Live-Demo signup to Elite (UI)
**`src/pages/SignUp.tsx`**
- Add a derived `isLiveDemoFlow = !!industryParam` flag (industry-deep-link = Live Demo).
- When `isLiveDemoFlow` is true:
  - Force `selectedTier='command'` and disable the 4-tier picker (the existing pricing card stays visible but is locked, with a sash: "Live Demo runs on Aura Elite — every agent, console, and integration unlocked. Downgrade or cancel anytime before day 60.").
  - Replace the per-tier "Choose tier" CTA with a single primary "Start 60-Day Live Demo on Elite" button that runs the existing company-signup handler.
  - Hide the per-tier "originalMonthly/monthlyPrice" striked pricing for non-Elite cards so it's visually clear Elite is the active plan (other tier cards collapse to a small "Available to switch to after day 60" row).

### 2. Make the industry pre-selection visible and locked-in
**`src/pages/SignUp.tsx`**
- When `industryParam` resolves to a valid `BUSINESS_TYPES` entry, render the industry dropdown disabled with a "Pre-selected from your Live Demo pick" badge, plus a one-line preview from the resolved `INDUSTRY_CONTENT` pack ("Your consoles, KPIs, and Aura prompts will be tuned for <pack.label>.").
- If `industryParam` does not resolve (e.g. arbitrary string), leave the dropdown enabled and show a warning toast — fall back to the existing required-industry guard.

### 3. Harden the trial-branch tier default (edge function)
**`supabase/functions/check-subscription/index.ts`**
- In the trial-active branch, change `const trialTier = companyData?.subscription_tier || 'starter';` → `const trialTier = companyData?.subscription_tier || 'command';`. Rationale: Live Demos are persisted with `command`, but defending against a NULL/legacy row means the trial never silently drops to Starter mid-experience.
- No schema change. No CORS / no public-grant change. Re-deploy the function.

### 4. Smoke-verify with Playwright
- Drive `/for-business?industry=plumber` → click `Start 60-Day Live Demo` → land on `/signup?...tier=command&industry=plumber`.
- Confirm: tier card locked to Elite, industry dropdown shows "Plumber — pre-selected", primary CTA = "Start 60-Day Live Demo on Elite".
- Repeat for `industry=hvac` and `industry=electrician` to confirm the resolved pack label changes.

## Out of scope
- No backend table / RLS / Stripe / trigger changes (industry_vertical → consoles is already wired via `useIndustryPack`).
- Existing post-signup onboarding (3rd-party account hookups, knowledge-base seed, etc.) remains as-is — full Elite access is already granted by the trial branch.
- Direct `/signup` visits without `?industry=` keep today's tier picker behaviour.
