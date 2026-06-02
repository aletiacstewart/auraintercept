## Root cause

Edge Function logs show:
`null value in column "id" of relation "campaign_sends" violates not-null constraint`

The `campaign_sends.id` column has a `gen_random_uuid()` default, but in `send-campaign/index.ts` only the email-success log row sets an explicit `id` (used for open/click tracking). The SMS-success row and both catch-block rows omit `id`. When supabase-js batch-inserts an array of objects with different keys, it builds the column set as the **union** of all keys and sends `null` for rows missing a key — that null overrides the DB default and the whole insert fails. Net effect: nothing is recorded and the function returns 500, which the UI shows as "Edge Function returned a non-2xx status code".

## Changes

**`supabase/functions/send-campaign/index.ts`**
- Add `id: crypto.randomUUID()` to every `logs.push(...)` call:
  - SMS success entry (line ~182)
  - Email catch-block entry (line ~171)
  - SMS catch-block entry (line ~191)
- Email success entry already has `id: sendId`; leave it.
- Redeploy the function.

## Verify

- Click "Send Again" on a saved campaign.
- Confirm: no more `23502` error in logs; `campaign_sends` rows appear; toast reports actual per-recipient outcome.
- For SMS: the underlying SignalWire error `"To must send to a verified caller id"` will now propagate to the per-row `error` column and toast — this is a SignalWire trial-account constraint (recipient numbers must be verified or the account upgraded), not a code bug. Out of scope for this fix.

## Out of scope

- UI, schema, tracking pixel, `campaign-track` function.
- SignalWire account configuration.
