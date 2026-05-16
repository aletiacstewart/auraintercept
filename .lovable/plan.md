## Goal
Add a new **Home Health Care** industry cluster with three verticals — **Physical Therapy**, **Occupational Therapy**, **Hospices** — under the **Core** plan, wired through every place an industry pack is enumerated (signup, switcher hub, demo seeder, admin, templates, prompts).

## Current model
- Clusters today (4): `trades`, `outdoor`, `repair`, `booking`. 22 packs live in `industry_template_packs`.
- Canonical industry IDs registered in `src/lib/industryIdAliases.ts`. Signup dropdown reads from `INDUSTRY_TEMPLATES` (19 entries) in `src/lib/industryTemplates.ts`.
- Demo seeder lives in `supabase/functions/seed-demo-accounts-v2/index.ts` and `/dashboard/demo-seeder` (Super Switcher → Demo). Tier rotation file lists 18 demo industries grouped by tier.

## Changes

### 1. Database — new cluster + 3 packs
Migration adds 3 rows to `industry_template_packs` with `cluster = 'home_health'`:

| industry_id | label | icon |
|---|---|---|
| `physical_therapy` | Physical Therapy | `Activity` |
| `occupational_therapy` | Occupational Therapy | `HandHelping` |
| `hospice` | Hospice Care | `HeartPulse` |

Each pack:
- `cluster='home_health'`, `is_active=true`
- terminology: `{ job: 'Visit', customer: 'Patient', appointment: 'Visit' }`
- `appointment_rules`: in-home visit, 45–60 min default, recurring schedule support
- `console_visibility`: `field_ops='route_mode'`, `route_map=true`, `truck_inventory=false`, `dispatch_map=true`
- `service_catalog`: PT (eval, mobility, post-op), OT (ADL training, home safety eval, hand therapy), Hospice (RN visit, aide visit, bereavement, chaplain)
- `kb_seed_documents`: HIPAA basics, plan-of-care template, intake & consent
- `agent_prompt_deltas`: empathetic clinical tone; never give medical advice; HIPAA-aware
- `quote_template`/`invoice_template`: per-visit billing with CPT code field

### 2. Code touchpoints (frontend)
- `src/hooks/useIndustryPack.ts` — extend cluster union to include `'home_health'`.
- `src/pages/admin/IndustryPacksAdmin.tsx` — add `'home_health'` to `CLUSTERS`.
- `src/lib/industryIdAliases.ts` — add `physical_therapy`, `occupational_therapy`, `hospice` to `CANONICAL_INDUSTRY_IDS`; alias `pt → physical_therapy`, `ot → occupational_therapy`, `hospices → hospice`.
- `src/lib/industryTemplates.ts` — add 3 `INDUSTRY_TEMPLATES` entries (Instagram/Facebook/LinkedIn/TikTok/SMS copy tuned for in-home clinical services, HIPAA-safe).
- `src/lib/industryMarketingContent.ts` — add matching marketing blurbs/hero copy for `/for-business` deep links.
- `src/pages/DemoAccountSeeder.tsx` — append the 3 keys to `INDUSTRIES_BY_TIER.core`.

### 3. Demo seeder edge function
`supabase/functions/seed-demo-accounts-v2/index.ts`:
- Add 3 `industry(...)` blocks at the Core tier with realistic services, light inventory (gloves, PPE, mobility aids), 1–2 blog posts, and 1 email campaign each.
- Update the header comment from "18 industries" → "21 industries" and CORE bucket from 4 → 7.
- Resulting demo accounts: `physicaltherapyadmin@demo.com` / `…employee@demo.com` / `…customer@demo.com` (same `aidemo*!` password) and same pattern for OT and Hospice.

### 4. Super Switcher hub
No code change needed — the hub renders whatever the seeder produces. Once new demo companies exist they appear under the Core tier rail automatically.

### 5. Memory updates
Update `mem://platform-operations/demo-account-registry` (54 → 63 accounts; 18 → 21 industries; 4 → 5 clusters incl. `home_health`) and add a one-line entry to `mem://index.md` Memories list pointing to a new `mem://architecture/home-health-cluster` note describing the cluster, the 3 verticals, HIPAA-aware prompt deltas, and Core-plan placement.

## Out of scope
- No new operatives or tier changes — Home Health uses standard Core agents.
- No HIPAA BAA workflow; pack only sets prompt guardrails + terminology.
- No billing/CPT integration beyond a template field.