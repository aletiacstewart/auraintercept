# Content Audit & Heavy Simplification

## Phase 1 — Audit (deliverable first, no code edits)

Produce a single audit report at `/mnt/documents/content-audit-v1.md` (+ matching PDF). For each surface I'll list:

- File / route
- Word count + reading time (current)
- Duplicates / redundancies found (cross-page repeats, repeated value props, restated pricing, restated trial terms, restated 3rd-party policy, restated feature lists)
- Recommended cut % and target word count
- Sections to merge / collapse / delete entirely
- Canonical phrasing to enforce (one source of truth per concept)

### Scope inventory

**Public marketing**
- `src/pages/Index.tsx` (landing — hero, features, pricing, beta, FAQ)
- `src/pages/About.tsx`
- `src/pages/ForBusiness.tsx`
- `src/pages/Contact.tsx`
- `src/pages/AuditReport.tsx` + `OpportunityAudit.tsx` (Free Audit)
- `src/pages/Blog.tsx`, `BlogPost.tsx`

**Auth & onboarding**
- `src/pages/Auth.tsx` (signup flow + beta notice + tier selector)
- `src/pages/OnboardingForm.tsx`
- `src/components/onboarding/CompanyOnboardingForm.tsx`
- Fast Start wizard (`src/lib/industryFastStartQuestions.ts` + wizard UI)
- `src/components/billing/BetaSignupNotice.tsx` (already unified — verify)

**In-app dashboards / consoles / help**
- `src/pages/Dashboard.tsx` + `CompanyAdminDashboard`
- All `src/pages/ai-consoles/*` (8 consoles) — check headers/subheaders/empty states
- All `src/pages/operations/*` and `src/pages/technician/*`
- `src/pages/Settings.tsx` + `src/pages/settings/*`
- Help / guides: `src/lib/howToUseContent.ts`, `src/lib/featureTooltips.ts`, `src/lib/industryHelpContent.ts`, `src/pages/AIAgentGuide.tsx`, `src/pages/IntegrationDocs.tsx`

**Exportable docs / PDFs**
- `src/components/documentation/IntegrationOnboardingPDF.tsx` + `src/lib/integrationOnboardingData.ts`
- `src/components/documentation/VideoPromptsPDF.tsx` + `src/lib/videoPromptsData.ts`
- Audit Checklist PDF (AuditChecklistPDF)
- Workbook PDF (`supabase/functions/_shared/onboarding-workbook-sections.ts`)
- Outreach toolkit (7 PDFs per memory)
- Any `export-docs` page exports

### Known redundancy hotspots (pre-flagged)
1. **3rd-party billing policy** restated in: BetaSignupNotice, OnboardingForm, workbook section 6, IntegrationOnboardingPDF policy banner, channel cost disclaimers, billing screens. → Canonical short version + 1 link.
2. **60-Day Trial mechanics** restated in: Index hero, Index beta block, Auth, BetaSignupNotice, OnboardingForm, plan cards, FAQ. → One canonical sentence everywhere.
3. **Pricing tiers** restated in: Index pricing grid, BetaSignupNotice grid, Auth tier selector, Calculators, plan FAQ. → Drive everything from `launchPricing.ts`; remove inline price recaps where the grid is already visible.
4. **"What Aura does" feature lists** repeated across Index features section, ForBusiness, About, AIAgentGuide intro, several console empty states.
5. **Console intros/subtitles** — each AI console repeats "AI-powered…" preamble; collapse to one-liner.
6. **Onboarding fee coverage** explained 3× (BetaSignupNotice, OnboardingForm intro, Workbook section 7).
7. **Help / tutorial copy** duplicates console UI labels.

## Phase 2 — Heavy simplification edits (after audit approval)

Executed in 4 sub-batches (one parallel batch per scope group) once you approve the audit:

1. **Marketing pass** — trim Index 40–60%, collapse About + ForBusiness overlap, shorten FAQ, single canonical trial/pricing/3rd-party sentences.
2. **Auth + onboarding pass** — remove restated trial/pricing/policy blocks where BetaSignupNotice already covers them; tighten form helper text; condense workbook intros.
3. **In-app pass** — strip console subtitle preambles, dedupe empty-state copy via shared component, shorten Settings descriptions, collapse help articles that mirror tooltips.
4. **PDF / export pass** — shorten cover blurbs, dedupe per-provider purpose/why-needed, single policy banner referenced not repeated, tighten Video Prompts intro, shorten workbook section intros.

### Guardrails (cannot be cut)
- Legal disclaimer text (`mem://legal/third-party-fee-disclaimer`)
- Exact pricing numbers + "Launch Pricing" chip (`mem://billing/launch-pricing`)
- Trial mechanics numbers (60/30/30 days) — wording may shorten, numbers stay
- Tier names, operative names, route paths
- A2P 10DLC compliance language
- Anything memory-locked under Core rules

## Technical details

- Audit script: walks listed files, counts words via simple regex, emits markdown report with per-file table + cross-cutting duplicate matrix. PDF built via `reportlab` to `/mnt/documents/content-audit-v1.pdf`.
- No code-level refactors in Phase 1 — pure analysis.
- Phase 2 edits use search-replace within each file; new shared copy constants added to `src/lib/copy/` if a string is reused 3+ times.
- No backend, schema, pricing-logic, or routing changes.

## Out of scope

- Translations (`src/locales/es/*`) — English first; Spanish mirrors after English is locked.
- Blog post bodies (user-authored content).
- Email templates beyond what's already in `supabase/functions/_shared/`.
- Visual/layout redesign — copy-only.

## Deliverables

- Phase 1: `/mnt/documents/content-audit-v1.md` + `.pdf` with prioritized cut list.
- Phase 2 (after your approval of the audit): batched edits per scope group, summarized in chat.

## Phase 2 — Executed

- Consoles: stripped "AI-powered…" preambles in Analytics, Social Media, Business Management, Business Insights, Specialist Operatives; tightened Marketing & Customer Portal subtitles/banner.
- PDFs: shortened cover/intro blurbs and policy paragraph in IntegrationOnboardingPDF and VideoPromptsPDF.
- Marketing: trimmed About.tsx hero, mission, origin story, core-value descriptions, and corrected stat callouts (10 operatives / 4 tiers). Fixed ForBusiness pricing snapshot to current Launch Pricing (Elite $3,097, was $3,497) and shortened taglines.
- Auth/onboarding: BetaSignupNotice already canonical from prior turn; OnboardingForm copy verified already tight — no further trim needed.
