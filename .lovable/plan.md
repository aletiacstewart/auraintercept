## Diagnosis

The toast says **"Failed to send a request to the Edge Function"** and there are **zero logs** for `send-campaign`. That means the function is not booting/deployed — calls never reach it.

Likely cause: the last edit to `supabase/functions/send-campaign/index.ts` didn't redeploy cleanly. There is also no explicit `[functions.send-campaign]` block in `supabase/config.toml`, so it relies on default deploy.

## Plan

1. **Force a clean redeploy of `send-campaign`**
   - Make a tiny, safe edit (version comment bump + structured boot log) to `supabase/functions/send-campaign/index.ts`.
   - Wrap the JSON body parse in try/catch with a clear error so any future failure surfaces immediately instead of bubbling as a generic Edge Function transport error.

2. **Add explicit config entry**
   - Add `[functions.send-campaign]` to `supabase/config.toml` (default `verify_jwt = true` — invocations come from the logged-in console with the user's auth header, which is correct).

3. **Better client-side error surfacing**
   - In `MarketingSalesAgentConsole.sendCampaign` and `Campaigns.tsx`, after `supabase.functions.invoke('send-campaign', …)`, if `error` is set, also try to read `data?.error` so the toast shows the underlying reason ("No recipients found", "Resend not configured", etc.) instead of the opaque transport error.

4. **Verify after redeploy**
   - Confirm via `edge_function_logs` that `send-campaign` now boots and logs the request. If it still 500s, read the new log line to surface the real failure (missing Resend key, no customers in segment, etc.).

## Out of scope
- No changes to the campaigns UI, schema, tracking pixel, or `campaign-track`.
- No changes to email/SMS provider routing logic itself — once the function deploys, it will use the existing `send-email-guarded` / `send-appointment-sms` paths.

## Technical notes
- Files: `supabase/functions/send-campaign/index.ts`, `supabase/config.toml`, `src/components/marketing/MarketingSalesAgentConsole.tsx`, `src/pages/Campaigns.tsx`.