# Add Healthcare Demos to Dynamic Demo Page

The dynamic demo page (`/for-business`) drives its dropdown, hero, role previews, and the "Start 24-hour Demo" flow off of `INDUSTRY_CONTENT` + `INDUSTRY_GROUPS` in `src/lib/industryMarketingContent.ts`. Dashboards/consoles for a demo company are driven by the `industry_template_packs` row matched to the selected `industry_id` via `useIndustryPack`.

## Current state

- **Industry packs in DB (already power dashboards/consoles):** `physical_therapy`, `occupational_therapy`, `hospice` (all cluster=`home_health`). No `home_health` pack yet.
- **Marketing content (powers `/for-business` dropdown + demo):** Zero healthcare entries. No Healthcare group in `INDUSTRY_GROUPS`.
- **Aliases:** `pt → physical_therapy`, `ot → occupational_therapy`, `hospices → hospice`, and currently `home_health → physical_therapy` (wrong — user wants home_health distinct).

## Changes

### 1. Add a `home_health` industry pack (DB)
New migration inserting an `industry_template_packs` row for `home_health` (cluster `home_health`, label "Home Health Care") so its dashboard/consoles render properly. Seed: dashboard_widgets, service_catalog (skilled nursing visit, medication management, wound care, vitals check), terminology (job→visit, customer→patient, technician→caregiver), appointment_rules (in-home, 60-min default, recurring weekly), customer_intake_schema (DOB, primary diagnosis, mobility, allergies, emergency contact), quote_template/invoice_template (per-visit billing, insurance + private pay), agent_prompt_deltas for receptionist/dispatch.

### 2. Fix alias for `home_health`
In `src/lib/industryIdAliases.ts`:
- Remove `home_health: 'physical_therapy'`.
- Add `'home_health'` to `CANONICAL_INDUSTRY_IDS`.
- Add convenience aliases: `homehealth`, `home_care`, `homecare → home_health`.

### 3. Add 4 marketing content entries
In `src/lib/industryMarketingContent.ts`, add `home_health`, `physical_therapy`, `occupational_therapy`, `hospice` entries to `INDUSTRY_CONTENT` using the existing `make(...)` helper. Each gets:
- Industry-appropriate headline + subheadline (e.g. PT: "Keep your schedule full. Keep recovery on track.")
- 3 value props (call answering / intake & insurance verification / visit reminders + recurring scheduling)
- Sample inbound messages ("I need to schedule my mom's first PT visit", "Following up on my hospice intake referral", etc.)
- Service types (Initial Eval, Follow-up Visit, Re-eval, etc. tuned per vertical)
- Sample appointment + lead seed
- City + brand color pair (clinical blue/teal palette)

### 4. Add a Healthcare group to `INDUSTRY_GROUPS`
Append: `{ group: 'Healthcare', emoji: '🩺', ids: ['home_health', 'physical_therapy', 'occupational_therapy', 'hospice'] }` so they show in the dropdown picker on `/for-business`.

### 5. Verify downstream
- `useIndustryPack` already resolves these IDs → consoles/dashboards render automatically once steps 1–2 are in.
- `create-demo-trial` edge function uses `_shared/industry-aliases.ts` — mirror the `home_health` canonical update there as well.
- `industryEmptyStates`, `industryPortalCopy`, `industryNavLabels` already have hospice/PT/OT entries (per `rg` earlier); add `home_health` analogues where each file expects one (will detect during implementation and add minimal entries — caregiver/patient/visit terminology).

## Out of scope

- No changes to the actual demo lifetime (still 24h), pricing tiers, or seeded demo accounts.
- No new operative agents — uses existing `home_health` cluster operatives.
