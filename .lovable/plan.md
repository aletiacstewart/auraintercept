

# Fix Customer Portal to Match Dashboard Console

## Problem

There are two completely different customer portal implementations:

1. **Dashboard version** (at `/dashboard/ai-consoles/customer-portal`) -- Uses the `AIAgentConsole` component with a company selector dropdown. This is the correct one you designed.

2. **Public version** (at `/customer-portal`) -- Uses a separate `CustomerPortalHome.tsx` page with company cards, search bar, "How to Use" section, favorites, etc. This is a different design that was NOT intended.

When a customer clicks "Customer Portal" from the homepage, they get routed to the public version (#2), which looks completely different from what you see in the dashboard (#1).

Additionally, when a customer clicks a company on that page, they go to `/customer-portal/:companySlug` which renders `UnifiedCustomerConsole` -- yet another different component from the dashboard's `AIAgentConsole`.

## Solution

Replace the public customer portal pages to use the **same `AIAgentConsole` component** that the dashboard uses, with company selection enabled. This ensures customers see the exact same console experience.

### Changes

**1. Rewrite `CustomerPortalHome.tsx`** (the `/customer-portal` route)
- Remove the custom card-based company browser UI
- Instead, render the `AIAgentConsole` component with `allowCompanySelection={true}`
- Keep basic customer auth check and sign-out button
- This makes the public portal identical to the dashboard's "Customer View"

**2. Update `CustomerCompanyPortal.tsx`** (the `/customer-portal/:companySlug` route)
- Remove the extra header ("DEMO STARTER COMPANY / Customer Portal")
- Switch from `UnifiedCustomerConsole` to `AIAgentConsole` with the resolved `companyId` pre-selected
- This ensures clicking a company link also shows the same console

**3. No database or backend changes needed** -- both components already fetch data through the same queries.

### Result

```text
BEFORE (3 different UIs):
  Dashboard:           AIAgentConsole (with company selector)
  /customer-portal:    CustomerPortalHome (cards, search, favorites)
  /customer-portal/x:  UnifiedCustomerConsole (different chat UI)

AFTER (1 unified UI):
  Dashboard:           AIAgentConsole (with company selector)
  /customer-portal:    AIAgentConsole (with company selector)
  /customer-portal/x:  AIAgentConsole (pre-selected company)
```

