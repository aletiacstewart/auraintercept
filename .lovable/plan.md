
## 1. Rename "Dispatch Agent" → "Dispatch/GPS Console"

This is a display/label change only — the internal agent ID stays `dispatch` (no DB or routing changes). Everywhere the user-facing string `"Dispatch Agent"` appears, replace with `"Dispatch/GPS Console"`.

Files to update (display strings only):
- `src/lib/agentStyles.ts` and `src/lib/subscriptionAgentConfig.ts` — agent label map
- `src/hooks/useAIAgentOrchestrator.ts`, `src/hooks/useRolePermissions.ts` — agent registry name fields
- `src/pages/Subscription.tsx`, `src/pages/AIAgentsHub.tsx`, `src/pages/AIAgentGuide.tsx`, `src/pages/AgentDetailPage.tsx`, `src/pages/VideoPromptsPage.tsx`, `src/pages/PlatformGuides.tsx`, `src/pages/DesignPreview.tsx`
- `src/components/agents/TierComparisonCards.tsx`, `AgentRequirementCalculator.tsx`, `AgentDependencyDiagram.tsx`, `ConsoleRequirementsDiagram.tsx`
- `src/components/landing/PricingComparisonTable.tsx`
- `src/components/audit/RoleMappingSection.tsx`
- `src/components/aura/AuraEventCard.tsx`
- `src/components/ai/AIAgentTestSuite.tsx`, `src/components/ai/chat/AgentHowToGuide.tsx`
- `src/components/documentation/*.tsx` — PDF docs (PlatformDocumentPDF, PlatformFAQPDF, AIAgentGuidesPDF, ComprehensiveGuidesPDF, BrandAssetGuidePDF, VideoScriptsPDF, WebsiteCopyPDF, PricingSummaryPDF)
- `supabase/functions/ai-orchestrator/index.ts`, `supabase/functions/widget-api/index.ts` (display-only `name` fields, never the `dispatch` key)

Note: `Dispatch Console` (already used in `FieldOpsInstall.tsx`, `DispatchFieldOpsApp.tsx`, `DispatchFieldOpsAppCard.tsx`) becomes `Dispatch/GPS Console` for consistency.

## 2. Rename "Service Delivery" → "Service Management"

Replace every occurrence of the literal `"Service Delivery"`:
- `src/lib/industryAgentMap.ts` — consoleTitle / workerConsoleTitle / consoleSubtitle / workerLayoutTitle / welcomeTitle for all verticals (HVAC, Plumbing, Electrical, generic field-routing)
- `src/pages/technician/TechnicianAIConsole.tsx` — fallback title
- `src/pages/Index.tsx` — landing copy (3 spots: card name, console name, subtitle rotator, comparison line)
- `src/components/landing/PricingComparisonTable.tsx` — feature row + tooltip

## 3. Super Admin Hub button on every demo page

Current `SwitcherPill` is rendered as a `sticky top-0` banner at the App root. On dashboards with their own fixed/sticky header (CompanyAdminDashboard, technician layout, customer portal), the sticky banner sits above the route content but can scroll out of view or be visually covered by app chrome.

Fix: convert the "Super Admin Hub" exit button into a **fixed floating button** anchored to the top-right of the viewport (`fixed top-2 right-2 z-[70]`), always visible while `isSuperSwitcherActive()` is true — independent of any page's own layout. Keep the role-switch chips in a compact pill anchored to top-left (`fixed top-2 left-2 z-[70]`), so neither relies on sticky parents.

- Edit `src/components/super-switcher/SwitcherPill.tsx`:
  - Replace the single sticky banner with two `fixed` containers:
    - Top-left: small pill with industry + role + role-switch buttons (collapsible on mobile)
    - Top-right: prominent "Super Admin Hub" button (always shown when active)
  - Use `pointer-events-auto` on the elements so the rest of the page stays interactive.
  - Keep `useEffect` listening to the `super-switcher:switching` event so the bar appears immediately after `enter()`.

No other files change for this fix.

## Verification

- After deploy, log in as super admin, enter a demo from `/super-switcher`. The "Super Admin Hub" button must be visible in the top-right corner on `/dashboard`, `/technician`, `/customer`, and any nested route.
- Search for "Dispatch Agent" and "Service Delivery" in the repo — should return zero results in user-facing strings.
- Spot-check Subscription, AIAgentsHub, PricingComparisonTable, and one PDF doc to confirm new labels render.
