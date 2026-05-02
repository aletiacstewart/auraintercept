## Goal

Two independent fixes:

1. **Real signup must honor what the user picked.** Today, every new company is force-written as Core (`starter`) and the chosen industry is read but never validated. Real customers must get the **plan they selected** and an **industry-correct** workspace from their first login — completely independent of the demo seeder.
2. **Re-tier the demo accounts** per your earlier mapping (so demos showcase the right consoles per industry). Demo seeder changes never touch real customers.

## Part 1 — Fix real signup (the actual bug)

### What's broken in `src/pages/Auth.tsx`

```ts
// line ~289–302  — current behavior
.insert({
  name: companyName,
  slug,
  ...
  subscription_tier: 'starter',                          // ← always Core, ignores selectedTier
  industry_vertical: toCanonicalIndustryId(businessIndustry),  // ← no validation, no fallback
})
```

`selectedTier` is captured by the UI (and even pre-filled from `?tier=` deep-links from `/for-business`) but never persisted. `industry_vertical` is converted but never required, and an unknown alias silently writes `null`.

### Fix

In `Auth.tsx` `handleSignUp`:

- Use `selectedTier ?? 'starter'` for `subscription_tier` (Core is the only acceptable fallback if the user truly skipped the picker).
- Validate `selectedTier` against `['starter','connect','performance','command']` before insert.
- Resolve industry through `toCanonicalIndustryId` and validate with `isCanonicalIndustryId` (already exported from `src/lib/industryIdAliases.ts`); if invalid, block submit with a toast asking them to pick from the dropdown — do NOT silently insert `null`.
- Set `trial_ends_at = now() + 90 days` on the insert so the 90-day trial banner / progress math works regardless of tier.
- (Optional, keeps demo isolation crisp) explicitly set `is_demo: false`.

### Why this is enough — no extra provisioning needed

After insert, the platform already:

- Reads `companies.subscription_tier` to decide which AI Operatives, consoles (Field Ops, Marketing & Sales, Business Mgt, Analytics suite), Quotes/Invoices, Inventory, Insights/Forecast surfaces are visible. No code change required there.
- Auto-seeds the industry-specific Knowledge Base + FAQs via the existing `trg_seed_industry_pack_kb` trigger when `industry_vertical` is set on insert.
- Resolves industry pack (terminology, nav labels, form schemas, empty states, KPI labels) through `useIndustryPack` for every gated UI surface.
- Honors `LEGACY_TIER_MAP` everywhere, so all four canonical tier values flow through without further edits.

So the one-file change to `Auth.tsx` is sufficient to make real signups respect both the **plan picked at signup** and the **industry selected**, with the correct console + dashboard + agents from first login.

### Optional follow-up (out of scope unless requested)

- Make the tier picker required when `tier` is not in the URL (right now you can submit without selecting one).
- Wire the "Subscribe to {Tier}" CTA to actually open Stripe checkout post-signup for paid tiers; today it just creates the trial company.

Tell me if you want either of those folded in.

## Part 2 — Re-tier the demo accounts (already-discussed mapping)

Pure demo-only change — touches `supabase/functions/seed-demo-accounts-v2/index.ts` and the registry memory doc. Has zero effect on real customer signups (different code path).

```text
CORE  : beauty_wellness, restaurants, real_estate, personal_assistant
BOOST : handyman, auto_care, appliance_repair, pest_control, fencing
PRO   : security_systems, pool_spa, landscape, solar
ELITE : hvac, electrical, plumbing, roofing, construction
```

Edit the third arg of each `industry(...)` call. The seeder already cascades the change to:
- `companies.subscription_tier` (`starter`/`connect`/`performance`/`command`)
- `TIER_AGENTS` enables the right operative set per company
- Brand swatch via `TIER_COLORS`
- Quotes/invoices skipped on Core, inventory only where parts data exists

Update `mem://platform-operations/demo-account-registry` so the rotation block reads `4 / 5 / 4 / 5` instead of `5 / 5 / 4 / 4`.

After deploy: sign in as `auraintercept@gmail.com` → `/dashboard/demo-seeder` → **Seed All Demo Accounts** (~60–90s, idempotent). Aura Intercept tenant is untouched.

## Hard separation between real signup and demos

Codified for future me:
- Real signup path: `src/pages/Auth.tsx` → `companies` insert with `is_demo: false`. Tier + industry come from the form. Trial = 90 days.
- Demo path: `seed-demo-accounts-v2` edge function only. Companies always carry `is_demo: true`, slug `demo-<industry>`, and `{industry}admin@demo.com` style logins. The seeder never touches non-demo companies, and `Auth.tsx` never reads anything from the demo seeder.

Will add this rule to memory so it doesn't drift.

## Files changing

- `src/pages/Auth.tsx` — pass `selectedTier`, validate industry, set `trial_ends_at`, set `is_demo: false`.
- `supabase/functions/seed-demo-accounts-v2/index.ts` — flip 14 industry tier args (4 keep current tier).
- `mem://platform-operations/demo-account-registry` — refresh tier rotation block.
- New `mem://architecture/signup-vs-demo-isolation` — codify the boundary so this never regresses.

Reply **approve** to apply both parts, or tell me to split them (e.g. "approve part 1 only").
