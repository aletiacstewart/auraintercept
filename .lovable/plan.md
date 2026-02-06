
# Demo Content Data Update Plan

## Summary
Update the backend edge functions to align with the new tier-based naming convention. The database company records are already updated, but the edge functions still reference the old demo company names (Express, Flow, Core, Halo, Solo, Multi).

## Files Requiring Updates

| File | Current State | Update Needed |
|------|--------------|---------------|
| `supabase/functions/seed-demo-data/index.ts` | Uses old company names (Demo Flow, Demo Core, etc.) | Update COMPANY_DATA names |
| `supabase/functions/create-demo-customer/index.ts` | Uses old keys and company names | Update DEMO_COMPANIES object |

## Current vs New Naming

| Company ID | Old Name | New Name | Industry |
|------------|----------|----------|----------|
| `d4a6c195...` | Demo Express Company | Demo Starter Company | Restaurant |
| `56c0a3a8...` | Demo Halo Company | Demo Scheduling Company | Salon |
| `c8e9f0a1...` | Demo Core Company | Demo Growth Company | Real Estate |
| `b7d8e9f0...` | Demo Flow Company | Demo Business Company | Personal Assistant |
| `8fafcec0...` | Demo Solo Company | Demo Field Ops Company | HVAC |
| `4f85ed98...` | Demo Multi Company | Demo Performance Company | Plumbing |
| `298a7275...` | Demo Command Company | Demo Command Company | Electrical |

## Implementation Details

### Step 1: Update seed-demo-data/index.ts

Update the `COMPANY_DATA` object to use new company names:

```text
COMPANY_DATA Changes:
┌─────────────────────────────────────────┐
│ 'b7d8e9f0...'                           │
│   name: 'Demo Flow Company'             │
│   → name: 'Demo Business Company'       │
├─────────────────────────────────────────┤
│ 'c8e9f0a1...'                           │
│   name: 'Demo Core Company'             │
│   → name: 'Demo Growth Company'         │
├─────────────────────────────────────────┤
│ '8fafcec0...'                           │
│   name: 'Demo Solo Company'             │
│   → name: 'Demo Field Ops Company'      │
├─────────────────────────────────────────┤
│ '4f85ed98...'                           │
│   name: 'Demo Multi Company'            │
│   → name: 'Demo Performance Company'    │
├─────────────────────────────────────────┤
│ '56c0a3a8...'                           │
│   name: 'Demo Halo Company'             │
│   → name: 'Demo Scheduling Company'     │
├─────────────────────────────────────────┤
│ 'd4a6c195...'                           │
│   name: 'Demo Express Company'          │
│   → name: 'Demo Starter Company'        │
└─────────────────────────────────────────┘
```

### Step 2: Update create-demo-customer/index.ts

Update the `DEMO_COMPANIES` object with new keys, names, and slugs:

```text
DEMO_COMPANIES Changes:
┌────────────────────────────────────────────────────────┐
│ Old Key → New Key                                      │
├────────────────────────────────────────────────────────┤
│ xprs → starter                                         │
│   name: 'Demo Starter Company'                         │
│   slug: 'demo-starter'                                 │
├────────────────────────────────────────────────────────┤
│ halo → scheduling                                      │
│   name: 'Demo Scheduling Company'                      │
│   slug: 'demo-scheduling'                              │
├────────────────────────────────────────────────────────┤
│ core → growth                                          │
│   name: 'Demo Growth Company'                          │
│   slug: 'demo-growth'                                  │
├────────────────────────────────────────────────────────┤
│ flow → business                                        │
│   name: 'Demo Business Company'                        │
│   slug: 'demo-business'                                │
├────────────────────────────────────────────────────────┤
│ solo → field_ops                                       │
│   name: 'Demo Field Ops Company'                       │
│   slug: 'demo-fieldops'                                │
├────────────────────────────────────────────────────────┤
│ multi → performance                                    │
│   name: 'Demo Performance Company'                     │
│   slug: 'demo-performance'                             │
├────────────────────────────────────────────────────────┤
│ cmd → command (unchanged)                              │
│   name: 'Demo Command Company'                         │
│   slug: 'demo-command'                                 │
└────────────────────────────────────────────────────────┘
```

## Files Already Updated (No Changes Needed)

| File | Status |
|------|--------|
| `src/pages/DemoAccounts.tsx` | Already has new tier names and emails |
| `supabase/functions/create-demo-accounts/index.ts` | Already uses new email patterns |
| Database `companies` table | Already has new names and slugs |
| Database `profiles` table | Already updated with new emails |

## Impact

After these changes:
- Seeding demo data will create records with correct company names
- Creating demo customers will use the correct tier-based keys
- All demo content will align with the new naming convention shown in the DemoAccounts page

## Verification

After implementation:
1. The seed-demo-data function will populate data with correct company names
2. The create-demo-customer function will work with new tier-based keys
3. Dashboard demo content will display consistent naming
