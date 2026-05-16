## Goal

A complete, evidence-backed audit of the platform — every console, dashboard, agent, help doc, guide, layout, workflow, handoff, integration setup, and settings page — delivered as **(a)** a downloadable markdown report and **(b)** a platform_admin-only `/dashboard/audit-report` page that renders the same findings with clickable file/route links.

No source-of-truth code changes in this pass. Only two new files are added: the report under `/mnt/documents/` and the read-only viewer page.

## Initial pre-scan signals (already collected)

| Lens | Raw signal | Examples |
|---|---|---|
| Mock data | Low (zero-mock rule is holding). | None found in `src/` (clean). |
| Naming drift | **Real hits.** | `Contact.tsx` still ships `<SelectItem value="starter">`, `Index.tsx` navigates to `?tier=starter` (canonical is `core`). `AIHelpCenter.tsx` still says "7 consoles" — `ai-consoles/` has 14 files. |
| CRM/Warranty leftovers | **Real hits.** CSS tokens never cleaned up after removal. | `--feature-warranties` (index.css L74, L164), `.guide-card-crm` (L330), `.badge-feature-warranties`, `.icon-feature-warranties`, `.text-feature-warranties`, `.bg-feature-warranties`. |
| Duplicate install pages | Possible dup. | `CustomerPortalInstall.tsx` AND `CustomerPortalAppInstall.tsx` both exist. |
| CSS/theme violations | 1,054 hex literals; many are legit per-company brand colors, rest need triage. | `Companies.tsx` hardcodes `#0EA5E9`/`#8B5CF6` fallbacks instead of theme tokens. |
| Internal scrollbars | 107 `overflow-*` usages outside the allowed `max-h-[60vh]` chat exception. | Cyber-Sentry standard violation surface. |
| Debug leftovers | 38 `console.log/debug` calls in `src/`. | Need triage. |
| Lovable preview URLs | Clean in `src/` and `public/`. Edge functions correctly use `ai.gateway.lovable.dev` (internal — OK). | No `lovable.app` leaks in client. |
| Routes registered | 120 routes in `App.tsx`, 86 edge functions. | Need cross-check against nav surfaces and console route standard. |

## Audit areas (each becomes a section of the report)

1. **Mock / placeholder / static data** — sweep `src/`, every console, every dashboard widget, marketing pages, customer portal, technician PWA. Flag anything not wired to a real query/edge function. Verify against `mem://architecture/platform-functional-standard-v1`.
2. **Naming & terminology drift** vs canonical registry:
   - Tier names (Core / Boost / Pro / Elite, no `starter|growth|professional|enterprise` in routes/UI/Stripe params).
   - Agent ↔ Operative mapping (24 → 10) vs `mem://architecture/ai-agent/twenty-four-agent-model-standard`.
   - "Console" count claims (marketing/help vs reality).
   - Industry pack terminology leaks (hardcoded "Technician"/"Dispatch"/"Customer" where `getNavLabels` should resolve).
   - CRM/Warranty residue (CSS tokens, classes, copy).
3. **Workflow handoffs & connections**:
   - Onboarding → Guided Launch → Console handoff (`mem://features/onboarding/launch-and-state-management-standard`).
   - Agent-to-agent routing (`EVENT_ROUTING`, `mem://architecture/agent-handoff-logic-standard`).
   - Voice → SMS → Email follow-up chains, missed-call automation.
   - Setup → Integration activation → tier unlock badges.
   - Customer portal ↔ company switch flow.
   - PWA install routes ↔ `InstallOnPhoneButton` entry points.
4. **Settings & integration setups**:
   - SignalWire, ElevenLabs, Resend, Tavily, A2P 10DLC, Stripe, Google Calendar OAuth.
   - 3rd-party fee disclosures (bundled vs pass-through) — verify presence at every transaction surface.
   - Tier-lock UX (hard vs soft locks, unlock badges).
   - Settings consolidation (7-category standard).
   - Email & Tavily usage cap pages wired and surfaced.
5. **AI consoles & operatives** (14 console pages + Operatives Hub):
   - Each console: header title/description resolves from industry pack, tabs render correctly per vertical, empty states use `IndustryEmptyState`, agent metrics derive from real events.
   - Operative Hub Core/Advanced split, bulk activation, collapse limits.
   - Specialist Operatives availability across all plans.
6. **Dashboards**:
   - `CompanyAdminDashboard` Simple/Pro toggle, top-5 KPI vs full grid.
   - Aura Command Center hero — natural text vs metrics balance.
   - Technician dashboard, dispatch dashboard, customer portal home.
   - Subscription progress bar math `(60 - daysRemaining)/60`.
7. **Help, guides, walkthroughs, tutorials**:
   - `Help.tsx`, `AIAgentGuide.tsx`, `AIHelpCenter.tsx`, `PlatformGuides.tsx`, `howToUseContent.ts`, `industryHelpContent.ts`, `industryHelpPrompts.ts`.
   - Cross-check: do steps match current UI? Are all 18 industries covered? Does healthcare avoid HVAC fallback copy?
   - Tutorial v2 persistence (no re-trigger on revisit).
   - Step-by-step guides match actual route paths.
8. **CSS / layout / theme**:
   - Hex/rgba audit — separate company-brand-color usage (allowed) from theme violations.
   - Internal scrollbar inventory (only chat `max-h-[60vh]` allowed).
   - Cyber-Sentry token compliance (no raw `text-white`, `bg-black`).
   - Mobile viewport sanity at 320/375/414 and tablet/desktop snap sizes.
   - Floating nav redundancy, sidebar canonical 8-group structure.
9. **Marketing / landing / public pages**:
   - Pricing table accuracy vs canonical 4-tier model.
   - Hero copy, feature claims (console count, agent count).
   - Free Audit page (intentionally public) lead-gen flow.
   - SEO meta per route, JSON-LD presence.
10. **Edge function & API hygiene**:
    - All 86 functions: confirm `verify_jwt` flags align with internal-vs-public, subscription checks return 200/`subscribed:false` not 401, E.164 phone normalization, Tavily/Resend guards active.
    - Confirm strict `auraintercept.ai` origin usage (not Lovable preview).

## Methodology

For each area:
- `rg`-based static sweeps with structured queries (tier names, agent IDs, hardcoded strings, hex, scrollbar classes, route paths).
- Spot-read 3–5 representative files per area; do not re-read what's already in context.
- Cross-reference against the relevant `mem://` standard and cite the rule the finding violates.
- Severity tagging: **P0** = broken/security/data loss · **P1** = naming/handoff/standard violation visible to users · **P2** = cosmetic/CSS drift · **P3** = nice-to-have polish.

## Deliverables

1. **`/mnt/documents/platform-audit-2026-05-16.md`** — sectioned report with:
   - Executive summary (counts by severity per area).
   - One subsection per audit area above.
   - Each finding: severity badge, file path + line, observed behavior, expected behavior (with `mem://` citation), suggested fix size (S/M/L).
   - Appendix: raw scan output tables.
2. **`/dashboard/audit-report`** page (platform_admin only, gated like other power-user pages per `mem://features/dashboard/power-user-pages-restricted-v1`):
   - Filter chips by severity and by area.
   - Cards with the same finding metadata; clickable links open routes in a new tab.
   - "Download .md" button serving the report file.
   - Read-only — no mutate actions.

## Technical details

- Page lives at `src/pages/AuditReport.tsx`, registered in `App.tsx` behind the existing platform-admin route guard.
- Findings rendered from a typed `auditFindings.ts` constant generated alongside the markdown so the two stay in lockstep.
- No DB schema, no edge functions, no migrations.
- No edits to source-of-truth files (consoles, agents, settings) — fixes happen in a follow-up pass after you triage.

## Out of scope (explicit)

- Running fixes (per your "read-only report" choice).
- Performance profiling, Lighthouse re-runs.
- Re-architecting flows; only flagging discrepancies.
- Editing memory standards.

## What you get to decide after

Once the report lands, you pick which findings to convert into a fix sprint. I'll then propose a batched fix plan (likely sliced by area).
