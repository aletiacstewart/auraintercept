# Industry-aware company provisioning — verify & fix

## Problem (audit results)

Every dashboard, console, AI agent, and analytics view already reads industry config through `useIndustryPack(companyId)` (or the edge-function equivalent), which looks up `industry_template_packs` by `companies.industry_vertical`. So the run-time wiring is correct end-to-end **as long as `industry_vertical` is populated with a canonical pack id**. Two real bugs break that contract today:

### Bug 1 — Signup never persists the selected industry

`src/pages/Auth.tsx` collects `businessIndustry` in the company-admin signup form (line 68, 1155) but the company `INSERT` (lines 288–300) **never writes it to `industry_vertical`**. New companies always get `NULL`, which makes `useIndustryPack` fall back to the generic pack everywhere.

### Bug 2 — Three different industry-id namespaces are in use

The canonical ids (the ones populated in `industry_template_packs.industry_id`) are:
`hvac, plumbing, electrical, roofing, solar, landscape, pool_spa, pest_control, appliance_repair, handyman, construction, auto_care, security_systems, real_estate, beauty_wellness, restaurants, personal_assistant, fencing`.

Two other lists drift from those:

```text
file                                    drift examples
─────────────────────────────────────── ─────────────────────────────────────
src/lib/industryTemplates.ts            landscape→landscaping, pool_spa→pool,
  (Auth signup dropdown)                pest_control→pest, appliance_repair→appliance,
                                        auto_care→auto, security_systems→security,
                                        real_estate→realestate, beauty_wellness→beauty,
                                        restaurants→restaurant, personal_assistant→
                                        personalassistant
src/lib/industryMarketingContent.ts +   solar→solar_energy, fencing→fencing_decking,
supabase/functions/create-demo-trial/   landscape→landscape_trees, handyman→
  index.ts INDUSTRY_DEFAULTS            handyman_cleaning
  (Dynamic demo page + 48-hr trial)
```

`FastStartWizard` already uses canonical ids (BUSINESS_TEMPLATES) and writes them correctly — keep as the reference.

So even after fixing Bug 1, ~half the signups and ~25% of demo trials would still land on the generic pack because the id wouldn't match a row in `industry_template_packs`.

## What this plan does

1. Make signup actually save the chosen industry.
2. Normalize the two drifting namespaces to canonical pack ids.
3. Add a single defensive alias-mapper used at every write point so any legacy or external value (`solar_energy`, `realestate`, etc.) is auto-converted before it hits the DB.
4. Backfill the small number of existing rows that have a non-canonical value.
5. QA across every consumer (dashboards, consoles, AI agents).

## Code changes

### 1. New canonical alias map — single source of truth

**New file** `src/lib/industryIdAliases.ts`

```text
INDUSTRY_ID_ALIASES: Record<string,string> = {
  // INDUSTRY_TEMPLATES drift
  landscaping: 'landscape', pool: 'pool_spa', pest: 'pest_control',
  appliance: 'appliance_repair', auto: 'auto_care', security: 'security_systems',
  realestate: 'real_estate', beauty: 'beauty_wellness',
  restaurant: 'restaurants', personalassistant: 'personal_assistant',
  // INDUSTRY_DEFAULTS / marketing-content drift
  solar_energy: 'solar', fencing_decking: 'fencing',
  landscape_trees: 'landscape', handyman_cleaning: 'handyman',
  // legacy
  general_contractor: 'construction',
}
export function toCanonicalIndustryId(id: string|null|undefined): string|null
```

Mirror as `supabase/functions/_shared/industry-aliases.ts` (Deno) so edge functions can use the same map.

### 2. Auth signup — persist + normalize industry

`src/pages/Auth.tsx` company-admin signup INSERT (~line 290): add
`industry_vertical: toCanonicalIndustryId(businessIndustry) || null`. Also gate the submit button on `businessIndustry` being set so it can't slip through as null again.

### 3. Normalize the dropdown source itself

`src/lib/industryTemplates.ts`: rename the 10 drifting top-level keys + their `id:` fields to canonical (`landscape`, `pool_spa`, …, `personal_assistant`). Keep the alias map for any deep-link `?industry=` URLs that may still hit the old ids.

### 4. Demo trial — normalize at the edge

`supabase/functions/create-demo-trial/index.ts`:
- Import the shared alias helper.
- Apply `toCanonicalIndustryId(industry)` before the `INDUSTRY_DEFAULTS[...]` lookup.
- Rename `INDUSTRY_DEFAULTS` keys `solar_energy → solar`, `fencing_decking → fencing`, `landscape_trees → landscape`, `handyman_cleaning → handyman` so the seeded demo data, services, and prompts line up with the pack the company will resolve to.
- Slug template stays the same (`demo-trial-${canonicalId}-…`).

### 5. Marketing demo page — normalize the click-through

`src/lib/industryMarketingContent.ts`: rename the same 4 drifting keys + their `id:` fields to canonical. `StartDemoDialog` then automatically passes the canonical id to `create-demo-trial`, which seeds the right pack.

### 6. Belt-and-suspenders defense at the edge function

In `create-demo-trial`, run `toCanonicalIndustryId` on the inbound `industry` param before validation, so any old marketing link cached by a prospect still resolves to the right pack.

### 7. Backfill existing rows (data only — uses insert tool)

Single UPDATE through the insert tool:

```text
UPDATE companies SET industry_vertical = canonical
WHERE industry_vertical IN (drifting ids)
  AND industry_vertical IS NOT canonical
```

Touches only the handful of demo + test rows currently in the table.

## Verification matrix

After the changes, confirm `industry_vertical` flows correctly into every consumer (all already wired through `useIndustryPack` / pack-aware edge functions — verified in audit):

```text
Surface                              How it resolves the pack
──────────────────────────────────── ─────────────────────────────────────────
CompanyAdminDashboard                useIndustryPack() → labels, KPIs, presets
AuraCommandCenter                    useIndustryPack() → quick actions
IndustryWidgetGrid                   useIndustryPack() → widget set
DashboardLayout (nav labels)         useIndustryPack() → terminology
BusinessManagementConsole            useIndustryPack()
FieldOpsConsole                      useIndustryPack() → workflows
MarketingSalesConsole                useIndustryPack() → playbooks
CustomerPortalConsole                useIndustryPack() → portal copy
SpecialistOperativesConsole          useIndustryPack() → extra_operatives gate
IntakeAnalytics + presets (Phase M)  useIndustryPack() → fields + chips
ai-agent-chat (chat/booking AI)      industry_template_packs → deltas + intake
voice-handler (SignalWire SWML)      _shared/industry-pack.ts (Phase L)
sms-handler                          _shared/industry-pack.ts (Phase L)
PublicBooking + embed loader         usePublicIndustryPack() → form schema
```

## Manual QA after deploy

1. Sign up a fresh company-admin with industry = "Real Estate". Land on the dashboard → header terminology says "Showings/Buyers" (real_estate pack), Intake analytics tab shows the "Pre-approval funnel" preset chip.
2. From `/for-business`, click the HVAC card → Start 48-hr demo. Inside the demo company, dashboard loads HVAC widgets, AI booking agent system prompt includes the HVAC delta + intake fields (visible in `ai-agent-chat` logs).
3. Same for one of the previously-drifting verticals (Solar) — confirm the demo no longer falls back to generic.
4. Spot-check `companies.industry_vertical` in the DB — every new row matches a value in `industry_template_packs.industry_id`.

## Files touched

```text
NEW   src/lib/industryIdAliases.ts
NEW   supabase/functions/_shared/industry-aliases.ts
EDIT  src/pages/Auth.tsx                              (write industry on signup)
EDIT  src/lib/industryTemplates.ts                    (rename 10 keys → canonical)
EDIT  src/lib/industryMarketingContent.ts             (rename 4 keys → canonical)
EDIT  supabase/functions/create-demo-trial/index.ts   (normalize + rename keys)
DATA  insert tool: UPDATE companies (backfill drifts)
MEM   mem://architecture/industry-id-canonical-standard (new rule)
```

No DB schema migration is needed — `industry_vertical` is already a freeform `text` column. Only a data update.
