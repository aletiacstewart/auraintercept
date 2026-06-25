# Automation Console — Preview, Links, and Activity Fixes

## 1. Rich "View payload" preview
Replace the raw JSON `<pre>` in `src/pages/Automation.tsx` and `PendingAuraDraftsPanel.tsx` with a new `src/components/automation/ActionPreview.tsx`:

- **draft_sms** → phone-style bubble: from name, to number, body, char count, "Reply STOP to opt out".
- **draft_email** → email envelope mock: From (company + sender domain), To, Subject, rendered body, styled CTA button using `payload.cta_url` / `payload.cta_label`, unsubscribe footer.
- **create_appointment** → calendar card: customer, service, formatted datetime, duration, notes.
- **draft_invoice** → invoice card: customer, line items, subtotal/total, due date.
- **task / unknown** → collapsible raw JSON fallback.

A "Show raw JSON" toggle remains available on every preview.

## 2. Real links inside drafts
Update `src/hooks/useRunWorkflowChain.ts` context loader and `src/lib/industryWorkflows.ts` action templates so drafts include actionable URLs:

- New hydration tokens: `{{activation_url}}`, `{{billing_url}}`, `{{login_url}}`, `{{company_portal_url}}`, `{{booking_url}}`, `{{quote_url}}`, `{{invoice_url}}`.
- Welcome / activation / billing-reminder emails get full body copy, `cta_label`, `cta_url`, and a P.S. about 3rd-party account setup (SignalWire, ElevenLabs, Resend, Stripe).
- Email actions include `from_name`, `from_email`, `reply_to`; SMS actions include `from_number` (company SignalWire DID).

## 3. Complete Recent Activity feed
In `src/pages/Automation.tsx`:

- Raise initial fetch limit; add "Load more" pagination (50/page).
- Show every non-pending status — `auto_executed`, `approved`, `rejected`, `failed`, `expired`, `executing` — plus a top "Awaiting approval" group so pending items also appear in Recent Activity.
- Add agent + status filter pills and a count badge on the tab.
- Add Supabase realtime subscription on `agent_proposed_actions` (filtered by `company_id`) to invalidate the query immediately instead of waiting 30s.

## 4. Backend tweaks
In `supabase/functions/agent-action-executor/index.ts`:

- Server-side payload hydration safety net: if any `{{...}}` token remains in the incoming payload, resolve known ones (activation/billing/login URLs) from a constant table before insert.
- `draft_email`: persist the fully-rendered `subject`, `html`, `cta_url`, `cta_label`, `from_*` into the stored payload so the preview is stable.
- Inject canonical CTA URLs for known platform emails (welcome, activation, billing reminder, payment-failed) when the caller omits one.

## Out of scope
- No schema changes. `agent_proposed_actions.payload` is JSONB and accepts the additional fields.
- No new email/SMS sending; this is preview + queue accuracy only.

## Files
- `src/pages/Automation.tsx`
- `src/components/automation/PendingAuraDraftsPanel.tsx`
- new: `src/components/automation/ActionPreview.tsx`
- `src/hooks/useRunWorkflowChain.ts`
- `src/lib/industryWorkflows.ts`
- `supabase/functions/agent-action-executor/index.ts`
