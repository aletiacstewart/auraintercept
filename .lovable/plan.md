## What's actually broken vs. missing

**1. AI Generate still erroring**
The edge log shows the same `ReferenceError: supabase is not defined at index.ts:133:71` from before. The source file in the project has the fix (the `supabase` client is hoisted above the `if (companyId)` block), but the running edge function is the old version — the redeploy didn't take effect. Need to force a redeploy of `generate-campaign-content`.

**2. Campaigns ARE saved, but there's no way to review them**
- `marketing_campaigns` rows persist (draft + after send) — they're already reusable: Send Again button exists.
- `campaign_sends` table logs every recipient + channel + status + error from `send-campaign`.
- `marketing_campaigns.total_sent` is incremented after a send.
- But the UI only shows aggregate stat cards on the list. There is **no per-campaign detail view** that shows who received it, when, delivery status, errors, or per-recipient opens.

**3. Opens / clicks are not tracked at all**
- `total_opened` / `total_clicked` columns exist on `marketing_campaigns` but nothing ever writes to them.
- `send-campaign` calls `send-email-guarded` (Resend). Resend can post open/click webhooks, but we have no webhook handler that ties those events back to a `campaign_sends` row or a `marketing_campaigns` counter.
- No tracking pixel / link wrapper either.

## Plan

### A. Fix AI Generate (force redeploy)
- Re-touch `supabase/functions/generate-campaign-content/index.ts` (no logic change needed — current source is already correct) so the platform redeploys it. Add a small no-op comment + log line to ensure the deploy ships.
- Verify by calling the function with `companyId` and checking logs.

### B. Per-campaign delivery review
- Add a **"View Details"** button on each campaign card in `src/pages/Campaigns.tsx` opening a new page `src/pages/CampaignDetail.tsx` at `/dashboard/campaigns/:id`.
- The detail page shows:
  - Campaign metadata (name, type, segment, channels, subject, message, promo, status, created/last sent).
  - Delivery summary: total recipients, sent, failed, opened, clicked, last_sent_at (queried from `campaign_sends` + `marketing_campaigns`).
  - Recipient table (paginated): customer name, recipient (email/phone), channel, status badge, sent_at, opened_at, clicked_at, error.
  - Per-send timestamp grouping so multiple "Send Again" runs are visually separated.
- Add **Duplicate** action that clones the campaign into a new `draft` row so it's clearly reusable.
- Add route in `src/App.tsx`.

### C. Open & click tracking
- Migration: add `opened_at`, `clicked_at`, `provider_message_id` to `campaign_sends`; add index on `(campaign_id)` and `(provider_message_id)`.
- Update `send-campaign`:
  - Generate a `campaign_send` UUID up-front; pass it as `metadata.campaign_send_id` when invoking `send-email-guarded` (already supported via `email_send_log.message_id`).
  - When sending email, append a 1×1 tracking pixel at the bottom of the HTML: `<img src="${SUPABASE_URL}/functions/v1/campaign-track?id=<send_id>&e=open" />`.
  - Rewrite outbound links in the HTML to `${SUPABASE_URL}/functions/v1/campaign-track?id=<send_id>&e=click&u=<encoded_url>` (simple regex on `href="..."`).
- New public edge function `supabase/functions/campaign-track/index.ts` (`verify_jwt = false`):
  - `e=open` → set `campaign_sends.opened_at` (first only) and increment `marketing_campaigns.total_opened`; return 1×1 GIF.
  - `e=click` → set `clicked_at` (first only) + increment `total_clicked`; 302 redirect to `u`.
- Resend webhook fallback (optional, but cheap): also wire `supabase/functions/resend-webhook/index.ts` to catch `email.opened` / `email.clicked` events. Maps via `provider_message_id` → `campaign_sends`. (Only if Resend is configured; otherwise pixel/link rewriting carries it.)

### D. Reuse / lifecycle
- Already covered by Send Again + new Duplicate action.
- Add `status = 'completed'` transition after a send (currently always `active`) is out of scope; leaving as `active` so Send Again remains visible.

### Files touched
- `supabase/functions/generate-campaign-content/index.ts` (trivial redeploy nudge)
- `supabase/functions/send-campaign/index.ts` (pixel + link rewrite + send_id)
- `supabase/functions/campaign-track/index.ts` (new)
- `supabase/migrations/*_campaign_open_click.sql` (new columns + indexes + grants)
- `src/pages/Campaigns.tsx` (View Details, Duplicate buttons)
- `src/pages/CampaignDetail.tsx` (new)
- `src/App.tsx` (route)

### Out of scope
- SMS open/click tracking (carriers don't expose this; the recipient table will still show delivery status).
- Inbox-preview / template editor changes.
- Campaign scheduling automation.
