# Industry & Console Consistency Audit

Goal: make sure every surface (dashboards, consoles, AI operatives, "See more details", "How to use this page", step-by-step guides, exportable PDFs/docs, sidebars, homepage + signup industry pickers) reflects the current 28-pack industry registry, the 10-operative / 7-console model, and the active 4-tier Beta Pricing.

## Phase 1 — Inventory (read-only sweep)

1. Industry registry source of truth
   - Confirm canonical list in `src/lib/industryProfiles.ts`, `industryPackSchema.ts`, `industryIdAliases.ts`, `industry-template-pack-system` memory, `PackCoverage` admin page.
   - Diff against: `IndustryDropdownPicker`, `StartDemoDialog`, `ForBusiness` pricing/industry links, `Auth` signup `?industry=`, `industryRolePreview`, `industryHelpContent`, `industryEmptyStates`, `industryReportTemplates`, `industryAnalyticsPresets`, `industryQuickActions`, `industryKpiLabels`, `industryNavLabels`, `industryVoiceGreetings`, `industryPortalCopy`, `industryFastStartQuestions`.
   - Output: a missing-industries matrix per file.

2. Console / operative consistency
   - 7 consoles × 10 operatives — verify `profileConsoleMap`, `subscriptionAgentConfig`, `accessControl`, `useAIAgentOrchestrator`, `agentStyles`, sidebars (`AppSidebar`, technician sidebar, customer portal nav).
   - Confirm sidebar links match active routes after recent simplification (Sidebar Simplification v1, Power-User Pages Restricted v1).

3. Guides, How-to, See-more, PDFs
   - `src/lib/howToUseContent.ts` (centralized "How to Use") — check every console/tab has an entry and copy is current.
   - `src/lib/auditFindings.ts`, `AuditReport.tsx`, `OpportunityAudit.tsx`, `AuditChecklistPDF` — verify they reference current tiers, current industries, no stale operative names.
   - `ExportDocs` / `export-docs` page, `IntegrationDocs`, `AIAgentGuide`, `CompanyBlog` knowledge content — verify industry packs covered.
   - Any generated PDFs (Outreach Toolkit, Promo Video Toolkit, AuditChecklistPDF) — refresh pricing to Beta Pricing (Core $497 / Boost $994 / Pro $1,988 / Elite $3,979 with original strikethrough + onboarding fees).

4. Public marketing surfaces
   - `ForBusiness.tsx` industry dropdown + pricing tiles ✓ (already on Beta Pricing).
   - `Auth.tsx` signup — confirm industry selector lists all 28 packs and tier query param works for all 4 tiers.
   - Homepage hero/role preview — confirm `IndustryRolePreview` and `industryRolePreview` data cover all packs.
   - SEO: `sitemap.xml`, `llms.txt`, per-industry meta.

## Phase 2 — Build / Fixes (after approval)

Per file group, apply the smallest change that closes the gap:

- A. Industry registry gaps → add missing entries to each `industry*` map with sane defaults pulled from the pack (no new UI).
- B. Sidebar audit → remove dead links, add any missing console routes, ensure `platform_admin`-only items hidden for other roles; keep collapse behavior.
- C. Operative/console references → search-and-replace stale operative names (legacy 24-agent leftovers) with the 10-operative canonical names.
- D. `howToUseContent.ts` → add entries for any console/tab missing one; refresh examples that still mention old tiers or removed features (CRM, Warranty, Multi-Location).
- E. Guides & PDFs → update pricing constants + industry lists in `AuditChecklistPDF`, `OutreachToolkit`, `PromoVideoToolkit`, `ExportDocs`, `AIAgentGuide`, `IntegrationDocs`. Pull from a single source (`launchPricing.ts` + `industryProfiles.ts`) so future changes don't drift.
- F. Public industry pickers → ensure `IndustryDropdownPicker`, `StartDemoDialog`, signup `industry` select, and homepage role preview all read from the same canonical industry list.
- G. Per-industry signup deep links — verify `/auth?mode=company&tab=signup&tier={tier}&industry={id}` honors all 28 ids (no aliases breaking).

## Phase 3 — Verification

- `bunx vitest run` — all 69 tests (industry profile + console naming consistency tests already exist; extend if a gap is found).
- Spot-check via Playwright: load `/for-business`, switch 3 industries, open signup with `?industry=` and `?tier=`, open a console "How to use" modal, download AuditChecklistPDF.
- `preview_control--get_preview_health` end-of-turn.

## Out of scope

- New features, redesigns, copy rewrites beyond what's needed for accuracy.
- Changing pricing math or tier structure.
- Multi-location (explicitly excluded per memory).

## Clarifying questions before I start Phase 2

1. **Scope of "industries"** — should the audit treat all 28 packs as in-scope, or only the 18 "core" verticals from `industry-template-pack-system`?
2. **PDF refresh depth** — just update pricing + industry list, or also regenerate example screenshots/copy inside `AuditChecklistPDF` and the Outreach/Promo toolkits?
3. **Sidebar changes** — keep current Sidebar Simplification v1 (8 groups, install routes hidden) as-is, or are you open to me reordering groups if I find a clearer arrangement?
4. **Stale operative names** — if I find any UI still referencing legacy 24-agent names, replace silently with the 10-operative canonical, or list them for your review first?
