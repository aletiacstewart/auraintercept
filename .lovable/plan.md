## Goal
Complete the industry-aware refactor so every console, dashboard widget, KPI tile, and AI agent prompt adapts to the active `industryAgentMap` config — across all 28 verticals (validated end-to-end with the demo accounts).

## What's already done
- `src/lib/industryAgentMap.ts` — central config with field/booking/repair variants and 18+ industry overrides.
- `FieldOpsConsole`, `FieldOpsAgentConsole`, `FieldOpsManager`, `FieldOperations` page — read from the map.

## Remaining changes

### 1. Technician surfaces (mobile workers across all verticals)
- **`src/pages/technician/TechnicianAIConsole.tsx`** — replace hardcoded "Field Operations Console" title/subtitle with `cfg.workerConsoleTitle` / `workerConsoleDescription` from `industryAgentMap`. Pass industry-aware `show` list to `SpecialistOperativesLauncher`.
- **`src/pages/technician/TechnicianDashboard.tsx`** —
  - Replace `STATUS_STYLES` labels (`En Route`, `On Site`, …) with `cfg.statusLabels`.
  - Replace stat card labels (`Pending` / `Active` / `Done`) and "Active Jobs"/"All Jobs" copy with `cfg.jobNoun` derivatives ("Open Visits", "All Appointments", etc.).
  - `getNextAction` labels (`Start Route`, `Check In`, `Start Job`, `Complete`) come from a `cfg`-driven map (booking → "Check In Pet/Client", "Start Visit/Service").
  - "Directions" button hidden when `cfg.fieldRouting === false` (already gated by `showAddress`, but reinforce).

### 2. Operations consoles (route by `operatingModel`)
- **`src/pages/operations/AppointmentConsole.tsx`** —
  - Use `getIndustryServiceConsoleConfig(pack)` for title, KPI labels (`cfg.providerNoun`, `cfg.roomNoun`, `cfg.jobNounPlural`).
  - Remove the trades-specific footer copy ("no truck map, no dispatch board") in favor of `cfg.appointmentBoardDescription`.
  - Wire booking-cluster KPIs (no-shows, today, week) to industry copy ("Visits today", "Appointments today", "Showings today").
- **`src/pages/operations/PipelineConsole.tsx`** — remove "no dispatch board, no truck map" comparative copy; use neutral `cfg`-driven description.
- **`src/pages/operations/ReceptionistConsole.tsx`** + **`CustomConsole.tsx`** — pass through industry-aware title/description from `cfg`.

### 3. Dashboard widgets & KPI strip
- **`src/components/dashboard/AuraTodayStrip.tsx`** — replace hardcoded "Open Jobs" tile with `cfg.openWorkLabel` + `cfg.openWorkRoute` and adjust the icon (`Wrench` only for field clusters; `CalendarCheck` for booking; `Briefcase` for repair). "Today's Bookings" label uses `cfg.todayLabel`.
- **`src/components/dashboard/IndustryWidgetGrid.tsx`** — already industry-driven via `pack.dashboard_widgets`; add a guard so any widget whose `cta.route` hits `/dashboard/dispatch-field-ops` is auto-rerouted to `cfg.openWorkRoute` when `cfg.fieldRouting === false` (prevents booking accounts landing on the dispatch map).

### 4. AI prompt context (so agents *behave* per industry, not just *look* it)
- **`src/hooks/useMultiAgentChat.ts`** — extend `buildEnrichedContext()` to inject:
  - `industry_id`, `industry_label`, `cluster`
  - `terminology` block (jobNoun, customerNoun, teamMemberNoun, providerNoun, roomNoun)
  - `fieldRouting` flag and HIPAA/clinical guardrail line for healthcare clusters.
  Source from `useIndustryPack()` + `getIndustryServiceConsoleConfig()`. Pass through to the `ai-agent-chat` edge function in `pageContext` (no edge changes required; the prompt-injection helper already reads it).

### 5. Validation pass
- Add a small lint script `scripts/audit-industry-strings.ts` (dev-only, not shipped) that grep-fails on any remaining hardcoded "Field Operations", "Technician", "Dispatch", "Truck" strings outside the trades-cluster overrides and `industryAgentMap.ts` itself.
- Manual smoke-test (using existing demo accounts from the demo registry) for one account per cluster:
  - **Trades:** `hvacadmin@demo.com`
  - **Outdoor:** `landscapeadmin@demo.com`
  - **Repair:** `autocareadmin@demo.com`
  - **Booking:** `salonadmin@demo.com`
  - **Healthcare:** `veterinaryadmin@demo.com`, `dentaladmin@demo.com`
  - **Pro/RE:** `realestateadmin@demo.com`, `professionaladmin@demo.com`
  - **Restaurants:** `restaurantsadmin@demo.com`
  Verify: sidebar labels, dashboard KPI strip, widget grid, operations console, technician dashboard, technician AI console, and AI agent greeting all reflect industry terminology.

## Files to edit
- `src/pages/technician/TechnicianAIConsole.tsx`
- `src/pages/technician/TechnicianDashboard.tsx`
- `src/pages/operations/AppointmentConsole.tsx`
- `src/pages/operations/PipelineConsole.tsx`
- `src/pages/operations/ReceptionistConsole.tsx`
- `src/pages/operations/CustomConsole.tsx`
- `src/components/dashboard/AuraTodayStrip.tsx`
- `src/components/dashboard/IndustryWidgetGrid.tsx`
- `src/hooks/useMultiAgentChat.ts`
- `scripts/audit-industry-strings.ts` (new, dev tool)

## Out of scope
- No DB migrations.
- No new edge functions (existing `ai-agent-chat` already accepts `pageContext`).
- No changes to the 28 industry packs themselves — all overrides live in `industryAgentMap.ts`.

Reply **"go"** to execute. Specify any specific demo account you want validated first.