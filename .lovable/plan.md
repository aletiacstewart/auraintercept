
# Pre-Launch Automated Verification

Goal: automate what a machine can actually prove from your checklist. I'll produce a single markdown report at `/mnt/documents/pre-launch-report.md` with PASS / FAIL / MANUAL-ONLY per item, plus screenshots for the browser checks.

I won't ship any product code changes in this pass — only diagnostics. If a check fails, I'll list the offending file/query so a follow-up build turn can fix it.

## Part A — Tenant Isolation (Item 1)

Static + DB analysis (no fake test tenant needed, and safer than one):

1. **RLS coverage audit** — query `pg_policies` + `pg_class` for every table in the codebase's `<supabase-tables>` list. Flag any table that is (a) RLS-disabled, (b) has zero policies, or (c) has a `USING (true)` SELECT policy without a `company_id`/`user_id` scope.
2. **GRANT audit** — for each public table, confirm no `anon` SELECT grant exists on tables that store tenant data (customers, appointments, leads, invoices, quotes, call_logs, sms_logs, etc.).
3. **Security definer function audit** — list every `SECURITY DEFINER` function and flag any that return tenant rows without filtering by `auth.uid()` / caller's `company_id`.
4. **Client-side leak scan** — ripgrep the frontend for `.from('<tenant-table>')` calls that don't chain `.eq('company_id', …)` and aren't already inside an RLS-protected read. Report suspicious call sites.
5. **Cross-company access log check** — query `cross_company_access_logs` for anything unexpected in the last 30 days.
6. **Platform Admin gate check** — grep routes/components for `platform_admin` guards; confirm `/dashboard/architecture`, `/design-preview`, `/cyber-sentry-mockup*`, `/calculators`, `/export-docs` are gated in router config, not just hidden in the sidebar.

Output: table of `{table, rls_enabled, policy_count, anon_grant, tenant_scoped, verdict}` + list of unscoped frontend queries + list of ungated admin routes.

## Part B — Code-Fix Regression Verification (Item 5)

Purely static — fast:

1. **Twilio → SignalWire** — `rg -i 'twilio'` across `src/`, `supabase/functions/`, `public/`, `.lovable/memory/`. Expected result: only historical mentions in memory/migration comments; zero references in live UI copy, edge functions, or config.
2. **Sidebar duplication** — read `src/components/dashboard/DashboardSidebar.tsx` (and TechnicianDashboardLayout) and diff the nav item arrays for duplicate `path` entries per role. Snapshot render via Playwright on `/dashboard` at desktop width and count sidebar `<a>` elements per section.
3. **Sticky sub-nav overlap** — Playwright: load Field Ops Console, Business Management Console, and Settings; scroll 400px; screenshot; check for computed `position: sticky` elements whose bounding box overlaps the first content card (`getBoundingClientRect` intersection test).
4. **Job-count sync (HVAC Tech Ops vs Dispatch)** — read `useFieldOpsWorkflow.ts` and the Dispatch page; confirm both derive counts from the same query/hook. If they diverge, flag the two sources.
5. **Calendar sync cards (CalDAV, ICS)** — Playwright load `/dashboard/integrations/calendar`; assert no card renders the string "not available" / "unavailable"; screenshot for visual confirmation.

## Part C — Marked MANUAL-ONLY in the report

These I can't meaningfully automate and will explicitly call out:
- Item 2 (real-phone iOS Safari + Android Chrome PWA install) — Playwright mobile emulation is not the same as a real device install flow.
- Item 3 (Privacy / Terms legal review) — I can confirm the pages exist and aren't lorem ipsum, but "reflects what the platform actually does" needs a human/lawyer.
- Item 4 real signup flow — creating a live tenant + Stripe row via the automation would pollute prod data.

For Item 3 I *will* fetch `/privacy` and `/terms`, word-count them, and flag if either contains "lorem", "TODO", or is under ~500 words.
For Item 4 I *will* read the signup edge function + `Auth.tsx` and confirm no demo-company `company_id` is seeded into new profiles, and that new companies start with empty `services`/`faqs`/`inventory_items`.

## Deliverable

`/mnt/documents/pre-launch-report.md` with:
- PASS/FAIL per checklist item
- Concrete file:line references for any failure
- Screenshots under `/mnt/documents/prelaunch-screens/`
- A prioritized fix list at the bottom I can hand to a follow-up build turn

No product code is modified in this pass.
