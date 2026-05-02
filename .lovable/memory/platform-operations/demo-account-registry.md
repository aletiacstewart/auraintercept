---
name: Demo Account Registry v3
description: 54 demo accounts (18 industries × admin/employee/customer), one per active industry pack with tier rotation. Universal password aidemo*!. Reseed at /dashboard/demo-seeder.
type: feature
---

# Demo Account Registry v3 — Per-Industry

The seeder (`seed-demo-accounts-v2` edge function + `/dashboard/demo-seeder` UI) creates **18 demo companies** — one per active row in `industry_template_packs` — with **3 user accounts each (admin / employee / customer)** for a total of **54 demo accounts**. Universal password: `aidemo*!`.

## Email convention

```
{industry_key_no_underscores}admin@demo.com      → company_admin
{industry_key_no_underscores}employee@demo.com   → employee (technician)
{industry_key_no_underscores}customer@demo.com   → customer
```

Examples: `hvacadmin@demo.com`, `realestateemployee@demo.com`, `personalassistantcustomer@demo.com`.

## Tier rotation (across 18 industries)

```
Core    : hvac, electrical, handyman, auto_care, appliance_repair          (5)
Boost   : plumbing, pool_spa, pest_control, landscape, fencing             (5)
Pro     : roofing, beauty_wellness, restaurants, security_systems          (4)
Elite   : real_estate, personal_assistant, solar, construction             (4)
```

## Per-company seed includes

- Company row with `industry_vertical = <key>` and `is_demo = true` (slug `demo-<key>`). Setting `industry_vertical` triggers `trg_seed_industry_pack_kb` which auto-seeds knowledge docs + FAQs from the industry template pack.
- 5 customer profiles (registered customer + 4 sample names)
- 5 appointments (mix of scheduled/completed/cancelled) with industry-specific `service_type`
- 6 leads with industry-specific `service_interest`
- 2 marketing campaigns with industry-tailored copy + promo codes
- 3 blog posts (2 published, 1 draft) with industry-specific titles & content
- 3 quotes + 3 invoices (Pro/Elite tiers only)
- Industry-specific inventory items (HVAC, Plumbing, Roofing, Solar, Construction, etc.) — skipped for service-only verticals (Real Estate, Personal Assistant, Restaurants)
- Mon–Fri 8–17 business hours
- Roles + employee job assignment (`technician`) + customer-company association

## Behavior

- Re-running is idempotent: companies upsert by slug, demo data wiped per-company before reinsert, user passwords reset.
- First run also auto-deletes stale tier-based demo users from the previous schema (`{tier}company@demo.com`, etc.).
- Requires `platform_admin` JWT on the edge function call.

## How to use

1. Sign in as a platform admin.
2. Visit `/dashboard/demo-seeder` → click **Seed All Demo Accounts** (~60–90s for 18 industries).
3. Sign in as `{industry}admin@demo.com` / `aidemo*!` to test that vertical's AI agents, terminology, KB, console layout, and forms.
