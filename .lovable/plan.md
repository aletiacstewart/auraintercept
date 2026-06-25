# Fix: "Workflow failed to queue any actions"

## Root cause

Every `Run with Aura` click in `useRunWorkflowChain` hits `supabase.functions.invoke("agent-action-executor", ...)` and gets `FunctionsFetchError: Failed to send a request to the Edge Function` (visible in console logs). The function code exists at `supabase/functions/agent-action-executor/index.ts`, but:

- It has no entry in `supabase/config.toml`.
- It has never produced a log (the edge log tool returns "No logs found").

That means the function was never deployed to the gateway, so every invocation 404s at the network layer and the runner reports "Workflow failed to queue any actions."

## Fix

1. Register the function in `supabase/config.toml`:
   ```toml
   [functions.agent-action-executor]
   verify_jwt = false
   ```
   (We use `verify_jwt = false` to match other internal executors — the function already validates `company_id` and uses the service role for inserts.)

2. Deploy `agent-action-executor` so the gateway route exists.

3. Smoke-test by:
   - Calling the function directly with a minimal `{ op: "propose", company_id, agent_id, action_type: "draft_email", payload: {...} }` body and confirming a 200 response plus a row in `agent_proposed_actions`.
   - Clicking "Run with Aura" on the Business Mgmt console and confirming the toast switches from "failed to queue" to the success/queued state and rows appear in `sms_logs` / `agent_proposed_actions`.

4. If the smoke test surfaces a secondary error (RLS, missing column, payload shape), patch that in the same pass — but the deploy + config registration is the blocking fix.

## Out of scope

No changes to `useRunWorkflowChain`, the workflow definitions, or the consoles — those are wired correctly; they just need a reachable function.
