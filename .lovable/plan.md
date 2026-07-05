# Sequenced Pass: Phase 4A → Phase 5 → Phase 2

Executed in order, one phase committed before the next starts.

## Phase 4A — Rewrite 4 highest-traffic console guides

Target consoles:
1. **Dashboard** (Simple + Pro modes)
2. **Field Ops Console** (`/dashboard/ai-consoles/field-ops`)
3. **Business Management Console** (`/dashboard/ai-consoles/business-mgt-ops`)
4. **Marketing & Sales Console** (`/dashboard/ai-consoles/marketing-sales`)

Each guide uses the 6-section template:
```text
1. What this console does (1 sentence, industry-aware via useIndustryPack)
2. Who uses it (role)
3. Step-by-step first-run walkthrough (5–8 steps)
4. Key AI actions you can ask Aura here (5 pack-aware examples)
5. Common issues + fixes
6. What connects (integrations / other consoles this feeds)
```

Delivery:
- Extend `src/lib/helpContentConfig.ts` with a `consoleGuides` map keyed by console ID.
- Extend `src/lib/industryHelpContent.ts` so healthcare + trade + restaurant + retail verticals get overrides on section 1 (description), section 3 (walkthrough), and section 4 (AI actions).
- Render the guide via a shared `<ConsoleGuidePanel />` (new, `src/components/help/ConsoleGuidePanel.tsx`) mounted inside each console header's existing help sheet/drawer (or added if none exists).
- No visual-design changes to the console shell.

Verification:
- `tsgo` clean.
- Playwright: open each of the 4 consoles, open its help drawer, screenshot; open dashboard in Simple + Pro, screenshot.

## Phase 5 — Export document QA

Enumerate every PDF template under `src/components/documentation/*PDF.tsx` and any PDF generator under `src/lib/pdf/`. For each:

1. Render sample output to `/tmp/pdf-qa/<name>.pdf`.
2. `pdftoppm -jpeg -r 120` → inspect every page image with `code--view`.
3. Fix any of: hardcoded pricing (route through `launchPricing.ts`), stale tier names, removed-feature refs, "Lovable" leaks, layout breaks, clipped text, broken tables.
4. Confirm the "3rd-party pass-through cost" disclaimer appears wherever integrations are named (per `legal/third-party-fee-disclaimer` memory).
5. Re-render and re-inspect after fixes.

Known targets so far (final list from enumeration in-turn):
- `MarketingSalesMasterPDF.tsx` (already partial fix — full QA now)
- `IndustryMarketingKitPDF.tsx`
- `CompanyOnboardingPDF.tsx`
- Any others discovered in the directory scan.

Deliverable: a short QA log summarizing per-PDF findings + fixes.

## Phase 2 — Mock data purge across all pages

Full pass. Per user's earlier rule: **replace with `IndustryEmptyState` (not hide, not flag)**.

Method:
1. Enumerate list/table/chart-rendering pages under `src/pages/**` and `src/components/**` that could show empty state.
2. Grep for hardcoded arrays used as list source, `Math.random`-generated display values (excluding legitimate ID gen), demo/sample arrays, and any component that renders a hardcoded row when `data.length === 0`.
3. For each hit:
   - If a real query exists → keep the query, replace the fallback rows with `<IndustryEmptyState variant="..." />`.
   - If no query exists → wire the query (only when the table exists in Supabase and the shape is obvious) OR replace the mock with `<IndustryEmptyState />` and add a TODO comment tying it to the missing backend.
4. Exclude: `/cyber-sentry-mockup*` (platform_admin gated demo), `/dashboard/demo-seeder`, marketing pages under `src/pages/Index.tsx` / `ForBusiness.tsx` (those are marketing copy, not data), all `*.test.tsx`.

Verification:
- `tsgo` clean.
- Playwright: log in as a fresh demo account with empty data, load 6 representative pages (Leads, Quotes, Invoices, Inventory, Customers, Analytics), screenshot each and confirm empty states render with industry-aware CTAs.

## Delivery & pacing

- Each phase committed independently. If a phase surfaces >20 files needing edits, I'll pause after the first batch, report progress, and continue rather than silently chain long tool loops.
- Final summary lists: files changed per phase, PDFs re-QA'd, mock-data instances converted, and any items I flagged for user decision (e.g., missing backend for a chart).

## Scope notes / risks

- Not touching visual color-token purge (still deferred per your prior choice).
- Not restructuring the marketing hero page (`Index.tsx`) — only text drift, if any surfaces incidentally.
- If a supposed "mock" turns out to be intentional demo content on a marketing surface, I'll leave it and note it in the summary.
