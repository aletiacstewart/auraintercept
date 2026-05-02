---
name: Public Company Listing Standard
description: Customer surfaces must list only non-demo, subscribed/in-trial companies via list_companies_for_customer / list_companies_public RPCs — never query companies table directly.
type: feature
---
Customer-facing directories (CustomerPortalInstall, CompanySelector for non-admins, any future "find a provider" surface) MUST call `list_companies_for_customer(p_search, p_industry, p_zip)` or `list_companies_public()`. Both RPCs are SECURITY DEFINER and enforce:

- `is_demo = false` — demo accounts are hidden from all non-admin surfaces.
- `subscription_tier IS NOT NULL` AND (`trial_ends_at IS NULL OR trial_ends_at > now()`) — only live/in-trial companies appear.

Returned columns include industry_vertical, service_categories, service_area_cities, service_area_zip_codes, subscription_tier so directories can show industry badges and filter by industry/zip.

Platform admins continue to use `list_companies_admin()` which surfaces demo accounts with the demo badge.

**Why:** Customers should only see real businesses they can actually hire. Demo accounts are platform-internal.

**How to apply:** Never write `supabase.from('companies').select(...)` from a customer surface. Admin/management pages may continue to query the table directly under RLS.