---
name: Sales-Rep Demo Logins
description: Three demo-only accounts (michael/charles/ryelee @auraintercept.ai) with `demo_rep` role, password `aidemo*!`, gated to /super-switcher only. ProtectedRoute redirects demo_rep off any other path unless actively switched. Re-provision via `seed-sales-rep-accounts` edge function or "Provision sales-rep logins" button on /super-switcher (platform_admin only).
type: feature
---

## Accounts
- michael@auraintercept.ai
- charles@auraintercept.ai
- ryelee@auraintercept.ai

Password: `aidemo*!` · Role: `demo_rep` (in `app_role` enum) · No company link.

## Behavior
- Login → `/super-switcher` (Auth.tsx routes demo_rep there).
- `ProtectedRoute` forces demo_rep back to `/super-switcher` whenever `!isSuperSwitcherActive()` and pathname isn't `/super-switcher`.
- `useSuperSwitcher.enter()` stashes the rep session (via `SALES_REP_EMAILS` set + `isSwitcherHostEmail`) so `exit()` restores them to the hub instead of bouncing to `/auth`.
- Switched-in tenant editing is fully allowed (rep is authenticated as the underlying demo company_admin/employee/customer).
- Admin-only controls on /super-switcher (Seed/repair, Demo seeder link, Provision reps button) are hidden from `demo_rep`.

## Re-provision
Edge function `seed-sales-rep-accounts` (idempotent, service-role, allow-listed emails baked in). Trigger from the hub button or curl.