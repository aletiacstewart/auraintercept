---
name: Demo Account Registry v6
description: 78 demo accounts (26 industries × admin/employee/customer) including home_health + 5 other healthcare verticals. Universal password aidemo*!. Reseed at /dashboard/demo-seeder.
type: feature
---

# Demo Account Registry v6 — 26 Industries

The seeder (`seed-demo-accounts-v2` edge function + `/dashboard/demo-seeder` UI) creates **26 demo companies** — one per active row in `industry_template_packs` — with **3 user accounts each (admin / employee / customer)** for a total of **78 demo accounts**. Universal password: `aidemo*!`.

## Email convention

```
{industry_key_no_underscores}admin@demo.com      → company_admin
{industry_key_no_underscores}employee@demo.com   → employee (technician)
{industry_key_no_underscores}customer@demo.com   → customer
```

Examples: `hvacadmin@demo.com`, `dentaladmin@demo.com`, `medicalofficeemployee@demo.com`, `physicaltherapycustomer@demo.com`.

## Tier mapping (curated per industry — not rotation)

```
CORE  (7): beauty_wellness, restaurants, real_estate, personal_assistant,
           chiropractic, physical_therapy, optometry
BOOST (7): handyman, auto_care, appliance_repair, pest_control, fencing,
           dental, veterinary
PRO   (6): security_systems, pool_spa, landscape, solar, medical_office, home_health
ELITE (5): hvac, electrical, plumbing, roofing, construction
```

Each industry sits at the tier that best showcases its real console + agent surface. Healthcare verticals (dental, chiropractic, medical_office, veterinary, physical_therapy, optometry) are scoped to **appointments + insurance verification email only** — no EHR/PMS, prescriptions, lab results, medical records, or clinical advice.

## Per-company seed includes

- Company row with `industry_vertical = <key>` and `is_demo = true` (slug `demo-<key>`). Setting `industry_vertical` triggers `trg_seed_industry_pack_kb` which auto-seeds knowledge docs + FAQs from the industry template pack.
- 5 customer profiles (registered customer + 4 sample names)
- 5 appointments (mix of scheduled/completed/cancelled) with industry-specific `service_type`
- 6 leads with industry-specific `service_interest`
- 2 marketing campaigns with industry-tailored copy + promo codes
- 3 blog posts (2 published, 1 draft) with industry-specific titles & content
- 3 quotes + 3 invoices (Pro/Elite tiers only)
- Industry-specific inventory items where parts data exists — skipped for service-only verticals (Real Estate, Personal Assistant, Restaurants)
- Mon–Fri 8–17 business hours
- Roles + employee job assignment (`technician`) + customer-company association
- **AI agents auto-activated** in `ai_agent_configs` for the tier (Core 8 / Boost 12 / Pro 18 / Elite 24) plus the industry pack's `extra_operatives` (e.g. Personal Assistant gets `task_triager`, `calendar_optimizer`, `review_responder`). Wiped + reinserted on each reseed.

## Behavior

- Re-running is idempotent: companies upsert by slug, demo data wiped per-company before reinsert, user passwords reset.
- First run also auto-deletes stale tier-based demo users from the previous schema (`{tier}company@demo.com`, etc.).
- Requires `platform_admin` JWT on the edge function call.
- **Demo seeder NEVER touches non-demo companies.** See `mem://architecture/signup-vs-demo-isolation`.

## How to use

1. Sign in as a platform admin.
2. Visit `/dashboard/demo-seeder` → click **Seed All Demo Accounts** (~60–90s for 18 industries).
3. Sign in as `{industry}admin@demo.com` / `aidemo*!` to test that vertical's AI agents, terminology, KB, console layout, and forms.
