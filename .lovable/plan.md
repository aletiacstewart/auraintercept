

# Phase 4E (Customer Portal Admin Preview) + Phase 2A/2C (Templates DB + Post-Setup Redirect) + Batch 2 Empty States

## Phase 4E — Customer Portal Admin Preview Pane

**Goal**: Add a live widget preview alongside the admin chat so admins can see what customers experience.

**Changes**:
- **`CustomerPortalConsole.tsx`**: Add a "Preview" tab alongside "Customer View" and "Debug" — or add a split-pane toggle (like the Smart Website Manager pattern). When toggled, show the `WidgetPreview` iframe side-by-side with the existing `AIAgentConsole`.
- Reuse the existing `WidgetPreview` component (already fetches company slug and renders the `/chat/{slug}` iframe).
- Desktop only — on mobile viewports, hide the preview toggle.

---

## Phase 2A — Save Business Templates to DB

**Goal**: When the Fast Start wizard completes, persist the selected template's services and hours to the database.

**Changes**:
- **`FastStartWizard.tsx` → `handleLaunch`**: After updating the company record, insert the template's pre-loaded services into the `services` table (if it exists) using the template's `services` array. Also save the business type selection to the company record (e.g., an `industry` or `business_type` column, or store in `ai_agent_prompt`).

---

## Phase 2C — Post-Setup Redirect with Sample Command

**Goal**: After completing Fast Start, redirect to the dashboard with a contextual first command pre-filled.

**Changes**:
- **`FastStartWizard.tsx` → `handleLaunch`**: Navigate to `/dashboard` with a query param like `?firstCommand=true` or pass state via `navigate`.
- **Aura Command Center** (main dashboard): Detect the `firstCommand` param and auto-populate the chat input with a contextual starter like "Show me what you can do" or a template-specific prompt (e.g., "Create a sample HVAC maintenance quote").

---

## Batch 2 Empty States

**Goal**: Replace plain text/icon empty states in remaining components with the themed `AuraEmptyState` component.

**Components to update** (each is a small inline replacement):

| Component | File | Empty State Update |
|---|---|---|
| `CustomersManager` | `src/components/businessops/CustomersManager.tsx` | Replace `<Users>` div with `AuraEmptyState` |
| `ConversationHistoryBrowser` | `src/components/ai/agents/ConversationHistoryBrowser.tsx` | Replace `<MessageSquare>` div with `AuraEmptyState` |
| `CommunicationLogs` | `src/components/employee/CommunicationLogs.tsx` | Add `AuraEmptyState` for empty log list |
| `ReminderHistoryLog` | `src/components/company/ReminderHistoryLog.tsx` | Replace `<History>` div with `AuraEmptyState` |
| `DigestDeliveryHistory` | `src/components/company/DigestDeliveryHistory.tsx` | Add `AuraEmptyState` |
| `BillingLookupForm` | `src/components/billing/forms/BillingLookupForm.tsx` | Add `AuraEmptyState` for no results |
| `BillingAgentConsole` | `src/components/billing/BillingAgentConsole.tsx` | Add `AuraEmptyState` |
| `CustomerPreferencesManager` | `src/components/company/CustomerPreferencesManager.tsx` | Add `AuraEmptyState` |
| `BookingAgentConsole` | `src/components/booking/BookingAgentConsole.tsx` | Replace search no-results div |
| `PlatformAnalytics` | `src/components/analytics/PlatformAnalytics.tsx` | Add `AuraEmptyState` for empty chart data |
| `FinancialPulseDashboard` | `src/components/businessops/FinancialPulseDashboard.tsx` | Add `AuraEmptyState` |

Each follows the same pattern: import `AuraEmptyState`, replace the inline `<div>` with `<AuraEmptyState icon={X} title="..." description="..." />`, with optional `actionLabel`/`onAction` where appropriate.

---

## Technical Summary

- **Files created**: None
- **Files modified**: ~14 files total
- **No database migrations needed** (business type can be stored in existing `ai_agent_prompt` field)
- **No new dependencies**

