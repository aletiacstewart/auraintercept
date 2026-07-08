
## Goal
Extend the same "always capture visitor contact info as a lead" behavior that already exists on the Aura Intercept marketing site to every subscribed company's own AI receptionist — both text (embedded chat widget) and voice (ElevenLabs per-company agent) — so any visitor who chats or speaks with a company's Aura ends up as a lead **under that company's account**.

## Current state
- **Per-company text chat** (`chat-widget` → `widget-api?action=chat`): streams AI replies scoped to `company.id`, can `book_appointment`, but **never inserts into `leads`**. Contact info the visitor shares in chat is lost unless they complete a booking.
- **Per-company voice chat** (ElevenLabs agent → `elevenlabs-post-call`): already resolves `company_id` via `tenant_integrations.elevenlabs_agent_id` and inserts a lead when `data_collection_results` contains a name or phone. Transcript regex fallback exists **only for Aura Intercept** today.
- **Marketing site** (`landing-chat`, `landing-capture-lead`, voice fallback) already uses the shared `_shared/insert-landing-lead.ts` helper and captures leads under Aura Intercept — this is the pattern we mirror.

## Changes

### 1. Generalize the shared lead helper
Rename/refactor `supabase/functions/_shared/insert-landing-lead.ts` into a company-agnostic helper `insertReceptionistLead({ company_id, name, email, phone, source, notes, industry, metadata })`. Keep the existing `AURA_INTERCEPT_COMPANY_ID` export and a thin `insertAuraInterceptLead()` wrapper so `landing-chat`, `landing-capture-lead`, and the Aura Intercept voice fallback keep working unchanged. Dedupe logic (24 h on email or phone digits, scoped to the passed `company_id`), `priority: high`, `score: 75`, and channel inference stay identical — only the hard-coded company id becomes a parameter.

### 2. Per-company text chat — proactive capture in `widget-api`
In `supabase/functions/widget-api/index.ts`, `action === 'chat'` branch:
- Inject a small system-prompt addendum for every company chat that instructs Aura to naturally ask for the visitor's **name, best email, and mobile number** within the first 2–3 turns, and to keep going even if the visitor doesn't want to book. This is added on top of the existing agent-specific instructions (booking/quote/dispatch/etc.), not in place of them.
- After the stream completes (both the tool-call and no-tool-call branches), run a **fire-and-forget safety net**:
  - Concatenate the user turns from `messages`.
  - Regex-scan for email + phone using the existing `extractContact()` helper.
  - If any contact found, call `insertReceptionistLead({ company_id: company.id, source: 'chat_widget', notes: <last assistant reply, trimmed>, ... })`.
- No change to the streamed response body or client contract.

### 3. Per-company voice chat — extend the transcript fallback to all companies
In `supabase/functions/elevenlabs-post-call/index.ts`, remove the `if (companyId === AURA_INTERCEPT_COMPANY_ID)` guard around the transcript regex fallback so **every** company benefits: if `data_collection_results` came back empty but the transcript contains an email or phone, insert a lead under that company via `insertReceptionistLead({ company_id: companyId, source: 'voice_post_call', ... })`. The existing `data_collection_results`-based lead insert (which already runs for all companies) is unchanged.

### 4. ElevenLabs agent config (owner action, documented in the reply)
The per-company voice agents each have their own ElevenLabs configuration. In the response I will list the exact **Data Collection variables** (`customer_name`, `customer_email`, `customer_phone`) and the **system-prompt line** ("Early in every call, ask for the caller's name, best email, and mobile number and confirm them back.") that the owner should add to each company's ElevenLabs agent so the primary capture path (not just the transcript fallback) works reliably. No code writes into ElevenLabs from our side.

## Technical details
- Dedupe stays scoped to `(company_id, email OR phone)` within 24 h — so Company A's leads never collide with Company B's or with Aura Intercept's.
- Source tags: `chat_widget` (per-company text), `voice_post_call` (per-company voice fallback), `ai_receptionist` (per-company voice primary — already in place). Marketing-site sources (`message_aura_website`, `talk_to_aura_website`, `voice_post_call` under Aura Intercept's company id) are unchanged.
- Rate limiting on `widget-api?action=chat` already exists; no new limits needed since the safety-net insert is fire-and-forget after a successful chat call.
- No schema, RLS, or new tables required — `leads` already accepts inserts from edge functions (service role) and is filtered per company throughout the app.

## Out of scope
- No UI changes to the chat widget itself.
- No changes to the marketing-site Aura Intercept flow (that behavior is already live).
- No new consent screen — existing widget disclosure covers this; if the user wants an explicit consent line added to the widget UI, that would be a follow-up.
