Approved direction: **option A** — full 185-row business-type → profile table in source-controlled TS, with optional DB column override.

## Phase 1 — Canonical Profile Registry (this rollout)

**New files**
- `src/lib/industryProfiles.ts` — `ProfileKey = 'PROFILE_A'…'PROFILE_J'`, plus `PROFILE_SPECS[ProfileKey]` containing:
  - `consoles: ConsoleId[]` (subset of C1–C7)
  - `agentsAlwaysOn`, `agentsDefaultOn`, `agentsDefaultOff`, `agentsHidden`, `agentsOptional` (string[])
  - `dashboardWidgets: string[]` (primary widget order)
  - `receptionistScriptId: string`
  - `labelOverrides: { technician?, job?, quote?, hideDispatch?, hideRoute? }`
- `src/lib/businessTypeProfileMap.ts` — full 185-entry `Record<string, ProfileKey>` parsed from doc Section 4 (pages 19–29). Includes `getProfileForBusinessType(vertical)` with normalization (lowercase, strip punctuation, alias lookup via `industryIdAliases`) and `PROFILE_D` fallback.
- `src/hooks/useCompanyProfile.ts` — returns `{ profileKey, spec, loading }`. Source priority: `companies.profile_key` (override) → map lookup on `companies.industry_vertical` → `PROFILE_D`.

**Migration**
- Add nullable `profile_key text` column to `public.companies` and `public.industry_template_packs`.
- Backfill `companies.profile_key` from `industry_vertical` via a one-shot UPDATE using a CASE built from the same 185-row map (generated SQL).
- Add a CHECK-equivalent via trigger limiting values to PROFILE_A…PROFILE_J.

**Tests**
- `src/lib/__tests__/industryProfiles.test.ts` — for every entry in the 185-map, assert the resolved spec has consoles per Section 3 and that `getProfileForBusinessType` is case/alias tolerant. Spot-check Profile A/B/C/D/E/I expectations from the spec.

**Out of scope for Phase 1** (queued for later phases per the approved plan)
- Sidebar removal, agent lock/hide enforcement, dashboard widget swap, receptionist scripts, label-remap wiring, functional audit.

I'll start by writing the migration (needs approval), then push the TS files + hook + tests in one batch after the migration runs and types regenerate.