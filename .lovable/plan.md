## Root cause

The `Talk to Aura` widget calls `send-walkthrough-demo`, which internally calls `create-demo-trial`. That function fails on insert:

> `trial: Could not find the 'password' column of 'demo_trials' in the schema cache`

`create-demo-trial/index.ts:377` writes `password: PASSWORD` into `public.demo_trials`, but the table has no `password` column (verified via `\d public.demo_trials`). `send-walkthrough-demo` then returns `ok:false` and Aura speaks the "I hit a snag" line.

This is not a timeout — both the gateway request and the internal call return 200 immediately. It's a missing schema column.

## Fix

Add the missing column with a migration:

```sql
ALTER TABLE public.demo_trials
  ADD COLUMN IF NOT EXISTS password text;
```

No RLS/grant changes needed (table already has policies + grants and is only written by edge functions using the service role). No code change in `create-demo-trial` — the existing `password: PASSWORD` insert is the intended payload (it stores the universal demo login so the credentials email/SMS can include it).

## Validation

1. Open `/`, click Talk to Aura, request a Plumbing walkthrough demo for a real mobile number.
2. Network: `send-walkthrough-demo` returns `{ ok:true, spoken, demo_url }`.
3. Edge logs: `create-demo-trial` no longer logs the `password` schema error.
4. Prospect receives the SMS + email with the `/demo/<trialId>` link.

## Out of scope

- No changes to `AuraAvatarChat.tsx`, `send-walkthrough-demo`, or `create-demo-trial` code.
- No edits to RLS, grants, or other columns on `demo_trials`.
