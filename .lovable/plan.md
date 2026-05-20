# Platform Resources Consistency Audit

## Goal
Audit every export doc, video script, and platform guide under **Platform Resources** (`/dashboard/export-docs`) against the live platform — AI operatives, consoles, hubs, dashboards, homepage, and sign-up flow — then fix any drift in a single pass.

## Sources of Truth
- **Pricing/tiers** — `src/lib/subscriptionAgentConfig.ts` + `src/lib/documentationConfig.ts` + memory `marketing/pricing/canonical-four-tier-model`.
- **Trial** — memory `product/trial-period-standard`: 90-Day Live Trial = first 30d onboarding + 60d live.
- **Operatives (10)** — `src/lib/subscriptionAgentConfig.ts`, `src/lib/agentStyles.ts`, memory `features/dashboard/plain-english-labels-v1`.
- **Consoles (7) + AI Hub** — `src/pages/ai-consoles/*`, memory `architecture/navigation/console-route-standardization`.
- **Dashboards** — `Dashboard.tsx`, `CompanyAdminDashboard`, `TechnicianDashboard`, `CustomerPortalHome`.
- **3rd-party policy** — memory `integrations/3rd-party-requirements-standard` + `legal/third-party-fee-disclaimer`.
- **Public surfaces** — homepage components in `src/components/landing/`, `Auth.tsx`, `Contact.tsx`, `About.tsx`, `ForBusiness.tsx`.

## Known Conflict To Resolve First
Memory core says **Core $497 / Boost $697 / Pro $1,197 / Elite $2,197** (monthly = onboarding).
File `marketing/pricing/canonical-four-tier-model.md` still shows **Core $197 / Boost $497 / Pro $997 / Elite $1,997** with separate onboarding.
Treat the **core memory** as authoritative; reconcile the standalone file and `documentationConfig.ts` as part of the fix.

## Artifacts In Scope
Under `src/components/documentation/`:
1. MarketingSalesMasterPDF
2. AIAgentGuidesPDF
3. PlatformDocumentPDF
4. PricingSummaryPDF
5. ComprehensiveGuidesPDF
6. CompanyGuidesPDF
7. CompanyOnboardingPDF
8. PlatformFAQPDF
9. SalesPitchDataPDF
10. WebsiteCopyPDF
11. BrandAssetGuidePDF
12. IndustryMarketingKitPDF
13. SocialMediaContentPackPDF
14. **VideoScriptsPDF** + promo-video toolkit prompts (`src/components/marketing/` / promo video data)

Plus the **Export Documentation page** card copy (`src/pages/ExportDocumentation.tsx`) and the **Marketing Sales Console** master-guide button.

## Audit Checklist (applied per artifact)
- **Tier names + pricing**: Core/Boost/Pro/Elite with $497/$697/$1,197/$2,197 monthly = onboarding. Flag Starter/Connect/Performance/Command or stale $197/$497/$997/$1,997.
- **Trial**: "90-Day Live Trial" with `(first 30 days = onboarding)` short form or full long-form sentence. Flag "Free Trial", "60-day", "14-day".
- **Operatives**: 10 operatives with plain-English labels in customer-facing copy. "24 agents" only where technically accurate (architecture docs).
- **Consoles**: 7 consoles + AI Operatives Hub (Elite). Flag "7 Control Centers" without Hub or wrong count.
- **3rd-party copy**: customer-owned account + billed separately by provider. Flag "bundled / overage / absorbed / included / we cover" language across SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Social.
- **URLs**: `https://auraintercept.ai` only; no `lovable.app` / preview URLs.
- **Brand**: "Aura Intercept", correct logo, Cyber-Sentry tone, theme tokens (no raw hex).
- **No multi-location**, **no CRM/Warranty** modules — use "Lead Capture & Scoring".
- **Cross-doc parity**: agent descriptions, tier inclusions, feature names, and trial copy match across every PDF + homepage + Auth + Contact + ForBusiness.

## Deliverable
1. **Audit report posted in chat** — one table per artifact: Finding · Severity (blocker / drift / nit) · Corrected wording.
2. **Code fixes in one pass** — edit only affected PDF/script/guide files plus Export Documentation card copy and `documentationConfig.ts` pricing constants. No business logic, schema, routes, or new features.
3. **Visual QA** — render any PDF whose layout was touched (skill/pdf guidance) and inspect each page before delivery.
4. **Memory reconciliation** — update `marketing/pricing/canonical-four-tier-model.md` to match the core memory pricing.

## Out of Scope
- Pricing math redesign, new tiers, new features.
- Backend / edge functions.
- Spanish locale, unless a string is a direct mirror of an English fix.

## Execution Order
1. Read all 14 PDFs + video scripts + ExportDocumentation + homepage/Auth/Contact/ForBusiness.
2. Build finding table.
3. Apply fixes (parallel writes where independent).
4. Visual QA on layout-affected PDFs.
5. Post final report + summary of changes.
