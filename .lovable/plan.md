

# Aura Intercept — Remaining Phases Plan

## Current Status
**Phase 1 (Aura Command Center)** — Complete. Both Platform Admin and Company Admin dashboards lead with the hero command input, suggested cards, and AuraLiveStream feed. Existing metrics are in collapsible "Business/Platform Snapshot" sections.

---

## Phase 2: Fast Start Wizard (Streamlined Onboarding)

**Goal:** Replace the current 9-section, ~1192-line `CompanyOnboardingForm` with a shorter, template-driven wizard that gets users to value in 5-7 minutes.

### 2A — Business Type Templates
- New file: `src/components/onboarding/BusinessTypeSelector.tsx`
- Full-screen step 1: Pick your trade — HVAC, Plumbing, Electrical, General Contractor, Landscaping, Other
- Each template pre-fills: recommended services, default business hours, and which 4 core agents to enable (Triage, Customer Journey, Dispatch, Business Finance)

### 2B — Fast Start Wizard Component
- New file: `src/components/onboarding/FastStartWizard.tsx`
- 4 streamlined steps (vs current 9 sections):
  1. **Business Type + Basics** — name, phone, address, template selection
  2. **Connect Integrations** — calendar + Stripe (simplified from current 6-integration checklist)
  3. **Tell Aura About Your Business** — natural language textarea or template auto-fill: "We're a 5-person HVAC company in Dallas serving residential customers..."
  4. **Review & Launch** — summary card showing what's enabled, "Launch My AI Team" button
- Progress bar with step labels at top

### 2C — Post-Setup Redirect
- After wizard completion, redirect to `/dashboard` with a one-time "Your AI team is ready!" toast/banner
- Auto-populate the Aura Command Center input with a sample command like "Book a service call for a new lead" that triggers a full workflow demo

### 2D — Integration with Existing Flow
- Add a "Fast Start (5 min)" vs "Full Setup" toggle at the top of the onboarding page
- Keep existing `CompanyOnboardingForm` accessible as "Full Setup" for users who want granular control
- Update `useOnboardingState` to track wizard completion path

**Files touched:** New wizard components (3 files), `src/pages/OnboardingForm.tsx`, `src/hooks/useOnboardingState.ts`, `src/components/dashboard/AuraCommandCenter.tsx` (welcome state)

---

## Phase 3: Reduce Complexity & Cognitive Load

### 3A — AI Operatives Hub: Core vs Advanced Sections
- Refactor the AI Operatives Hub page to split agents into two sections:
  - **Core Agents** (always visible): Triage, Customer Journey, Dispatch, Business Finance
  - **Advanced Agents** (collapsed by default): Outreach, Creative Content, Web Presence, Field Navigation, Analytics Intelligence, Admin
- Add "Enable Recommended for My Business" one-click button that activates all Core agents
- Add ROI hint badges on each agent card: "Saves ~10 hrs/week", "Handles 60-70% of first contacts"

### 3B — Console Icon Bar Tooltips
- Audit all console pages (`src/pages/ai-consoles/*.tsx`) for top icon/action bars
- Add `<Tooltip>` wrappers with descriptive labels to every icon-only button (project already uses `@/components/ui/tooltip`)
- Add small text labels below icons on wider viewports (hidden on mobile)

### 3C — Active Agents Panel Improvements
- Locate the Active Agents sidebar panel
- Collapse "Advanced" agents by default; show only Core agents expanded
- Add a subtle "Show all agents" toggle at the bottom

### 3D — Empty States Overhaul
- Audit all 28+ "No X found" empty states across components (quotes, invoices, leads, appointments, inventory, social content, jobs, etc.)
- Create a reusable `AuraEmptyState` component with:
  - Friendly illustration/icon
  - Actionable message (e.g., "No quotes yet — your first one is just a command away")
  - One-click AI action button ("Let Aura create your first quote")
  - The button pre-populates and submits a relevant Aura command
- Replace empty states in highest-traffic components first: QuotesManager, InvoicesManager, LeadsManager, SocialFeedQueue, AppointmentTrackingView, InventoryMatrix

**Files touched:** AI Operatives Hub page, ~7 console pages, ~10+ component files for empty states, 1 new `AuraEmptyState` component

---

## Phase 4: Console Improvements

### 4A — Workflow Chain Buttons
- Add "End-to-End Job Flow" buttons to Business Mgt Ops, Field Ops, and Dispatch views
- Each button triggers a multi-step Aura command that chains agents (e.g., Lead → Quote → Schedule → Dispatch)
- Implemented as pre-built command strings sent to `useUnifiedAura`

### 4B — Social Media: Prominent Multi-Channel Generator
- Redesign the Social Media Console layout to feature the Multi-Channel Generator as the hero section
- Add "Suggest content from recent jobs" button that queries recent completed jobs and generates social post ideas
- Surface this prominently above the feed queue

### 4C — Analytics: Natural Language First
- Refactor Analytics Console to lead with a natural language query input ("Ask about your business performance...")
- Move static chart dashboards into a secondary tab
- Reuse the same Aura input pattern from the Command Center for consistency

### 4D — Web Presence: Live Preview Pane
- Add a split-pane layout to the Web Presence console
- Left side: editing controls (existing)
- Right side: live iframe preview of the smart website that updates as changes are made

### 4E — Customer Portal Admin Preview
- Review and polish the existing Customer Portal console
- Ensure the live chat widget preview feels friendly with sample conversation bubbles

**Files touched:** 5-6 console page files, potentially new sub-components for workflow buttons and preview panes

---

## Phase 5: General Polish & Ease-of-Use

### 5A — Value Indicators
- Add subtle ROI/value badges throughout the platform:
  - Agent cards: "Saves ~10 hrs/week on scheduling"
  - Console headers: "This handles 60-70% of first contacts automatically"
  - Dashboard snapshot: "Aura handled X tasks this week, saving ~Y hours"
- Create a `ValueBadge` component for consistent styling

### 5B — Human Override UX
- Audit all agent action outputs for override controls
- Ensure every automated action (dispatch assignment, quote generation, social post, invoice chase) has a visible "Edit before sending" / "Override" / "Cancel" button
- Add a brief "Aura suggests..." prefix to agent outputs to clarify they're recommendations

### 5C — Mobile Technician Mode
- Refactor `EmployeeDashboard` / technician views for a mobile-first layout
- Large touch-friendly buttons for: Dispatch, Route, ETA, Check-In, Voice Input
- Minimal chrome — hide sidebar, use bottom navigation
- Ensure voice input button is prominent and always visible
- Optimize for the existing `TechnicianDashboardLayout`

### 5D — Theme Cleanup
- Audit remaining hardcoded `rgba(4,12,26,...)` and `rgba(0,229,255,...)` values across the codebase
- Replace all with theme tokens (`bg-card`, `text-primary`, `border-border`, etc.)
- Ensure dark theme with cyan/teal accents remains consistent and high-contrast

**Files touched:** Multiple component files across the app, new `ValueBadge` component, technician dashboard refactor, theme token audit

---

## Recommended Execution Order

| Priority | Phase | Estimated Messages | Impact |
|----------|-------|--------------------|--------|
| 1 | 3D — Empty States | 8-12 | Immediate UX improvement for new users |
| 2 | 2B — Fast Start Wizard | 10-15 | Faster time-to-value |
| 3 | 3A — Core vs Advanced Agents | 5-8 | Reduces overwhelm |
| 4 | 4C — NL Analytics | 5-8 | Reinforces Aura-first pattern |
| 5 | 4A — Workflow Chains | 5-8 | Power-user value |
| 6 | 5C — Mobile Technician | 8-12 | Field worker adoption |
| 7 | 3B — Tooltips | 3-5 | Low-effort polish |
| 8 | 5A — Value Indicators | 5-8 | Conversion/retention |
| 9 | 4B — Social Hero | 3-5 | Console improvement |
| 10 | 4D — Web Preview | 5-8 | Visual editing |
| 11 | 5D — Theme Cleanup | 3-5 | Consistency |
| 12 | 5B — Human Override | 5-8 | Trust/safety |
| 13 | 2A/2C/2D — Templates + Redirect | 5-8 | Onboarding completion |
| 14 | 3C — Agent Panel | 3-5 | Polish |
| 15 | 4E — Customer Portal | 2-4 | Minor polish |

**Total estimated: ~75-120 build messages across all phases**

---

## Technical Notes

- All changes are frontend-only — no database migrations needed
- Existing hooks (`useUnifiedAura`, `useVoice`, `useLaunchProgress`) are reused throughout
- The reusable `AuraEmptyState` component (Phase 3D) will be referenced by Phases 4 and 5
- The Fast Start Wizard (Phase 2) depends on no other phase and can be built independently
- Theme cleanup (5D) should happen last to avoid conflicts with other UI changes

