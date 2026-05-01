## Why you don't see the Specialist Operatives anywhere

Right now the four Specialist Operatives (Diagnostic, Permit & Code, Site Survey & Quote, Insurance Claim) only exist in three places:

1. **AI Operatives Hub** — they appear as cards in a "Specialist Operatives" section (toggle on/off only).
2. **Subscription/Pricing page** — listed as a Pro/Elite feature.
3. **`ai-agent-chat` edge function** — the backend has a system prompt for each one, so they *can* respond if called.

But there is **no entry point in any console** (Customer Portal, Field Ops, Technician, Business Mgmt) that actually opens a chat with a specialist. So no company admin, employee, technician, or customer has a way to use them. That's why they feel invisible.

## What this plan adds

### 1. Specialist quick-launch in the right consoles

Add a "Specialist Operatives" launcher row to the consoles where each specialist naturally belongs. Each launcher opens an AI chat preset to that specialist's `agent_type`.

| Specialist | Console where it appears | Used by |
|---|---|---|
| Diagnostic | Customer Portal Console + Technician Console | Customer (pre-visit triage), Technician (on-site) |
| Permit & Code | Field Ops Console + Technician Console | Dispatcher, Technician |
| Site Survey & Quote | Field Ops Console + Customer Portal Console | Sales/Estimator, Customer (self-survey) |
| Insurance Claim | Customer Portal Console + Business Mgmt Console | Customer (claim docs), Admin (claim review) |

Cards show:
- Lock badge if tier < Pro
- "Industry" badge (greyed) if the company's industry pack doesn't activate it
- Click → opens `AIAgentChat` with that `agentType`

### 2. Dedicated "Specialist Operatives Console" page

New route `/dashboard/ai-consoles/specialists` that:
- Lists the four specialists as tabs (Diagnostic / Permit & Code / Site Survey / Insurance Claim)
- Each tab embeds the existing `AIAgentChat` component with the matching `agent_type`
- Includes a sidebar with use-case examples for each specialist
- Linked from: AI Operatives Hub specialist section ("Open Console" button) + main sidebar (under AI Consoles)

### 3. Customer-facing widget exposure

In the embedded customer chat widget (`/widget`), expose Diagnostic + Site Survey + Insurance Claim as quick-action buttons in the welcome screen when the company's industry pack opts them in. Customers tap → AI starts a structured intake (photos, symptoms, etc.).

### 4. Technician mobile app exposure

In `TechnicianAIConsole`, add Diagnostic + Permit & Code as quick-launch chips above the chat input. Lets a tech in the field instantly ask "what permit do I need for this?" or "what's wrong with this unit?".

### 5. Routing wiring

- Update `src/components/ai/AIAgentChat.tsx` (or wrapping logic) to accept and route specialist `agent_type` values directly — currently the consoles only call known operatives.
- Make sure `ai-agent-chat` edge function honors the specialist `agent_type` from the client (it already has prompts; just confirm the `TIER_AGENTS` map allows them for Pro/Elite + admin override path).
- Add the four specialists to the orchestrator's default-active list **for platform admins only** (already partially done in prior work) so you can test them now from your admin dashboard.

### 6. Sidebar entry

Add "Specialist Operatives" link under the AI Consoles group in the dashboard sidebar (visible to Pro/Elite + platform admin), pointing at the new `/dashboard/ai-consoles/specialists` route.

## Files to touch

- `src/pages/ai-consoles/SpecialistOperativesConsole.tsx` (new)
- `src/App.tsx` — register new route
- `src/components/dashboard/sidebar/*` — add nav link
- `src/pages/ai-consoles/CustomerPortalConsole.tsx` — add specialist launcher row
- `src/pages/ai-consoles/FieldOpsConsole.tsx` — add specialist launcher row
- `src/pages/ai-consoles/BusinessManagementConsole.tsx` — add Insurance Claim launcher
- `src/pages/technician/TechnicianAIConsole.tsx` — add Diagnostic + Permit chips
- `src/components/widget/*` welcome screen — add customer-facing quick actions
- `src/components/ai/AIAgentChat.tsx` — accept specialist agent types
- `src/pages/AIAgentsHub.tsx` — add "Open Console" button on specialist cards
- `supabase/functions/ai-agent-chat/index.ts` — verify specialist routing path (no DB migration needed)

## Out of scope

- No database schema changes; specialists already exist in code/edge logic.
- No pricing changes; tier gating already gates them to Pro/Elite.
- No new edge functions.

Approve and I'll implement.