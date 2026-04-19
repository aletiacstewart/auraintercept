

## Plan: Remove all demo accounts and demo data

### Scope

**Auth users to delete** (all `@demo.com` addresses created by `create-demo-accounts` + `seed-demo-data`):
- 21 platform-tier accounts: `company{tier}@demo.com`, `employee{tier}@demo.com`, `customer{tier}@demo.com` (tiers: starter, connect, growth, presence, logistics, performance, command, plus legacy `pro`)
- Seeded mock customers/leads: `customer{N}@demo.com`, `lead{N}@demo.com`, `customer{N}.{slug}@demo.com`

**Demo companies to delete** (7):
Demo Starter, Demo Connect, Demo Growth, Demo Presence, Demo Logistics, Demo Performance, Demo Command.

**Cascade data to delete** (tied to those 7 company IDs):
appointments (56), leads (35), customer_profiles (99), customer_company_associations, job_assignments, invoices, quotes, inventory_items, call_logs, sms_keywords, smart_links, smart_websites, site_metrics, business_hours, blog_posts, smart_website_holidays, calendar_sync_jobs, google_calendar_connections, tenant_integrations, employee_job_assignments, employee_registration_codes, company_role_permissions, company_role_agent_access, customer_technician_history, warranty_policies, subscription_usage_tracking, user_roles + profiles for those auth users.

### Steps (in default mode)

1. **Migration: cleanup SQL** (single transaction):
   - Resolve user IDs: `WITH demo_users AS (SELECT id FROM auth.users WHERE email LIKE '%@demo.com')`
   - Delete from all dependent tables filtered by demo company IDs OR by demo user IDs
   - Delete from `public.user_roles`, `public.profiles` for demo users
   - Delete the 7 rows in `public.companies`
   - Delete the auth users themselves: `DELETE FROM auth.users WHERE email LIKE '%@demo.com'` (allowed inside a migration; this is a data delete, not a schema change to the auth table)

2. **Verification queries** post-migration:
   - `SELECT count(*) FROM public.companies WHERE slug LIKE 'demo-%';` → 0
   - `SELECT count(*) FROM auth.users WHERE email LIKE '%@demo.com';` → 0

3. **Code cleanup** — remove the now-broken UI/edge surface so admins can't recreate them:
   - Delete edge functions: `create-demo-accounts`, `create-demo-customer`, `create-demo-employee`, `seed-demo-data`
   - Delete pages/components: `src/pages/DemoAccounts.tsx`, `src/components/admin/CreateTestAccounts.tsx`, `src/components/admin/CreateTestCustomers.tsx`, `src/components/admin/CreateTestEmployees.tsx`
   - Remove route `/dashboard/demo-accounts` from `src/App.tsx`
   - Remove "Demo Accounts" sidebar entry from `src/components/dashboard/DashboardLayout.tsx` (lines 167 + 431)
   - Remove `demo-accounts` step from `src/components/tutorial/tutorialSteps.ts` (lines 289–296)
   - Remove `<CreateTestEmployees />` usage from `src/pages/Employees.tsx`
   - Update memory file `mem://platform-operations/demo-account-registry` to reflect removal (and drop the index entry)

### Risk note

Deletion is irreversible. The 7 demo companies and all `@demo.com` users will be permanently removed along with their 200+ rows of seeded data. Real customer accounts are untouched (filter is strictly `@demo.com` + the 7 hardcoded demo company UUIDs).

Approve and I'll run the migration + code cleanup.

