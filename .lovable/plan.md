## What I found

- **Outbound SMS is being attempted**, but SignalWire is rejecting it with:
  - `SignalWire 10000: To must send to a verified caller id`
- That means the connected SignalWire Space is still behaving like a trial/verified-recipient-limited account, or the saved credentials/From number belong to a Space that has not been fully enabled for that recipient.
- **Email is sending when both email + SMS are selected**. The latest campaign logged:
  - 1 email sent to `team@brandedby.com`
  - 1 email skipped because it used a placeholder invalid address
  - 1 SMS failed because SignalWire rejected the recipient
- **Inbound SMS is not being received/logged in Aura** because:
  - The `sms-handler` function has no recent logs, so SignalWire is likely not hitting the inbound SMS webhook.
  - The code tries to write inbound/outbound SMS to `sms_logs`, but that table does not exist.
  - The keyword lookup also uses `is_active`, while the actual `sms_keywords` column is `is_enabled`, which would break hashtag replies.
- The current SMS logs page only reads appointment reminder logs, so campaign SMS and inbound SMS do not show there.

## Plan

1. **Fix inbound SMS logging storage**
   - Add a `sms_logs` table for two-way SMS history.
   - Include company, from/to number, direction, status, message, metadata, and created time.
   - Add secure access rules so company users can read their own company’s SMS history, while backend functions can write logs.

2. **Fix the inbound SMS handler**
   - Update `sms-handler` to use `sms_keywords.is_enabled` instead of the non-existent `is_active` column.
   - Ensure inbound messages are logged even if AI reply generation or reply sending fails.
   - Keep SignalWire webhook responses XML-compatible so SignalWire receives a clean response.

3. **Improve outbound campaign SMS logging**
   - Keep campaign send rows in `campaign_sends`, but also write outbound SMS attempts into `sms_logs` so all SMS activity appears in one place.
   - Capture provider failure details when SignalWire rejects a message.

4. **Update SMS Logs UI**
   - Change `/dashboard/sms-logs` from reminder-only logs to a combined view:
     - inbound texts
     - outbound campaign texts
     - appointment reminders if present
   - Show failed campaign SMS errors clearly.

5. **Improve mixed email + SMS campaign feedback**
   - Update campaign detail/list UI messaging so a campaign with email sent + SMS failed is shown as **partial delivery**, not “nothing sent.”
   - Show per-channel counts: email sent/skipped/failed and SMS sent/skipped/failed.

6. **SignalWire setup note**
   - No code change can bypass SignalWire error `10000`; the SignalWire account/Space must verify the recipient or complete paid/A2P setup with the correct From number.
   - The app fix will make that failure visible everywhere instead of looking like the campaign did not run.

## Technical details

- Migration: create `public.sms_logs` with grants + RLS.
- Edge functions touched:
  - `sms-handler`
  - `send-appointment-sms`
  - possibly `send-campaign` only if we need campaign-level metadata copied into SMS logs.
- Frontend touched:
  - `src/pages/SMSLogs.tsx`
  - campaign detail/list component(s) for partial delivery status.

After implementation, I’ll validate by checking logs and recent database rows for campaign sends and SMS logs.