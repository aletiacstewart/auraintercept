# Schedule the Agent Event Processor + Guard the Action

Events now emit (previous prompt), but nothing drains `ai_agent_events`. Add a scheduled invocation of `ai-orchestrator` with `action: 'process_pending_events'` and lock that action to cron-only.

## Fix 1 — Guard `process_pending_events` only (not the whole function)

`supabase/functions/ai-orchestrator/index.ts`:

- Import `verifyCronSecret` from `../_shared/cron-auth.ts`.
- Inside the `switch (action)`, wrap only the `process_pending_events` case:

```ts
case 'process_pending_events': {
  const auth = await verifyCronSecret(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status ?? 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return await handleProcessPendingEvents(supabase, companyId);
}
```

All other actions (`get_context`, `emit_event`, `handoff`, `test_agent`, etc.) stay untouched — they're used by authenticated users and by the emit calls we added in the last pass. Note `verifyCronSecret` in this project is **async** (loads the secret from `public._cron_shared_secret`), so it must be awaited — the Claude prompt's sync signature is wrong for this codebase.

## Fix 2 — Schedule the job (use the shared cron secret, not a new one)

Add a new migration that reads the existing `public._cron_shared_secret` row (created by `20260703165021_...sql`) rather than minting a fresh CRON_SECRET. This keeps the cron helper's cached secret valid across all cron functions.

```sql
DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_url text := 'https://' || v_project_ref || '.supabase.co/functions/v1/ai-orchestrator';
  v_cmd text;
BEGIN
  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'shared cron secret missing; run the base cron migration first';
  END IF;

  BEGIN
    PERFORM cron.unschedule('aura-process-pending-agent-events');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  v_cmd := format(
    $f$select net.http_post(
      url:=%L,
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', %L
      ),
      body:='{"action":"process_pending_events"}'::jsonb
    ) as request_id;$f$,
    v_url, v_secret
  );

  PERFORM cron.schedule('aura-process-pending-agent-events', '*/2 * * * *', v_cmd);
END $$;
```

Runs every 2 minutes across all companies (no `companyId` in body — `handleProcessPendingEvents` already handles the optional case).

## Explicitly out of scope

- The `systemEvent` flag in `ai-agent-chat` — 4k+ line file, deserves its own pass. Flagged as follow-up.
- Tuning cadence — leave at 2 min; revisit after real traffic.

## Acceptance

- Insert a `pending` `ai_agent_events` row with real `company_id` + `target_agent` → status becomes `processed` within ~2 min without manual trigger.
- `POST ai-orchestrator {"action":"process_pending_events"}` without `x-cron-secret` → 401. Other actions (e.g. `get_context`) still work with a normal user JWT.
- A test booking after the previous fix leaves an `appointment_booked` row that flips from `pending` to `processed` on the next scheduled run.
- `cron.job_run_details` shows `aura-process-pending-agent-events` firing on schedule with HTTP 200.
