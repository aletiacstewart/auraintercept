---
name: Signup vs Demo Isolation
description: Hard separation between real customer signup and the demo seeder. Real signup writes the user-picked tier+industry; demos live in their own code path with is_demo=true.
type: constraint
---

# Signup vs Demo Isolation

Real customer signups and demo accounts are two completely separate code paths. They must never share logic.

## Real customer signup

- Path: `src/pages/Auth.tsx` `handleSignUp`.
- Persists `companies.subscription_tier` from the user's `selectedTier` (validated against `['starter','connect','performance','command']`, defaults to `'starter'` only if truly skipped).
- Persists `companies.industry_vertical` from the user's selection, normalized via `toCanonicalIndustryId` and validated with `isCanonicalIndustryId`. Signup is BLOCKED if industry is missing/invalid — no silent `null` writes.
- Always sets `is_demo: false` and `trial_ends_at = now() + 90 days`.
- Console, dashboard, AI Operatives, Quotes/Invoices, Inventory, Insights/Forecast, Marketing & Sales surfaces all auto-gate from `subscription_tier`. KB + FAQs auto-seed from the industry pack via `trg_seed_industry_pack_kb`. No additional provisioning code needed.

## Demo accounts

- Path: `supabase/functions/seed-demo-accounts-v2` only, triggered from `/dashboard/demo-seeder` by a platform admin.
- Always writes `is_demo: true`, slug `demo-<industry>`, emails `{industry}admin|employee|customer@demo.com`, password `aidemo*!`.
- Tier mapping is industry-curated (see `mem://platform-operations/demo-account-registry`), not derived from any user input.

## Hard rules

- Demo seeder never reads or modifies non-demo companies.
- `Auth.tsx` never reads anything from the demo seeder, the seeder's tier table, or `is_demo: true` rows.
- Adding a new industry/tier to demos must NOT change real signup behavior.
- Adding a new tier to real signup must NOT touch the demo seeder.
