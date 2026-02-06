

# Demo Accounts Email Fix Plan

## Current Problem

1. The `DemoAccounts.tsx` UI was updated to show **new email patterns** (e.g., `companystarter@demo.com`)
2. But the **actual accounts** in the database still use the **old email patterns** (e.g., `companyxprs@demo.com`)
3. There is **no UI button** to trigger the `create-demo-accounts` edge function

## Two Options

### Option A: Update UI to Show Existing Emails (Recommended)
- Simply update `DemoAccounts.tsx` to display the actual emails that exist
- Quick fix, no database changes needed
- Accounts continue to work immediately

### Option B: Update Database Emails to Match New Names
- More complex - requires updating `auth.users` and `profiles` tables
- Cleaner naming but higher risk of breaking existing logins

## Recommended Approach: Option A

Update the `DemoAccounts.tsx` to show the **actual working emails**:

### Email Mapping (Old → Display)

| Tier | Admin Email | Employee Email | Customer Email |
|------|-------------|----------------|----------------|
| **Starter** | companyxprs@demo.com | employeexprs@demo.com | customerxprs@demo.com |
| **Scheduling** | companyhalo@demo.com | employeehalo@demo.com | customerhalo@demo.com |
| **Growth** | companycore@demo.com | employeecore@demo.com | customercore@demo.com |
| **Business** | companyflow@demo.com | employeeflow@demo.com | customerflow@demo.com |
| **Field Ops** | companysolo@demo.com | employeesolo@demo.com | customersolo@demo.com |
| **Performance** | companymulti@demo.com | employeemulti@demo.com | customermulti@demo.com |
| **Command** | companycmd@demo.com | employeecmd@demo.com | customercmd@demo.com |

### Files to Update

**1. src/pages/DemoAccounts.tsx**
- Update the `demoAccounts` array with the actual existing email addresses
- Keep the new tier names (Starter, Scheduling, Growth, Business, Field Ops, Performance, Command)
- Keep the new pricing ($197, $397, $597, $797, $1,497, $3,497, $5,497)

**2. supabase/functions/create-demo-accounts/index.ts**
- Revert to the old email patterns (or remove if not needed)
- This function was never connected to the UI anyway

### Optional: Add Edge Function Trigger Button
If you want the ability to recreate demo accounts in the future, we can add a "Reset Demo Accounts" button to the DemoAccounts page that calls the edge function.

## Summary

The simplest fix is to update the UI to show the **emails that actually exist in the database**. The accounts are already set up correctly - only the displayed emails in the UI need to match reality.

All 21 accounts work with password: `aidemo*!`

