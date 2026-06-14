## Goal
When the customer talks to any AI agent (chat, voice call, SMS), everything they say — intent, items discussed, address, notes, quoted prices — must survive every handoff and auto-prefill the next agent's quote, invoice, appointment, or follow-up. Today the orchestrator already tracks `ai_agent_context.context_data` + `handoff_history`, but call/chat/SMS logs aren't merged in, and `BusinessQuoteForm` / `InvoiceForm` ignore that context entirely.

## What we'll build

### 1. Unified customer interaction history (backend)
- Add SECURITY DEFINER RPC `get_customer_interaction_history(p_company_id, p_email, p_phone, p_limit)` that returns a single timeline merging:
  - `ai_agent_context` (context_data, active_agent, handoff_history)
  - `ai_agent_logs` (per-agent actions, input/output)
  - `call_logs` (transcript, summary, recording_url)
  - `sms_logs`
  - `site_chat_logs`
  - latest `appointments.intake_data`
- Returns normalized rows: `{ kind, when, agent, summary, payload, context_id }`.
- Grants: `authenticated` + `service_role`. Scoped via `get_user_company_id` / dispatch access.

### 2. Stronger handoff payloads (orchestrator)
File: `supabase/functions/ai-orchestrator/index.ts`
- In `handleHandoff`, hydrate `context_data` before writing by pulling the most recent `call_logs.transcript`/`summary`, `site_chat_logs`, and `sms_logs` matching the context's `customer_email`/`customer_phone`, and merging them into `context_data.history` (capped to last N entries).
- Add `context_data.last_quote_request`, `context_data.last_invoice_request`, `context_data.items_discussed[]`, `context_data.address`, `context_data.preferred_datetime`, populated by the source agent (filled by `ai-agent-chat` and `voice-handler` on each turn — see step 3).
- Persist `handoff_history` entries with `summary` + `carried_keys` so downstream agents see "what's already known".

### 3. Producers write structured context every turn
Touch:
- `supabase/functions/ai-agent-chat/index.ts`
- `supabase/functions/voice-handler/index.ts`
- `supabase/functions/elevenlabs-post-call/index.ts`
- `supabase/functions/widget-api/index.ts` (chat widget)
- SMS inbound handler (existing keyword/auto-responder path)

Each writes/updates `ai_agent_context` keyed on `(company_id, customer_email|customer_phone)`:
- Append turn to `context_data.transcript[]`
- Detect intent (quote / invoice / booking / follow-up) and set `context_data.last_intent`
- Extract address, requested service, line items via the model's tool-call output and persist into `context_data.items_discussed`

### 4. Quote & Invoice forms read context
Files: `src/components/billing/forms/BusinessQuoteForm.tsx`, `InvoiceForm.tsx`, `src/components/ai/QuoteForm.tsx`
- New optional props: `contextId?: string`, `customerEmail?`, `customerPhone?`.
- New hook `useCustomerInteractionHistory({ email, phone })` calls the RPC above.
- On mount, when context/customer is provided:
  - Prefill name/email/phone/address from `ai_agent_context` or latest appointment.
  - Prefill `line_items` from `context_data.items_discussed` (falling back to industry pack template as today).
  - Prefill `notes` with a short auto-summary: "From AI Receptionist call on Jun 12 — customer asked about …".
  - Render a collapsible "Conversation context" panel showing the last call transcript snippet, last chat turns, and last SMS. Read-only.
- Store `source_context_id` on the created quote/invoice so we can trace back.

### 5. Schema additions
Migration:
- `ALTER TABLE quotes ADD COLUMN source_context_id uuid REFERENCES ai_agent_context(id) ON DELETE SET NULL;`
- `ALTER TABLE invoices ADD COLUMN source_context_id uuid REFERENCES ai_agent_context(id) ON DELETE SET NULL;`
- `ALTER TABLE call_logs ADD COLUMN context_id uuid REFERENCES ai_agent_context(id) ON DELETE SET NULL;` (so calls join the timeline cleanly)
- Indexes on the new FK columns.
- No new tables, no new policies (RLS inherits via existing company-scoped policies; new columns are nullable).

### 6. Console surfacing
- In `BusinessOpsAgentConsole`, `BillingAgentConsole`, and `FieldOpsAgentConsole`: when the agent opens Quote/Invoice forms from a chat thread, pass the active `contextId` automatically.
- In `BookingAgentConsole`: same — booking confirmation writes `items_discussed` back into context for the next agent.

### 7. Tests
- Extend `src/hooks/useAIAgentOrchestrator.test.ts` with a handoff scenario asserting `context_data.transcript` + `items_discussed` survive a two-step handoff.
- New Deno test for the RPC: seed a chat + call + sms for one customer, expect a merged timeline.

## Out of scope
- Changing tier/agent gating, pricing, onboarding flows.
- Rewriting the chat or call UIs themselves.
- Cross-company sharing (still strictly scoped by `company_id`).
- Embeddings / semantic recall — straight chronological merge only.

## Risk notes
- Transcript bloat in `context_data`: cap at 50 most-recent turns; older turns stay in `call_logs`/`site_chat_logs`.
- Backfill: existing rows have no `source_context_id`; that's fine, the column is nullable.
