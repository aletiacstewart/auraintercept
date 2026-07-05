# Full Site Audit + Auto-Fix Pass

Single sweeping pass across the app. Findings and fixes ship together in phased commits so we can spot-check between phases, but I don't stop for approval between phases unless something looks structurally wrong.

## Phase 0 — Inventory (read-only, ~1 turn)

Produce an internal working manifest (not shipped to user) covering:

- **Routes** — every route in `src/App.tsx` + nested routers. Confirm each renders a real page (no `NotFound`, no orphan).
- **Consoles** — 10 operative consoles + Dashboard, Field Ops, Dispatch, Business Mgt, Customer Portal, Social, Content Engine, Analytics, Marketing/Sales, Receptionist, Appointment, Pipeline, Custom.
- **Agents** — all 24 agents in `agentStyles.ts` / `subscriptionAgentConfig.ts`. Cross-check against edge functions that back them.
- **Edge functions** — enumerate `supabase/functions/*`. Flag any UI call site pointing at a function that no longer exists, and any function with no call site.
- **Buttons/links** — grep for `onClick`, `<Link`, `navigate(`, `href=`. Flag `TODO`, `console.log('todo`, empty handlers, `href="#"`, `disabled` w/o reason.
- **Mock data** — grep for `mock`, `fake`, `sample`, `demoData`, `Lorem`, hardcoded arrays used as list sources in production pages (exclude `/dashboard/demo-seeder` and marketing surfaces).
- **Guides & docs** — `Help.tsx`, `AIAgentGuide.tsx`, `IntegrationDocs.tsx`, `helpContentConfig.ts`, `industryHelpContent.ts`, `industryHelpPrompts.ts`, per-console "How to use" panels, install pages (5 PWA install pages), export docs (`ExportDocs`, PDF generators in `src/lib/pdf/*`), tutorial content (`useTutorial.ts`), walkthrough (`aura-walkthrough.mp4` context copy).
- **Pricing/tier/naming drift** — cross-check every human-readable pricing/tier/agent-name string against `launchPricing.ts` + `canonicalNames.ts` + memory registry.
- **Empty states** — verify every list surface uses `IndustryEmptyState` (per memory), not blank divs or fake rows.

## Phase 1 — Functional fixes (P0)

- Wire or remove **non-functional buttons** (dead onClicks, `href="#"`, "Coming soon" that has no toggle).
- Fix **broken navigation** (routes that don't exist, links to deleted pages).
- Remove **references to deleted features** (CRM, warranty, multi-location — per memory these are removed but stale mentions may exist).
- Confirm every **agent** has a live edge function backing it; if not, hide the trigger behind a feature flag / disabled state with clear copy.
- Confirm each **console tab** actually loads data (no perpetual skeleton, no infinite spinner from a missing query).

## Phase 2 — Mock data purge → industry empty states

Per user's answer, **replace all mock/placeholder data with `IndustryEmptyState`** (no hiding).

- Grep + fix: hardcoded arrays feeding dashboards, KPIs, lists, charts.
- Every list/table without rows → `IndustryEmptyState` with tenant-appropriate CTA.
- Every KPI card with no live source → either wire to the real query (if it exists) or render a "No data yet — [CTA]" state using the pack's copy.
- Charts without data → empty-chart component with the same industry CTA pattern.

## Phase 3 — Content consistency sweep

- **Pricing strings** — all human-readable prices route through `launchPricing.ts` helpers (`formatMonthlyCost`, `formatOnboardingCost`, `formatSalesLine`). Purge any remaining `$497` / `$697` / `$994` string literals in copy, prompts, PDFs, blog templates, campaign templates, marketing pages.
- **Tier names** — canonical: Aura Core, Aura Boost, Aura Pro, Aura Elite. Purge legacy names in visible copy.
- **Agent names / operative labels** — reconcile against `canonicalNames.ts` + memory (Front Desk, On The Way, Billing, etc.).
- **Trial copy** — 60-Day Live Trial (30d onboarding + 30d live). Purge any "14-day" / "30-day trial" remnants.
- **3rd-party disclaimers** — every SignalWire / ElevenLabs / Resend / Tavily / Stripe / Upload-Post surface has the customer-pass-through disclaimer per `legal/third-party-fee-disclaimer` memory. No "bundled/overage/absorbed" copy.
- **Industry-aware copy** — Help + install pages + console headers resolve terminology through `useIndustryPack` + `getNavLabels` (per `features/help/industry-aware-content-standard`). No hardcoded "HVAC", "technician", "AC repair" in generic surfaces.

## Phase 4 — Guide rewrites (per-console, full rewrites)

Per user's answer, **full rewrite per console**, plus author guides where missing. Each guide follows the same template:

```text
1. What this console does (1 sentence, industry-aware)
2. Who uses it (role)
3. Step-by-step first-run walkthrough (5–8 steps)
4. Key AI actions you can ask Aura in this console (5 examples, pack-aware)
5. Common issues + fixes
6. What connects (integrations / other consoles this feeds)
```

Consoles covered (full rewrite each):

- Dashboard (Simple + Pro modes)
- Field Ops Console
- Dispatch/GPS Console
- Business Management Console
- Marketing & Sales Console
- Social Media Console
- Content Engine Console
- Analytics Console
- Customer Portal Console
- Receptionist Console
- Appointment Console
- Pipeline Console
- Technician Console (mobile)
- Customer Portal (customer-facing)
- Onboarding / Fast Start
- Integrations pages (CRM, Calendar, Email, SMS, Voice, Tavily)
- Settings (7 categories)
- Help hub (index rewrite tying them together)

Delivery: rewritten copy lives in `helpContentConfig.ts` + `industryHelpContent.ts` + new per-console `*.help.ts` sidecars where appropriate. Install pages (5 PWA installers) get fresh step-by-step per install method.

## Phase 5 — Export documents

- Regenerate PDF templates (`src/lib/pdf/*`, outreach toolkit, audit report, ROI calculator export, agent guide export).
- Ensure every generated doc: current pricing, current tier names, current disclaimers, industry-aware terminology, no dead feature references, no "Lovable" text visible to customers.
- QA every PDF/PPT by rendering to image and eyeballing per `documents-artifacts` rule.

## Phase 6 — Verification

- `tsgo` typecheck (harness runs it).
- Playwright smoke: dashboard, one console per category, one install page, one export doc, one industry-specific empty state. Screenshots to `/tmp/browser/`.
- Build clean.
- Report back: what was fixed, what was rewritten, what (if anything) I flagged as needing user decision.

## Deliverable

A single closing message summarizing: routes touched, functional fixes count, mock-data instances replaced, consoles rewritten, exports regenerated, and any items I couldn't auto-decide (with recommendation).

## Scope notes / risks

- **Not touching**: `auth.users` schema, Stripe price IDs (legacy grandfathered), `src/integrations/supabase/client.ts` + `types.ts` (auto-gen), demo seeder data.
- **Deferred (from prior plan, still deferred)**: Pass 2 color-token purge (~548 instances) — user chose to skip and this pass respects that unless a color mismatch is directly inside a rewritten guide.
- **High-risk file**: `src/pages/Index.tsx` marketing page — I'll only touch stale pricing/tier/agent copy there, not restructure.
- **Turn budget**: this is large. If I hit ~30 tool turns without finishing, I'll pause, deliver what's done, and list what remains.
