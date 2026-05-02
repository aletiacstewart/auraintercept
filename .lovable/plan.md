I checked the live database and the demo companies themselves are now stored under the correct requested plans:

```text
Core:  beauty_wellness, restaurants, real_estate, personal_assistant
Boost: handyman, auto_care, appliance_repair, pest_control, fencing
Pro:   security_systems, pool_spa, landscape, solar
Elite: hvac, electrical, plumbing, roofing, construction
```

The problem is twofold:

1. The `/dashboard/demo-seeder` page is still showing the old hardcoded grouping, so the screen is misleading even though the database rows are correct.
2. All demo companies still have active `trial_ends_at` dates, and several app paths treat any active trial as full Elite/Command access. That makes Core/Boost/Pro demo accounts behave like Elite even after reseeding.

## Plan

### 1. Fix the Demo Account Seeder page grouping
Update `src/pages/DemoAccountSeeder.tsx` so the visible account cards match the current industry-curated tier mapping:

- Core: Beauty & Wellness, Restaurants, Real Estate, Personal Assistant
- Boost: Handyman & Cleaning, Auto Care, Appliance Repair, Pest Control, Fencing & Decking
- Pro: Security Systems, Pool & Spa, Landscape & Trees, Solar
- Elite: HVAC, Electrical, Plumbing, Roofing, Construction

Also update the helper text/counts so it no longer shows Core as 5 industries or Elite as 4 industries.

### 2. Stop demo accounts from being promoted to Elite by trial logic
Update `supabase/functions/seed-demo-accounts-v2/index.ts` so reseeded demo companies are plan-specific demos, not trial-upgraded demos. The seeder should either clear `trial_ends_at` for demo companies or set it in a way that does not grant full access. This keeps the demo account’s actual plan in control.

### 3. Fix subscription checking so active trials honor the selected plan
Update `supabase/functions/check-subscription/index.ts` so an active 90-day trial returns:

- `in_trial: true`
- `tier: company.subscription_tier`

instead of always returning `tier: command`.

This preserves the 90-day trial banner/progress while making dashboards, sidebars, consoles, and AI agents follow the plan the user selected at signup.

### 4. Fix frontend gating that currently treats all trials as full Elite
Update these frontend tier helpers/components so trial status does not override plan access to `command`:

- `src/hooks/useSubscription.ts`
- `src/components/dashboard/DashboardLayout.tsx`
- `src/components/dashboard/CompanyAdminDashboard.tsx`
- `src/components/ai/AIAgentConsole.tsx`
- `src/components/customer/UnifiedCustomerConsole.tsx`
- `src/lib/customerPortalConfig.ts`
- any related text that says trial gives full Elite/Enterprise access

After this, trial means “90 days free on the selected tier,” not “90 days of Elite.”

### 5. Clean up existing demo rows already in the database
Add a safe migration or admin-side repair step to update existing demo companies so `trial_ends_at` no longer causes full-access behavior. This will not touch real companies.

### 6. Verify the live database and UI expectations
After implementation, verify:

- demo companies still have the correct `subscription_tier` values
- demo companies no longer get full Elite access solely because of active trial dates
- `/dashboard/demo-seeder` visually shows the correct grouping
- real signups continue to write `is_demo: false`, selected `industry_vertical`, selected `subscription_tier`, and 90-day trial dates

## Expected result

After approval and implementation, reseeding will no longer make demo accounts appear in the wrong plans. The demo seeder page, stored company tier, sidebar access, dashboard cards, AI Operatives Hub, and customer/agent consoles will all follow the plan assigned to that industry.