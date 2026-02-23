
# Implement Real Agent Handoffs & Event Routing Connections

## What This Does
The AI Agent Demo shows the correct logical flow — but the actual backend (the two edge functions that power every real agent interaction) is missing many of those connections. This update synchronizes the backend with the demonstrated architecture.

## Two Files to Update

### 1. `supabase/functions/ai-orchestrator/index.ts`
This file contains `EVENT_ROUTING` — the table that automatically fans out events to downstream agents. When one agent fires an event (e.g., `job_complete`), the orchestrator reads this table to know which agents to notify.

**Missing routes to add:**

| Event | Currently Routes To | Add These Targets |
|---|---|---|
| `appointment_booked` | dispatch, route, followup | + `inventory` |
| `job_complete` | quoting, invoice, followup, inventory | + `campaign` |
| `payment_received` | followup, revenue | + `campaign` |
| `post_published` | social_analytics, performance | + `insights` |
| `lead_qualified` | campaign, booking | + `marketing` |
| `lead_scored` | campaign, marketing | + `booking` |
| `review_received` | performance, insights | + `campaign` |
| `inventory_low` | dispatch, quoting | + `admin` |
| **New event** `quote_approved` | (missing entirely) | `invoice`, `inventory` |
| **New event** `content_published` | (missing entirely) | `social_analytics`, `web_presence` |
| **New event** `invoice_paid` | (missing entirely) | `followup`, `revenue`, `campaign` |

---

### 2. `supabase/functions/ai-agent-chat/index.ts`
This file defines which agents each agent can hand off to (the `handoff_to_agent` tool enum), and which agents have that tool at all. Several agents are missing this tool entirely, making the demo connections impossible to execute.

**`handoff_to_agent` tool fixes:**

| Agent | Current Allowed Targets | Fix |
|---|---|---|
| `booking` | dispatch, quoting, triage | Add `followup` (booking → followup is the core post-job flow) |
| `invoice` | followup | Add `admin` (invoice reports feed admin oversight) |
| `route` | eta, dispatch | Add `checkin` (route plan informs check-in) |
| `social_analytics` | (no handoff tool) | Add tool with targets: `social_content`, `social_scheduler`, `insights` |
| `social_content` | (no handoff tool) | Add tool with targets: `social_scheduler`, `web_presence` |
| `inventory` | (no handoff tool) | Add tool with targets: `quoting`, `admin` (stock levels inform quoting; admin gets low-stock alerts) |
| `marketing` | (no handoff tool) | Add tool with targets: `campaign`, `lead` (marketing triggers campaigns and enriches lead segments) |
| `lead` | (no handoff tool) | Add tool with targets: `campaign`, `marketing`, `booking` (qualified leads route to campaign or directly to booking) |
| `campaign` | (no handoff tool) | Add tool with targets: `marketing`, `lead` (campaign results feed back to marketing and lead scoring) |
| `insights` | (no handoff tool) | Add tool with targets: `revenue`, `forecast`, `performance` (insights queries these for data) |
| `performance` | (no handoff tool) | Add tool with targets: `revenue`, `forecast` (performance feeds into revenue and forecast) |
| `revenue` | (no handoff tool) | Add tool with targets: `forecast`, `insights` |
| `forecast` | (no handoff tool) | Add tool with targets: `insights`, `performance` |
| `web_presence` | (no handoff tool) | Add tool with targets: `social_content` (published web content gets picked up by social) |

**System prompt updates (for agents gaining new handoff capabilities):**
- `booking` prompt: Add instruction — when appointment is created, use `handoff_to_agent(target_agent="followup")` to schedule follow-up after job completion
- `social_analytics` prompt: Add instruction — after analysis, use handoff to `social_content` to feed performance data back for improved content creation
- `inventory` prompt: Add instruction — when stock is low, use handoff to `quoting` so estimates reflect availability, and to `admin` for oversight
- `lead` prompt: Add instruction — when a lead is qualified/hot, use handoff to `booking` for direct scheduling, or to `campaign` for nurture sequences
- `marketing` prompt: Add instruction — after creating segments, use handoff to `campaign` to trigger targeted outreach

## Deployment
Both edge functions will be redeployed automatically after the changes are saved. No database migrations are needed — this is purely logic within the two edge function files.
