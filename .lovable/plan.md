

# Rebuild All Documentation & Resource Pages

This is a comprehensive rebuild of 7 dashboard pages and 13 PDF components to align with the current 4-tier platform model (Core/Boost/Pro/Elite), 24 Smart AI Agents (10 consolidated operatives), 7 consoles + AI Operatives Hub, and current 3rd-party integration requirements.

## Key Inconsistencies Found

- **helpContentConfig.ts** uses old internal tier IDs (`connect`, `performance`) and wrong tier assignments (e.g., Field Ops set to `performance` instead of Boost-level, Customer Portal set to `connect` instead of Core-level)
- **DemoAccounts.tsx** references "Twilio" instead of "SignalWire", has stale email patterns, mentions "Predictive Analytics" in Elite features
- **PlatformGuides.tsx** has 1,667 lines of hardcoded guide content that may reference outdated agent names, counts, and tier structures
- **Architecture.tsx** diagrams reference old module names and miss current consoles
- **VideoPromptsPage.tsx** references 7 consoles but may have outdated agent names
- **ExportDocumentation.tsx** links to 13 PDF generators, all potentially out of date
- **Help.tsx** renders tier-filtered content from the stale `helpContentConfig.ts`
- **All 13 PDF components** (~13,000 lines total) contain hardcoded content that needs auditing

## Implementation Plan

Given the enormous scope (~18,000+ lines across 20+ files), this will be executed in batches:

### Batch 1: Config Sources (foundation — must be done first)
1. **`src/lib/helpContentConfig.ts`** — Fix all tier IDs to match `subscriptionAgentConfig.ts` internal names (`starter`/`connect`/`performance`/`command`). Fix console `requiredTier` assignments: Customer Portal → `starter`, Field Ops → `connect`, Social Media → `connect`, Business Management → `command`, Analytics → `command`. Update agent names to match consolidated operative model. Fix integration references (Twilio → SignalWire).

2. **`src/lib/documentationConfig.ts`** — Already mostly correct. Minor fixes: remove "Predictive AI Hub" from Elite description (line 118/130), verify Social Media console tier is `aura_boost` not `aura_core`.

### Batch 2: Dashboard Pages
3. **`src/pages/Help.tsx`** — Rebuild to pull from corrected `helpContentConfig.ts`. Structure: AI Agents tab (console-filtered agents), Ask Aura tab, Company & Employees tab, FAQs tab. Ensure tier-based filtering works with corrected tier IDs.

4. **`src/pages/PlatformGuides.tsx`** — Full rewrite of guide content to reflect current platform: 4-tier model, correct agent names (10 operatives / 24 agents), correct console names and routes, current integration requirements (SignalWire not Twilio, Stripe for Elite only, etc.).

5. **`src/pages/DemoAccounts.tsx`** — Update demo account data: fix tier features (remove "Predictive Analytics"), fix integration references (Twilio → SignalWire), update agent counts per tier (8/12/16/24), update console counts (3/5/5/7), ensure email patterns match actual demo accounts.

6. **`src/pages/Architecture.tsx`** — Rebuild Mermaid diagrams to reflect current platform: add all 7 consoles + AI Operatives Hub, show correct module routes, update edge functions list, add Content Engine and Social Media console flows.

7. **`src/pages/AIAgentFlowDemo.tsx`** — Update scene data to use correct 24-agent names across 10 operative groups. Ensure agent node labels and connection narratives match current platform.

8. **`src/pages/VideoPromptsPage.tsx`** — Audit all 34 clip prompts for outdated agent names or console references. Update to match current terminology (Social Feed Queue, not Social Scheduler, etc.).

9. **`src/pages/ExportDocumentation.tsx`** — Update card descriptions and metadata to match current platform stats. Ensure all PDF download links work.

### Batch 3: PDF Components (13 files, ~13,000 lines)
10. **`AIAgentGuidesPDF.tsx`** — Rebuild with correct 24 agents, 10 operatives, 7 consoles, 4-tier access matrix.
11. **`PlatformDocumentPDF.tsx`** — Update platform overview, pricing, features.
12. **`PricingSummaryPDF.tsx`** — Update to 4-tier pricing with annual billing options.
13. **`ComprehensiveGuidesPDF.tsx`** — Full rebuild with current guide content.
14. **`CompanyGuidesPDF.tsx`** — Update onboarding and setup guides.
15. **`CompanyOnboardingPDF.tsx`** — Update onboarding steps to current flow.
16. **`SocialMediaContentPackPDF.tsx`** — Update platform references.
17. **`VideoScriptsPDF.tsx`** — Align with updated VideoPromptsPage content.
18. **`SalesPitchDataPDF.tsx`** — Update sales data and competitive positioning.
19. **`BrandAssetGuidePDF.tsx`** — Update brand guidelines.
20. **`WebsiteCopyPDF.tsx`** — Update website copy to current messaging.
21. **`IndustryMarketingKitPDF.tsx`** — Update industry-specific content.
22. **`PlatformFAQPDF.tsx`** — Rebuild FAQ content to match current platform.

### Batch 4: Navigation & Access Control
23. **`src/components/dashboard/DashboardLayout.tsx`** — Verify `Platform Resources` nav group has correct role-based access for all 7 items. Currently all items except Help are platform_admin only; consider making Help and AI Agent Demo visible to company_admin and employee roles as appropriate.

## Guiding Principles
- All content pulls from `documentationConfig.ts` and `subscriptionAgentConfig.ts` wherever possible (single source of truth)
- Agent distribution: 8 (Core) / 12 (Boost) / 16 (Pro) / 24 (Elite)
- Console distribution: 3 / 5 / 5 / 7 + AI Operatives Hub (all tiers)
- Integration requirements: SignalWire (not Twilio), Stripe (Elite only), Social Media (Pro+), Google Calendar (all tiers), Tavily (optional all)
- No references to "Predictive AI Hub" anywhere
- Internal tier IDs: `starter` = Core, `connect` = Boost, `performance` = Pro, `command` = Elite

## Estimated Scope
~18,000 lines across 22 files. This will require multiple implementation rounds.

