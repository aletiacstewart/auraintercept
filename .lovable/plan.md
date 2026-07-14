# Plan: Spanish coverage, data export, public status page

Six shippable prompts across three workstreams. Order below matches the "Suggested order" you specified.

## 1. A3 — Language toggle in mobile menu (5-min fix)

- `src/components/layout/PublicHeader.tsx`: inside the mobile `DropdownMenuContent`, add `<LanguageToggle variant="compact" />` at the top (above the first `DropdownMenuItem`), wrapped in a non-focusable container so it doesn't behave as a menu item.
- No other changes.

## 2. A1 — Translate homepage (`src/pages/Index.tsx`)

- Read `src/pages/Index.tsx` and `src/pages/ForBusiness.tsx` to mirror the existing `t('...')` key style (namespace `marketing`, dot paths like `marketing.hero.title`).
- Extend `src/locales/en/marketing.json` and `src/locales/es/marketing.json` with new keys covering:
  - `hero.h1`, `hero.subtitle`, `hero.rotatingSubtitles` (array)
  - `heroStats.*` labels
  - `agentCategories.<id>.name` / `.description` for every entry
  - Section headers: `sections.underTheHood`, `sections.multiChannel`, `sections.industries`, `sections.subscriptionPlans`
  - Pricing card taglines + CTA text
- Replace hardcoded JSX strings in `Index.tsx` with `t(...)` calls. Use `t('...', { returnObjects: true })` for arrays.
- Wrap "Aura Intercept" / "AURA INTERCEPT" wordmarks with `data-no-translate` (same pattern already used in `PublicHeader.tsx`).
- No layout/styling/logic changes.

## 3. C1 — Public status page v1 (manual)

**Migration** (`service_status` + `status_incidents`):

```text
service_status(id, component, status CHECK IN operational|degraded|down,
               updated_at, updated_by uuid)
status_incidents(id, title, description, severity CHECK IN minor|major|critical,
                 started_at, resolved_at, created_at)
```

- GRANT `SELECT` to `anon, authenticated`; `ALL` to `service_role`.
- RLS: public SELECT `USING (true)`; INSERT/UPDATE/DELETE gated by `has_role(auth.uid(), 'platform_admin')`.
- Seed 5 rows: `ai_receptionist`, `booking`, `billing`, `sms_email`, `customer_portal` = `operational`.
- `updated_at` trigger on `service_status`.

**Pages/routes**:
- `src/pages/StatusPage.tsx` — public route at `/status`, added to router alongside `/privacy-policy` and `/terms-of-service`. Renders components with green/yellow/red badges + last 10 incidents (empty-state message if none in 30d). Wrapped in `PublicHeader` + `PublicFooter`.
- Admin editor: new tab `Status` in `src/pages/PlatformHealth.tsx` (already platform-admin only) with a simple table to change each component's status and a form to post/resolve incidents.
- `src/components/layout/PublicFooter.tsx`: add "Status" link next to Privacy/Terms.

## 4. B1 — Self-serve CSV data export

- Inspect `ExportReportForm.tsx` (or similar) to determine current CSV approach; reuse it. If none present, use client-side `papaparse` (already in dep tree — verify; if missing, use small manual CSV builder — no new deps).
- New component `src/components/settings/DataExportPanel.tsx`:
  - Buttons: Customers, Appointments, Invoices, Call & Chat Logs.
  - Each queries the relevant table(s) via supabase client scoped to `company_id = get_user_company_id(auth.uid())` (relies on existing RLS; no schema change).
  - Datasets → tables:
    - Customers → `customers`
    - Appointments → `appointments`
    - Invoices → `invoices` (+ optionally join `invoice_line_items` in a second sheet, but v1 stays single-table)
    - Logs → `call_logs` + `ai_agent_logs` (two separate CSVs, or a `dataset` selector)
  - Triggers download of `aura-<dataset>-<YYYY-MM-DD>.csv`.
- Mount in `src/pages/Settings.tsx` under a new accordion item "Export your data" inside the existing **Company** tab (keeps the 7-tab structure intact per the settings-consolidation memory).

## 5. B2 — Trust reassurance line on ForBusiness

- In `src/pages/ForBusiness.tsx`, near the IndustryValueProps / ROI section, add one line: "Your data is always yours — export everything, anytime, right from Settings." Link text → `/dashboard/settings?tab=company#export` (or scroll target if same-page not applicable; use a normal `Link`).
- Add matching `t('marketing.dataOwnership')` key in en/es marketing.json.

## 6. A2 — Industry-specific content translation (highest-traffic packs)

- Read `src/lib/industryMarketingContent.ts`. Refactor `getIndustryContent(packId)` to accept an optional language OR read `i18n.language` internally, and return language-scoped content with English fallback.
- Simplest shape: change map to `{ [packId]: { en: {...}, es?: {...} } }` and resolve with `content[packId]?.[lang] ?? content[packId]?.en`.
- Add Spanish content for: `hvac`, `auto_repair`, `plumbing`, `electrical`, `salon`, `restaurant`.
- Audit `IndustryROICalculator` and `PricingComparisonTable` components; extend `t()` coverage where missing (labels, unit suffixes, "per month", etc.), adding keys under `marketing.roi.*` and `marketing.pricing.*`.
- No visual/logic changes; all other packs fall back to English silently.

---

## Technical notes

- **Order of DB migrations**: only one new migration needed (status tables). B1 is client-side only; A1/A2/A3/B2 are frontend-only.
- **Edge functions**: none needed. B1 uses direct table queries under existing RLS.
- **CSV lib**: prefer existing pattern; if none, tiny inline `toCsv(rows)` helper (escape quotes, join with `\r\n`) — avoids new dep.
- **Status page RLS**: public-read is intentional and safe (only component names + statuses, no PII).
- **Admin status editor** lives in `PlatformHealth.tsx` (already `platform_admin`-gated) rather than a new page.
- **i18n arrays**: `t(key, { returnObjects: true }) as string[]` for rotating subtitles.
- **Deferred**: C2 (auto-monitoring hookup) — explicitly not in this batch per your instructions.

## Out of scope

- Translating all 28 industry packs (only 6 in A2).
- Automated status monitoring (C2 — later).
- Scheduled or emailed exports (B1 is on-demand only).
- Changing layout, styling, or business logic anywhere.
