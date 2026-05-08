# Add 4 missing industries to the demo seeder

## Problem

`industry_template_packs` has **22 active packs**, but the demo seeder (`supabase/functions/seed-demo-accounts-v2/index.ts`) only contains **18 industry definitions**. The 4 missing ones are exactly what you reported:

- `fitness` — Fitness Studio
- `salon` — Salon & Spa
- `professional` — Professional Services
- `saas_platform` — SaaS Platform

Because there's no `IndustryDef` for them, the seeder never creates a demo company for those verticals, the Super Switcher cards stay marked **NOT SEEDED**, and the Company / Employee / Customer buttons are disabled.

## Fix

Add 4 new entries to the `INDUSTRIES` array in `seed-demo-accounts-v2/index.ts`, following the exact same shape as the existing entries (key, label, tier, services, inventory, blog posts, campaigns).

Proposed tiers (matching the canonical 4-tier model and the type of business):

| industry_id     | Label                | Tier  | Inventory? |
|-----------------|----------------------|-------|------------|
| `fitness`       | Fitness Studio       | core  | null (service-only) |
| `salon`         | Salon & Spa          | core  | yes (color, tools) |
| `professional`  | Professional Services| boost | null (service-only) |
| `saas_platform` | SaaS Platform        | pro   | null (service-only) |

Each entry will include:
- 5 representative services
- 3 starter blog posts
- 2 starter campaigns
- Inventory rows only where it makes sense (salon)

## After deploy

1. Edge function auto-deploys.
2. From `/super-switcher` click **"Seed / repair all demos"**.
3. The 4 cards flip to **LIVE**, with Company / Employee / Customer buttons enabled.

No DB migrations, no schema changes, no UI changes. Pure data added to the seeder function.
