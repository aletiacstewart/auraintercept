# Database

Postgres on Lovable Cloud. Every tenant table carries `company_id` and is protected by row-level security; `GRANT`s are issued in the same migration that creates the table.

## Access rules

- `get_user_company_id(auth.uid())` scopes almost every policy.
- Roles live **only** in `user_roles` (enum `app_role`: platform_admin, company_admin, employee, customer, demo_rep) and are read through the security-definer `has_role(user_id, role)`. Roles are never stored on `profiles`.
- Helper gates: `has_company_full_access`, `has_billing_access`, `has_dispatch_access`, `has_marketing_access`, `has_inventory_access`, `has_agent_access`, `has_feature_access`, `has_job_type`.
- Public-facing reads go through security-definer functions (`get_company_public_info`, `get_website_public_data`, `submit_public_booking`, `get_appointment_by_token`) rather than open policies.

## Main groups

| Area | Tables |
| --- | --- |
| Tenancy | `companies`, `profiles`, `user_roles`, `company_role_permissions`, `feature_flags` |
| Work | `appointments`, `job_assignments`, `employee_availability`, `employee_time_off`, `business_hours`, `holiday_closures` |
| Money | `quotes`, `quote_line_items`, `invoices`, `invoice_line_items`, `subscription_events`, `subscription_usage_tracking` |
| Customers & sales | `customers`, `customer_profiles`, `leads`, `lead_activities`, `customer_pipeline`, `referrals` |
| AI | `ai_agent_configs`, `ai_agent_events`, `ai_agent_logs`, `ai_agent_context`, `agent_proposed_actions`, `agent_performance_metrics`, `company_agent_autonomy` |
| Connections | `tenant_integrations` (+ the `tenant_integrations_safe` view), `google_calendar_connections`, `crm_connections`, `social_accounts`, `integration_health_logs` |
| Industry | `industry_template_packs` (incl. `quickstart`, `extra_operatives`), `industry_blueprints` |
| Onboarding | `onboarding_analytics`, `onboarding_invites`, `onboarding_submissions`, `launch_progress` |
| Marketing | `marketing_campaigns`, `campaign_recipients`, `campaign_sends`, `scheduled_social_posts`, `blog_posts` |

## Sensitive columns

Credentials sit in `tenant_integrations` and are never exposed to the browser directly — the client reads `tenant_integrations_safe`, which returns only `has_*` booleans and non-secret settings. Edge functions read the real columns with the service role.

## Conventions for new tables

1. `CREATE TABLE public.x (...)` with `id uuid primary key default gen_random_uuid()`, `company_id`, `created_at`, `updated_at`.
2. `GRANT` to the roles the policies allow, plus `service_role`.
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
4. Policies scoped by `get_user_company_id` / `has_role`.
5. `update_updated_at_column` trigger for `updated_at`.
6. Use validation triggers, not CHECK constraints, for any time-dependent rule.

## Background work

Cron jobs drive the nightly connection health check, appointment reminders, scheduled social posts, the weekly analytics run and dunning. Each cron-invoked edge function verifies a shared secret (`requireCronSecret`).
