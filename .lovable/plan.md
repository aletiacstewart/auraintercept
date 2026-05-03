## Findings

### 1. Help page is only partially industry-aware

`src/pages/Help.tsx` resolves industry-aware **example prompts** via `getIndustryUseCases()` (good), but **everything else on the AI Agents tab is still generic / HVAC-flavored**:

- Console **descriptions** in `CONSOLE_HELP_CONFIG` mention "AC repair", "HVAC", "water heater", "air filters", "summer AC tune-up", etc.
- Console **features** lists are static (e.g., "Photo documentation for job check-ins", "Service catalog with pricing").
- Console **tabs** (`Quote / Invoice / Lead / Inventory / Companies`) don't reflect healthcare reality (no inventory in dental, no leads in PT, etc.).
- The **Voice / Company-Employees / FAQ** tabs also use trades language (e.g., "Field Ops dashboard", "AC repair tomorrow", "HVAC maintenance").
- `industryHelpPrompts.ts` has good healthcare overrides for `customer_portal` but **falls through to generic** for `field_operations`, `business_management`, `social_media`, `creative_web_presence`, `analytics_reports`, `ai_operatives_hub` on most healthcare verticals (only `customer_portal` is overridden per-industry; the `HEALTHCARE_SHARED` block is spread but is only partial).

### 2. PWA install pages are NOT industry-specific

The 5 install pages are hardcoded:

| File | Header copy | Issue |
|---|---|---|
| `FieldOpsInstall.tsx` | "Technician Field Ops Install" / "Deploy the Field Ops mobile app to your technicians' devices" | Says "Technician" for dental/vet/PT/etc. |
| `DispatchFieldOpsInstall.tsx` | Dispatch / Shop Queue copy | Wrong noun for healthcare (should be Front Desk / Patient Schedule) |
| `BusinessMgtOpsInstall.tsx` | Generic admin | Mostly OK but references trades terminology in subcards |
| `CustomerPortalAppInstall.tsx` | Customer-facing PWA | Says "customer" everywhere — should say "patient" / "client" / "guest" per industry |
| `TechnicianInstall.tsx` | "Technician" PWA | Same naming issue for healthcare |

None of them use `useIndustryPack()` or `getNavLabels()`.

## Plan

### Part A — Make the Help page fully industry-aware

1. **Extend `src/lib/industryHelpPrompts.ts`** to also export industry-aware overrides for:
   - `consoleDescription` (per console + per industry)
   - `consoleFeatures` (per console + per industry, additive — generic features stay, healthcare-specific ones added)
   - `consoleTabs` (per industry override list — e.g., dental Field Ops tabs become "Patient Lookup / Update Status / Insurance Note / Complete Visit")

2. **Add `getIndustryConsoleConfig(consoleId, pack, fallbackConfig)`** that returns the merged config (description + features + tabs + use cases) and call it inside `Help.tsx` instead of reading `currentConsole` fields directly.

3. **Replace HVAC-flavored generic copy in `helpContentConfig.ts`** with industry-neutral defaults (e.g., "Accept your next job and notify the customer" stays, but "Generate a quote for HVAC installation" → "Generate a quote for the next job"). Generic stays generic; healthcare/real-estate/restaurants get explicit overrides.

4. **Update the static "Field Technician Dashboard Features" section** (lines 570-597) and the Voice "Pro Tips" / FAQ blocks to use `navLabels.techView` / `jobNoun` (already imported via `useIndustryPack` — needs `getNavLabels`).

5. **Add healthcare override coverage** in `industryHelpPrompts.ts` for the 5 missing consoles per the 6 healthcare verticals (dental / chiropractic / medical_office / veterinary / physical_therapy / optometry), so the prompts stop falling through to "AC repair".

### Part B — Make PWA install pages industry-aware

1. **`FieldOpsInstall.tsx`** — read `useIndustryPack()` + `getNavLabels()`; render header as:
   - Dental: "Hygienist Mobile App Install"
   - Vet: "Vet Tech Mobile App Install"
   - Trades: "Technician Field Ops Install" (current default)
   - Replace "technicians' devices" with `${navLabels.teamMemberNoun.toLowerCase()}s' devices`.

2. **`DispatchFieldOpsInstall.tsx`** — header switches based on cluster:
   - Healthcare: "Front Desk / Patient Schedule App Install"
   - Repair: "Shop Queue App Install"
   - Booking: "Schedule App Install"
   - Trades (default): "Dispatch & Field Ops App Install"

3. **`CustomerPortalAppInstall.tsx`** — replace literal "customer" tokens with the industry customer noun (`patient`, `client`, `guest`, `member`) using `pack.terminology.customer` (already on the pack).

4. **`BusinessMgtOpsInstall.tsx`** — replace static service examples in subcards with industry-neutral copy or pack-driven examples.

5. **`TechnicianInstall.tsx`** — same pattern as FieldOpsInstall: dynamic header noun + body copy.

6. **All 5 pages** — keep route paths unchanged (per `Console Routes Standard` memory). Only header titles + descriptions + body copy change.

### Part C — Memory updates

Add `mem://features/help/industry-aware-content-standard`:
> Help page (Help.tsx) and all 5 PWA install pages MUST resolve console title/description/features/tabs and customer/team-member nouns from `useIndustryPack()` + `getNavLabels()`. Generic config in `helpContentConfig.ts` is the trades default — every other industry (especially the 6 healthcare verticals) requires explicit overrides via `industryHelpPrompts.ts` (rename to `industryHelpContent.ts` or extend in-place).

### Out of scope

- No new install pages, no new routes.
- No changes to `helpContentConfig.ts` console structure (ids, required tiers, agent IDs stay).
- No changes to PWA service worker / manifest scope.
