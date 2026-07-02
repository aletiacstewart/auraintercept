# Platform Deep-Dive Audit & Remediation Plan

Goal: bring every surface (UI, PDFs, prompts, docs, help, DB seeds, edge functions) into agreement with the current sources of truth — **homepage**, **onboarding**, **free audit**, and the **canonical naming registry** — and fix responsive/contrast issues along the way.

The audit ships as **phased, reviewable batches** so you can approve each phase before I touch the next. Nothing changes business logic; edits stay in copy, layout, tokens, seeds, and prompt strings.

---

## Sources of Truth (locked)

These files govern everything downstream. Any conflict = the downstream file loses.

- `src/lib/canonicalNames.ts` — console + agent display names, one-liners
- `src/lib/subscriptionAgentConfig.ts` — tier IDs, prices, operative→tier map
- `src/lib/launchPricing.ts` — active sale prices + Stripe IDs
- `src/lib/agentStyles.ts` — plain-English customer rollups
- `.lovable/memory/architecture/canonical-naming-registry.md`
- `.lovable/memory/style/voice-and-copy-standard.md`
- `.lovable/memory/product/trial-period-standard.md`
- `.lovable/memory/legal/third-party-fee-disclaimer.md`
- `src/pages/Index.tsx` (homepage), `src/pages/OnboardingForm.tsx`, `src/pages/OpportunityAudit.tsx` + `AuditReport.tsx`

---

## Phase 1 — Discovery & Drift Report (read-only)

Run parallel `rg` sweeps + subagent explorations and deliver a written **Drift Report** (no code changes yet). Report is grouped by severity.

**1a. Naming/number drift**
- Legacy agent counts: "19 AI agents", "8 agents", "12 agents", "16 agents" outside PDFs
- Legacy console names: "Business Management", "Field Operations Console", "Marketing & Sales", "Smart Website" as console header, trailing "Console"
- Legacy tier names/prices vs `TIER_AGENT_CONFIG` + `launchPricing.ts`
- Trial copy: "14-day", "30-day trial" (should be 90-Day Live Trial: 30d onboarding + 60d live)
- "Operative" used as per-unit label
- Forbidden marketing words: revolutionary, powerful, comprehensive, robust, seamless, AI-powered, leverage
- Third-party fee copy: "bundled", "overage", "absorbed", "included in your tier" (violates pass-through standard)

**1b. Content truth drift**
- PDFs under `src/components/documentation/*PDF.tsx` — cross-check every tier/price/agent count/console name against sources of truth
- Help content: `src/pages/Help.tsx`, `src/lib/howToUseContent.ts`, `helpContentConfig.ts`, `industryHelpContent.ts`, `industryHelpPrompts.ts`
- Guides: `AIAgentGuide.tsx`, `IntegrationDocs.tsx`, `integrationOnboardingData.ts`
- Prompts: `auraInterceptSalesPrompt.ts`, `helpSystemPrompt.ts`, `receptionistScripts.ts`, `industryAuraFraming.ts`, edge-function system prompts under `supabase/functions/**`
- Marketing PDFs / video scripts: `VideoPromptsPDF.tsx`, `videoPromptsData.ts`, promo/outreach toolkit PDFs

**1c. Responsive / contrast / a11y**
Playwright sweep at mobile (375), tablet (768), desktop (1280) on:
- `/`, `/pricing` sections, `/audit`, `/auth`, `/customer-auth`, `/signin`, `/dashboard`, each console (`/dashboard/*`), `/help`, install pages, technician app
- Capture: overflow, clipped text, tap targets <44px, low-contrast tokens (`text-gray-*`, `text-muted-foreground/50`, arbitrary `bg-[#..]`)
- Report per-page issues with screenshots

**1d. Database / seed drift**
- `supabase--linter` + `security--run_security_scan`
- Query `industry_template_packs`, `companies`, `ai_agent_configs`, `subscription_events` for legacy tier IDs, orphan agents, wrong console keys
- Cross-check `seed-demo-accounts-v2` + `initialize-company-agents` edge functions against `TIER_AGENT_CONFIG`

**Deliverable:** single markdown Drift Report saved to `/mnt/documents/drift-report.md` + inline chat summary with counts per category.

---

## Phase 2 — Naming & Copy Normalization

Apply Voice & Style Sheet v2 across all UI, prompts, and static content.

- Replace legacy console/agent/tier strings with `getConsoleName()` / `AGENT_DESCRIPTIONS` / `TIER_AGENT_CONFIG` lookups
- Rewrite forbidden marketing phrases per phrase bank
- Standardize trial copy to "90-Day Live Trial (30-day onboarding + 60-day full live use)"
- Standardize 3rd-party fee copy to pass-through language (number + who bills + why)
- Update i18n JSON: `src/locales/{en,es}/*.json`
- Update memory files that reference stale numbers (e.g. the index still says "60-Day Live Trial" — reconcile with `trial-period-standard.md`)

---

## Phase 3 — Documents, PDFs, Prompts

Rebuild every generated artifact off the same sources of truth.

- All `src/components/documentation/*PDF.tsx` (Video Prompts, Outreach Toolkit, Onboarding Guide, Audit Checklist, Sales Deck, Pricing Sheet, etc.)
- All prompt strings for operatives (edge functions + client-side)
- Help/AI Agent Guide / Integration Docs bodies
- Image assets that hard-code tier/price/agent counts (regenerate with `imagegen` when needed)
- Regenerate `public/sitemap.xml`, `public/llms.txt` if pages changed
- Per skill/pdf: render each PDF, screenshot every page, fix layout regressions, re-verify

---

## Phase 4 — Responsive & Contrast Fixes

- Fix issues from Phase 1c using shadcn primitives + semantic tokens only
- Replace `h-screen` → `h-dvh` where flagged
- Add `aria-label` to icon-only buttons
- Enforce tap-target min sizes on mobile
- Re-run Playwright sweep for regression

---

## Phase 5 — Database & Seed Reconciliation

- Migration(s) to normalize any legacy tier IDs / agent IDs found in Phase 1d (schema only; data updates via `supabase--insert`)
- Update `seed-demo-accounts-v2` + `initialize-company-agents` if drift found
- Reseed demo accounts from `/dashboard/demo-seeder` after edits
- Re-run linter + security scan; update security memory

---

## Phase 6 — Verification

- `rg` sweep for every forbidden phrase → zero hits
- Build + typecheck clean
- Playwright screenshots at 3 viewports for the 12 highest-traffic routes, attached to a final report
- Final report saved to `/mnt/documents/audit-remediation-report.md`

---

## Technical notes

- Batches use parallel tool calls per phase; each phase ends with a checkpoint summary before I move to the next.
- No business-logic changes. No schema changes beyond legacy-ID normalization if strictly required.
- Estimated scope: Phase 1 is 1 turn (heavy parallel search + one Playwright pass). Phases 2–5 are multi-turn depending on drift volume — I'll ask for approval at each phase boundary if the delta is large.

---

## Before I start — one confirmation

The current memory index says **60-Day Live Trial** but `canonical-naming-registry.md` (which I updated earlier) and `trial-period-standard.md` say **90-Day Live Trial (30d onboarding + 60d live)**. I'll treat **90-day** as the truth unless you say otherwise, and reconcile the index in Phase 2.

Reply "go" to run Phase 1 (read-only Drift Report), or tell me which phase to prioritize / skip.
