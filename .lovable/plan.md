## Phase 3 — Final Content Sweep

Complete the remaining surfaces flagged in the Phase 1 audit but not yet touched.

### Scope

**1. Public marketing (remaining)**
- `src/pages/Contact.tsx` — trim hero + form helper copy
- `src/pages/Audit.tsx` — collapse intro, tighten checklist preamble
- `src/pages/Blog.tsx` + post templates — strip repeated brand boilerplate
- `src/pages/ForBusiness.tsx` — second pass on feature card descriptions

**2. Help, guides, tooltips**
- `src/lib/howToUseContent.ts` — cap each article ≤60 words, remove tooltip duplication
- `src/components/help/*` and any in-app guide modals — dedupe with tooltips
- Settings page descriptions — one-line each

**3. PDFs / exportable docs (remaining)**
- `src/components/documentation/AuditChecklistPDF.tsx`
- `src/components/documentation/WorkbookPDF.tsx`
- Any remaining `*PDF.tsx` cover/intro blocks — apply same trim pattern as VideoPrompts/IntegrationOnboarding

**4. Dashboards & consoles (second pass)**
- `CompanyAdminDashboard` Simple-mode subtitles and KPI helper text
- Remaining AI console subtitles not touched in Phase 2
- Empty-state strings via `IndustryEmptyState` — confirm no duplicate "no data yet" phrasing

**5. Onboarding (second pass)**
- `OnboardingForm` step descriptions — one-line per step
- Fast Start wizard — remove restated trial/3rd-party copy (now canonical in BetaSignupNotice + Auth)

### Rules
- Preserve all canonical facts: 4 tiers, Launch Pricing, 60-day trial (30+30), 10 operatives, 7 consoles, 3rd-party pass-through policy.
- No design/layout changes — copy only.
- No new components; edit in place.
- Skip files already at minimum viable copy.

### Deliverable
- Updated `/mnt/documents/content-audit-v1.md` with a "Phase 3 — Completed" section listing each file touched and approx. word reduction.
- No new PDF export unless you request one.

### Out of scope
- Visual redesign, route collapsing, component restructuring.
- Backend/data changes.
- Re-pricing or policy changes.
