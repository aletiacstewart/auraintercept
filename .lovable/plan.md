# Reset & Reseed Demo Environment — Per-Industry Demo Accounts

## Goal

Wipe the current 4 tier-based demo companies (Demo Core/Boost/Pro/Elite) and replace with **18 industry-specific demo companies**, one per active `industry_template_packs` row (HVAC, Plumbing, Roofing, Electrical, Real Estate, Beauty & Wellness, Restaurants, Personal Assistant, Pool & Spa, Pest Control, Landscape & Trees, Solar, Security Systems, Construction, Fencing & Decking, Handyman & Cleaning, Auto Care, Appliance Repair).

Each industry company gets:
- **3 user accounts** (admin, employee, customer) — universal password `aidemo*!`
- **Full demo data** tailored to that industry: customers, appointments, leads, quotes, invoices, inventory, marketing campaigns, blog posts
- **Industry knowledge base** auto-seeded via existing `trg_seed_industry_pack_kb` trigger
- **Tier rotation** so all 4 subscription tiers (Core/Boost/Pro/Elite) are represented across the 18 industries — exercises every AI agent set

Total: **18 companies × 3 users = 54 demo accounts**.

## Account naming convention

```
{industry_id}admin@demo.com      → company_admin role
{industry_id}employee@demo.com   → employee role (technician)
{industry_id}customer@demo.com   → customer role
```

Examples: `hvacadmin@demo.com`, `plumbingemployee@demo.com`, `realestatecustomer@demo.com`.

## Tier distribution across 18 industries

Cycled so each tier sees real-world industry variety:

```text
Core    : hvac, electrical, handyman, auto_care, appliance_repair          (5)
Boost   : plumbing, pool_spa, pest_control, landscape, fencing             (5)
Pro     : roofing, beauty_wellness, restaurants, security_systems          (4)
Elite   : real_estate, personal_assistant, solar, construction             (4)
```

## Scope of changes

### 1. Wipe existing demo data (one-time SQL migration)

For each of the 4 current `is_demo = true` companies:
- Delete `auth.users` for the 12 demo accounts (cascades roles/profiles)
- Delete the 4 demo companies (cascades appointments, leads, quotes, invoices, inventory, blog posts, knowledge docs, faqs, customer profiles, etc. via existing FKs)

### 2. Rewrite `seed-demo-accounts-v2` edge function

Replace the 4-tier `TIERS` array with an **18-industry `INDUSTRIES` array** (industry_id, label, tier, primary/secondary colors, agents resolved from tier).

Per-industry seeding logic (extends current per-tier flow):
- **Company**: insert with `industry_vertical` set → triggers `trg_seed_industry_pack_kb` to auto-populate KB docs and FAQs from the industry template pack
- **3 users**: ensure auth.users exist with password `aidemo*!`, email_confirm=true
- **Profiles + roles + job assignment + customer association**: same as today
- **Business hours**: Mon–Fri 8–17 (Restaurants & Beauty get 6-day schedules)
- **Industry-aware demo data** using each pack's terminology and service templates:
  - **5 customer profiles** (the registered customer + 4 sample names)
  - **5 appointments** with industry-appropriate `service_type` pulled from the pack's `job_templates` (e.g. "Listing Photos Shoot" for real_estate, "Hair Color & Cut" for beauty_wellness, "AC Tune-Up" for hvac)
  - **6 leads** with industry-appropriate `service_interest` and `intent`
  - **2 marketing campaigns** with industry-tailored copy
  - **3 blog posts** (titles drawn from a per-industry template map)
  - **Quotes/Invoices** (Pro + Elite tiers) — realistic line items per industry
  - **Inventory items** (Pro + Elite, where applicable) — industry-specific SKUs (skipped for Personal Assistant, Real Estate, Restaurants which use service-only inventory or none)

Per-industry sample-data tables added to the function:
```text
INDUSTRY_SERVICES   : { hvac: ['AC Tune-Up','Furnace Repair',...], plumbing: [...], ... }
INDUSTRY_BLOG_POSTS : { hvac: [{title, content}, ...], ... }
INDUSTRY_INVENTORY  : { hvac: [{name, sku, ...}, ...], ... }   // null = skip inventory seed
INDUSTRY_CAMPAIGNS  : { hvac: [{name, message, promo_code}, ...], ... }
```

Wipe-before-seed (per company) keeps idempotency: re-running clears appointments, leads, campaigns, quotes, invoices, inventory, blog posts for that company before reinsert.

### 3. Update `DemoAccountSeeder.tsx` UI

- Replace 4-tier grid with **18-industry grid** (grouped by tier in 4 collapsible sections)
- Update copy: "Recreate the 18-industry demo environment: 18 companies × 3 accounts = 54 demo accounts"
- Show industry label + tier badge + 3 emails per card
- Result panel renders all 18 cards

### 4. Update memory

Rewrite `mem://platform-operations/demo-account-registry` from "12 demo accounts (4 tiers × admin/employee/customer)" → "54 demo accounts (18 industries × 3 roles), grouped by tier rotation". Reseed at `/dashboard/demo-seeder`.

## Files to change

```text
supabase/functions/seed-demo-accounts-v2/index.ts   (rewrite TIERS → INDUSTRIES, add per-industry data tables)
src/pages/DemoAccountSeeder.tsx                     (18-card grid grouped by tier)
.lovable/memory/platform-operations/demo-account-registry.md   (update via memory tool)
+ 1 SQL migration: wipe existing 4 demo companies + their 12 users
```

## How you'll use it

1. Migration auto-applies → existing demo data gone
2. Open `/dashboard/demo-seeder` → click **Seed All Demo Accounts**
3. Edge function creates 54 accounts + per-industry data in ~60–90 seconds
4. Log in as any `{industry}admin@demo.com` / `aidemo*!` to test that industry's AI agents, terminology, KB, forms, and console layout

## Risk / safety

- The seeder requires `platform_admin` JWT (already enforced)
- All seeded companies have `is_demo = true` — production company data is never touched
- `expire-demo-trials` cron will not affect these (it only targets rows in `demo_trials` with `expires_at < now()`)

Reply **approve** to execute.
