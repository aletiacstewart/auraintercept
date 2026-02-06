
# Demo Accounts Email Rename Plan

## Overview
Update all 21 demo account emails in the database and UI to use the new tier-based naming convention that matches the subscription tier names.

## Email Mapping (Old to New)

| Tier | Role | Current Email | New Email |
|------|------|---------------|-----------|
| **Starter** | Admin | companyxprs@demo.com | companystarter@demo.com |
| | Employee | employeexprs@demo.com | employeestarter@demo.com |
| | Customer | customerxprs@demo.com | customerstarter@demo.com |
| **Scheduling** | Admin | companyhalo@demo.com | companysched@demo.com |
| | Employee | employeehalo@demo.com | employeesched@demo.com |
| | Customer | customerhalo@demo.com | customersched@demo.com |
| **Growth** | Admin | companycore@demo.com | companygrowth@demo.com |
| | Employee | employeecore@demo.com | employeegrowth@demo.com |
| | Customer | customercore@demo.com | customergrowth@demo.com |
| **Business** | Admin | companyflow@demo.com | companybiz@demo.com |
| | Employee | employeeflow@demo.com | employeebiz@demo.com |
| | Customer | customerflow@demo.com | customerbiz@demo.com |
| **Field Ops** | Admin | companysolo@demo.com | companyfops@demo.com |
| | Employee | employeesolo@demo.com | employeefops@demo.com |
| | Customer | customersolo@demo.com | customerfops@demo.com |
| **Performance** | Admin | companymulti@demo.com | companyperf@demo.com |
| | Employee | employeemulti@demo.com | employeeperf@demo.com |
| | Customer | customermulti@demo.com | customerperf@demo.com |
| **Command** | Admin | companycmd@demo.com | companycmd@demo.com (no change) |
| | Employee | employeecmd@demo.com | employeecmd@demo.com (no change) |
| | Customer | customercmd@demo.com | customercmd@demo.com (no change) |

## Implementation Steps

### Step 1: Database Migration
Update emails in both `auth.users` and `profiles` tables, plus update the `full_name` fields to use consistent naming.

The migration will:
- Update 18 email addresses (Command tier stays the same)
- Update corresponding full names (e.g., "Express Demo Admin" becomes "Starter Demo Admin")

### Step 2: Update DemoAccounts.tsx
Update the `demoAccounts` array to display the new email addresses that match the database.

## Files to Change

| File | Change |
|------|--------|
| Database Migration | Update `auth.users.email`, `profiles.email`, and `profiles.full_name` |
| `src/pages/DemoAccounts.tsx` | Update `demoAccounts` array with new emails |

## Technical Details

```text
Database Changes (SQL Migration):
+----------------------------------+
|  auth.users table                |
|  - Update email column           |
|  - Update raw_user_meta_data     |
+----------------------------------+
           |
           v
+----------------------------------+
|  profiles table                  |
|  - Update email column           |
|  - Update full_name column       |
+----------------------------------+
```

### SQL Migration Summary
- 18 UPDATE statements for `auth.users` (6 tiers x 3 roles, excluding Command)
- 18 UPDATE statements for `profiles` (matching changes)

## Result
After implementation:
- All demo accounts will have emails matching the tier names
- Users can log in using the new email addresses (e.g., `companystarter@demo.com`)
- Password remains unchanged: `aidemo*!`
- The Demo Accounts page will display the correct credentials
