
# Create Demo Customer Accounts

## Overview
Create two new demo customer accounts and update the demo accounts registry to display them.

## Accounts to Create

| Email | Password | Assigned Company | Company ID |
|-------|----------|------------------|------------|
| customerxprs@demo.com | aidemo*! | Demo Express Company | d4a6c195-c89a-4208-a818-981902af6c51 |
| customerhalo@demo.com | aidemo*! | Demo Halo Company | 56c0a3a8-a2a1-4689-9c18-d115080a816d |

## Implementation Steps

### 1. Update Edge Function
**File:** `supabase/functions/create-demo-accounts/index.ts`

Add the two new customer accounts to the accounts array (lines 66-70):

```typescript
// Customers
{ email: 'customersolo@demo.com', name: 'Solo Demo Customer', role: 'customer', companyId: companies.solo },
{ email: 'customermulti@demo.com', name: 'Multi Demo Customer', role: 'customer', companyId: companies.multi },
{ email: 'customercmd@demo.com', name: 'Command Demo Customer', role: 'customer', companyId: companies.cmd },
{ email: 'customerxprs@demo.com', name: 'Express Demo Customer', role: 'customer', companyId: companies.xprs },
{ email: 'customerhalo@demo.com', name: 'Halo Demo Customer', role: 'customer', companyId: companies.halo },
```

### 2. Deploy and Execute Edge Function
- Deploy the updated edge function
- Call it with the admin secret header to create the accounts

### 3. Update Demo Accounts Registry
**File:** `src/pages/DemoAccounts.tsx`

Update the `demoAccounts` array (lines 30-46):

```typescript
{
  tier: 'Aura Express',
  tierColor: 'bg-amber-500/20 text-amber-600',
  price: '$197/mo',
  companyAdmin: 'companyxprs@demo.com',
  employee: 'employeexprs@demo.com',
  customer: 'customerxprs@demo.com',  // Changed from null
},
{
  tier: 'Aura Halo',
  tierColor: 'bg-rose-500/20 text-rose-600',
  price: '$397/mo',
  companyAdmin: 'companyhalo@demo.com',
  employee: 'employeehalo@demo.com',
  customer: 'customerhalo@demo.com',  // Changed from null
},
```

## Files to Modify
1. `supabase/functions/create-demo-accounts/index.ts` - Add new customer accounts
2. `src/pages/DemoAccounts.tsx` - Display customer emails in registry

## Result
- Two new customer auth users created with password `aidemo*!`
- Customer profiles created and linked to respective companies
- Customer company associations established
- Demo accounts page updated to show the new customer credentials
