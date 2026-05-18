## Goal

Update the dynamic demo pages: replace the hero subtitle and change every "48 hours / 48-hour" reference to "24 hours / 24-hour".

## Hero copy change (`src/pages/ForBusiness.tsx:76`)

- Before: `Pick your industry — page & 48-hour demo update instantly.`
- After: `Pick Your Industry from the dropdown and start a 24-hour demo.`

## 48 → 24 across demo surfaces

Update every occurrence in dynamic-demo files:

1. `src/pages/ForBusiness.tsx`
   - L64 meta description: `48-hour live demo` → `24-hour live demo`
   - L147: `48 hours. Full access...` → `24 hours. Full access...`
   - L151 CTA: `Start your 48-hour demo` → `Start your 24-hour demo`

2. `src/components/marketing/IndustryHero.tsx:37` — `Full access for 48 hours.` → `Full access for 24 hours.`

3. `src/components/marketing/IntegrationStatusPanel.tsx:16` — `48-hour demo` → `24-hour demo`

4. `src/components/marketing/StartDemoDialog.tsx`
   - L66 toast: `48-hour trial just started` → `24-hour trial just started`
   - L97 dialog title: `Your 48-hour demo is ready` → `Your 24-hour demo is ready`
   - L109 button: `Start your 48-hour {industryLabel} demo` → `Start your 24-hour {industryLabel} demo`
   - L186: `...stay active for 48 hours.` → `...stay active for 24 hours.`

5. `src/components/marketing/DemoCredentialsCard.tsx`
   - L80: `your 48-hour demo` → `your 24-hour demo`
   - L160: `After 48 hours the demo company is automatically deleted.` → `After 24 hours the demo company is automatically deleted.`

## Out of scope (untouched)

These also contain "48 hours" but are not dynamic-demo copy:
- `SalesPitchDataPDF.tsx`, `WebsiteCopyPDF.tsx` ("24–48 hours" implementation timeline)
- `ResendSetupGuide.tsx` (DNS verification)
- `IndustryMarketingKitPDF.tsx`, `industryTemplates.ts` (industry copy examples)
- `SmartWebsiteManager.tsx` (DNS propagation)
- `ReminderSettings.tsx` (48h reminder preset)

## Note

This does not change the actual demo lifetime in code/backend — only copy. If you also want the demo to actually auto-delete after 24 h instead of 48 h, flag that and I'll add the backend change separately.