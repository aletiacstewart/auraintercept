## Screenshot-verified UI cleanup (5 fixes)

All five claims verified against source. Planning the four small fixes and one scoped content fix.

### Fix 1 — Default industry label (HIGH)
`src/lib/industryMarketingContent.ts` line 57: change the `default` entry's label from `'Aura Intercept'` to `'your business'`. Renders "See it in action — for your business." on `/for-business` before an industry is picked, and flows into `IndustryROICalculator`'s `industryLabel`.

### Fix 2 — Duplicate "Social Media" sidebar labels (MEDIUM)
`src/components/dashboard/DashboardLayout.tsx` line 172: rename the integrations entry label from `'Social Media'` to `'Social Media Setup'`. The console entry at line 148 stays `'Social Media'`. Routes unchanged.

### Fix 3 — Raw snake_case business type badge (MEDIUM)
`src/lib/businessTypeConsoleContext.ts` around line 44: add a small `humanize()` helper (`replace(/_/g,' ')` + title-case) and apply it only to the fallback path when `matrixRow?.name` is missing. Common case (matrix hit) is untouched.

### Fix 4 — Industry-aware specialist example prompts (MEDIUM)
`src/pages/ai-consoles/SpecialistOperativesConsole.tsx`:
- Change each specialist's `examples: string[]` in `SPECIALISTS_RAW` to `examples: Record<string, string[]>` with a `default` key holding today's trades prompts (zero-change fallback).
- Resolve the active industry cluster via the existing industry pack / company context already used elsewhere in the console (I'll confirm the exact hook while editing — likely `useIndustryPack`).
- In render, use `examples[clusterKey] ?? examples.default`.
- Seed one cluster (`saas_platform`) with tailored prompts for 2–3 specialists (Diagnostic + one or two others) as the proof-of-concept. Remaining specialists/clusters fall back to trades prompts unchanged.

### Fix 5 — Preview button naming on Web Presence (LOW)
`src/pages/SmartWebsiteManager.tsx` ~lines 331–343: label-only change.
- Toggle button: `'Live Preview'` / `'Hide Preview'` → `'Preview Panel'` / `'Hide Panel'`.
- New-tab button: `'Preview'` → `'Open Live Site'`.
Behavior unchanged.

### Out of scope (per prompt, low-confidence visual-only items)
Automation page table refactor, Customer Portal missing icon labels, Setup Progress widget auto-collapse — not touching this pass.

### Verification
- Build passes.
- `/for-business` (no `?industry=`): CTA reads "for your business."; ROI calculator label updated.
- Sidebar shows `Social Media` + `Social Media Setup`, both routes intact.
- A `saas_platform` account (no matrix row) shows "Saas Platform" (or "SaaS Platform" if I special-case; will use generic humanize → "Saas Platform") instead of `saas_platform`. Matrix-backed types still use `matrixRow.name`.
- Specialist console: `saas_platform` company sees tailored prompts on seeded specialists; trades companies see original prompts everywhere.
- Web Presence: both buttons work as before; labels updated.
