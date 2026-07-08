## Status vs. audit prompt

All four fixes are **already in place**. Verified against DB + code:

| Fix | Status | Evidence |
|---|---|---|
| 1. `validate_registration_code` matches real schema | ✅ Done | Live function definition references only real columns: `erc.company_id`, `erc.expires_at`, `erc.used`, `erc.job_role`, `c.name`. No `max_uses`/`current_uses`. Runs `STABLE SECURITY DEFINER` with `search_path=public`. |
| 2. `SignUp.tsx` calls the RPC | ✅ Done | `src/pages/SignUp.tsx:553-563` uses `supabase.rpc('validate_registration_code', { p_code: registrationCode }).maybeSingle()` and derives `codeCompanyId` from the result. |
| 3. Mark-as-used filters by `code`, not `id` | ✅ Done | `SignUp.tsx:609-613` — `.update({ used: true }).eq('code', registrationCode).eq('used', false)`. Satisfies the "verified JWT email = row email" UPDATE policy. |
| 4. Invite form requires email | ✅ Done | `EmployeeManagement.tsx:268-273` validates email with regex before mutating; button disabled when empty (`:364`); insert normalises to `email.trim().toLowerCase()` (`:177`); `<Input type="email" required>` in the dialog. |

## One factual correction to the audit

The audit claims `employee_registration_codes` has no `job_role` column — that's wrong. The live schema is:

```
id, company_id, code, email, expires_at, used, created_at, job_role
```

So the existing function correctly returns `erc.job_role` (used by `SignUp.tsx:597` to auto-assign a job type at signup). Rewriting the function per the audit's exact SQL would return `NULL::text` and **silently regress** the auto-assign-job-role feature. I recommend **not** applying audit Fix 1's rewrite verbatim — the current function is already correct.

## Recommendations beyond the audit

1. **Backfill risk — legacy null-email codes.** The audit correctly notes existing rows with `email IS NULL` are permanently unclaimable. Quick check I'd run in build mode:
   ```sql
   SELECT count(*) FROM employee_registration_codes
   WHERE email IS NULL AND used = false AND expires_at > now();
   ```
   If any exist, either (a) mark them used to hide from admin UI, or (b) add a `NOT NULL` constraint on `email` going forward (migration). Ask me to do either.
2. **Optional hardening**: the pending-invites query in `EmployeeManagement.tsx:149-155` reads the table directly. That's fine — the SELECT policy is scoped to `company_id = current user's company`. No change needed, just flagging that it's been re-audited.

## Plan

Nothing to code. If you want either of the follow-ups above (audit stale null-email codes, or add a `NOT NULL email` constraint), tell me which and I'll do it in one migration.

## Verification (spot-check, no code changes needed)

- Confirm live function definition matches real columns → done via `pg_get_functiondef`.
- Confirm `SignUp.tsx` RPC wiring → confirmed at line 553.
- Confirm mark-as-used filter → confirmed at line 610-613.
- Confirm invite form email requirement → confirmed at lines 268-273.
