
## Goal
Every visitor who chats (Message Aura) or speaks (Talk to Aura) on the marketing site should have their name, email, and phone captured and saved as a lead under the Aura Intercept company (`auraintercept@gmail.com` → company `04c57cbe-…`).

## Current state (already in place)
- **Text chat** (`LandingAIChat` → `landing-chat` → `landing-capture-lead`): the AI can emit a `[[LEAD]]{…}[[/LEAD]]` marker, which the client posts to `landing-capture-lead`, which inserts into `leads` with `company_id = 04c57cbe-…` (Aura Intercept).
- **Voice chat** (`AuraAvatarChat` → ElevenLabs agent `agent_0501kh…` → `elevenlabs-post-call`): the webhook maps the agent to Aura Intercept's company and, when `data_collection_results` include name/phone, inserts a lead automatically.

Gaps: the text prompt only collects contact info if the visitor volunteers it or agrees to a call, and there is no server-side safety net if the model forgets the `[[LEAD]]` marker. The voice agent's data-collection variables live in the ElevenLabs dashboard and need to be confirmed.

## Changes

### 1. Message Aura (text) — proactive + guaranteed capture
- **Prompt (`supabase/functions/_shared/aura-intercept-sales-prompt.ts`)**: rewrite step 8 so Aura asks for name, email, and phone naturally within the first 2–3 turns for every visitor ("Before I dig in, who am I chatting with? Name, best email, and mobile so our team can follow up either way?"). Keep it friendly, one ask at a time if the visitor pushes back, and always emit `[[LEAD]]…[[/LEAD]]` as soon as any two of {name, email, phone} are known — not only on "book a call".
- **Server safety net (`supabase/functions/landing-chat/index.ts`)**: after streaming, scan the full user-message history with regex for email and E.164/US phone; if found (and no `[[LEAD]]` was emitted this turn), call the same insert path used by `landing-capture-lead` (extract into `_shared/insert-landing-lead.ts` so both functions share it). Include the last assistant message as `notes` and set `source = "message_aura_website"`. Idempotency: dedupe on `(company_id, lower(email))` OR `(company_id, phone)` within the last 24h before inserting.
- **Client (`src/components/landing/LandingAIChat.tsx`)**: no UX change beyond the existing confirmation bubble; keep the `[[LEAD]]` stripping.

### 2. Talk to Aura (voice) — confirm + document capture
- Verify (via `tenant_integrations`) that `agent_0501kh52gehge14vjscb5n8j8vhn` maps to Aura Intercept — confirmed. Post-call webhook already writes to `leads` for that company.
- Update the ElevenLabs agent's **Data Collection** config (owner action in the ElevenLabs dashboard, not code) to require these variables from every call:
  - `customer_name`
  - `customer_phone`
  - `customer_email`
  Also add a system-prompt line in the agent's ElevenLabs prompt: "Early in every call, ask for the caller's name, best email, and mobile number and confirm them back." I will surface these exact instructions in the response so the owner can paste them in.
- Add a defensive fallback in `elevenlabs-post-call/index.ts`: if `data_collection_results` is empty but the transcript contains an email or phone (regex scan across all `user` turns), still create the lead with whatever we found (name defaults to "Voice visitor").

### 3. Shared insert helper
- New `supabase/functions/_shared/insert-landing-lead.ts` exporting `insertAuraInterceptLead({ name, email, phone, source, notes, industry })` used by `landing-capture-lead`, `landing-chat` (new fallback), and `elevenlabs-post-call` (voice fallback). Centralises the `company_id`, dedupe, priority/score defaults.

## Technical details
- Aura Intercept company_id: `04c57cbe-358e-4036-a3ad-b777a55f5be0` (already hard-coded in `landing-capture-lead`).
- Regex: email `/[\w.+-]+@[\w-]+\.[\w.-]+/g`, phone `/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g`.
- Dedupe query: `select id from leads where company_id = $1 and (lower(email)=$2 or phone=$3) and created_at > now() - interval '24 hours' limit 1`.
- All three sources tag `source` distinctly: `message_aura_website`, `talk_to_aura_website`, `voice_post_call` — Leads console can filter by source.

## Out of scope
- No new tables, RLS, or Stripe changes.
- No change to customer-owned company chat widgets — this is only the marketing-site Aura.

After you approve I'll implement the code changes and paste the exact ElevenLabs dashboard settings you need to update.
