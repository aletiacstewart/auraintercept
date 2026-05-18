## Issue

The demo seeder (`seed-demo-accounts-v2`) is missing the `home_health` industry. There are 26 active `industry_template_packs` but only 25 in the seeder — the `home_health` (Home Health Care) pack has no demo company or accounts.

Verified:
- `industry_template_packs` row `home_health` exists, `is_active = true`, cluster `home_health`
- No `companies` row with `industry_vertical = 'home_health'` exists
- Seeder file lists only `physical_therapy`, `occupational_therapy`, `hospice` from that cluster

## Fix

1. **`supabase/functions/seed-demo-accounts-v2/index.ts`** — Add a `home_health` entry to the `INDUSTRIES` array (between `physical_therapy` and `occupational_therapy`, or after `hospice`). Tier: `pro` per the memory's curated mapping (home_health was Pro in the older registry). Mirror the structure of `hospice`:
   - Service types: `Skilled Nursing Visit`, `Home Health Aide Visit`, `Medication Management`, `Wound Care Visit`, `Therapy Coordination`
   - Inventory: gloves, wound care kit, BP cuff (healthcare-appropriate items)
   - 2 blog posts (e.g. "When to Consider Home Health Care", "Medicare Coverage Basics")
   - 1 promo: free in-home assessment
2. **Update comment** line 60 from "21 industries" to "26 industries".
3. **Update `.lovable/memory/platform-operations/demo-account-registry.md`** — bump count from 24→26, add `home_health` to the PRO tier list (currently lists 5; will become 6).
4. **User reseeds** at `/dashboard/demo-seeder` to create `demo-home-health` company + `homehealthadmin@demo.com` / `homehealthemployee@demo.com` / `homehealthcustomer@demo.com` (password `aidemo*!`).

## Out of scope
- No DB schema changes (pack already exists)
- No changes to other industries
- No changes to seeder logic — just adding one entry to the array