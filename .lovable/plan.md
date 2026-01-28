
# Company-Level Subscription Implementation Plan

## Overview
Update the subscription system so that **companies** are the subscription entities, not individual users. Employees and customers of subscribed companies receive free access based on their company's subscription tier.

---

## Current State Analysis

### What Already Works
- `companies` table has `subscription_tier`, `stripe_customer_id`, and `trial_ends_at` columns
- `profiles.company_id` links users to their company
- `user_roles` table properly separates roles: `platform_admin`, `company_admin`, `employee`, `customer`
- `check-subscription` already reads and updates `company.subscription_tier`

### What Needs Fixing
1. **Stripe Customer Lookup**: Currently uses user email instead of company's Stripe customer ID
2. **Checkout Access**: Any authenticated user can subscribe, not just company admins
3. **Customer/Employee Handling**: Edge functions don't distinguish that these roles get free access through their company

---

## Implementation Steps

### Step 1: Update `check-subscription` Edge Function

**File**: `supabase/functions/check-subscription/index.ts`

**Changes**:
- For `company_admin` users: Look up Stripe subscription using `company.stripe_customer_id` (if exists) or by company admin email as fallback
- For `employee` users: Skip Stripe lookup entirely, inherit subscription from `company.subscription_tier`
- For `customer` users: Look up their associated company via `customer_company_associations` and inherit that company's tier
- For `platform_admin`: Continue granting full access (command tier)

```text
Logic Flow:
+------------------+
| Get User & Role  |
+------------------+
        |
        v
+------------------+     Yes     +----------------------+
| platform_admin?  |------------>| Return command tier  |
+------------------+             +----------------------+
        | No
        v
+------------------+
| Get user's       |
| company_id       |
+------------------+
        |
        v
+------------------+     Yes     +----------------------+
| employee role?   |------------>| Return company tier  |
+------------------+             | (no Stripe lookup)   |
        | No                     +----------------------+
        v
+------------------+     Yes     +-----------------------------+
| customer role?   |------------>| Lookup associated company   |
+------------------+             | Return company tier         |
        | No                     +-----------------------------+
        v
+------------------+
| company_admin    |
| Lookup Stripe by |
| stripe_customer_id
+------------------+
        |
        v
+----------------------+
| Update company tier  |
| Return subscription  |
+----------------------+
```

### Step 2: Update `create-checkout` Edge Function

**File**: `supabase/functions/create-checkout/index.ts`

**Changes**:
- Add role check: Only `company_admin` can initiate checkout
- Use company's `stripe_customer_id` if it exists, otherwise create a new Stripe customer and save the ID to the company record
- Pass `company_id` in session metadata for proper association

**Key Code Changes**:
```typescript
// 1. Verify user is company_admin
const { data: roleData } = await supabaseClient
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (roleData?.role !== 'company_admin') {
  throw new Error('Only company administrators can manage subscriptions');
}

// 2. Get company and its Stripe customer ID
const { data: profileData } = await supabaseClient
  .from('profiles')
  .select('company_id')
  .eq('id', user.id)
  .single();

const { data: companyData } = await supabaseClient
  .from('companies')
  .select('id, name, email, stripe_customer_id')
  .eq('id', profileData.company_id)
  .single();

// 3. Use existing Stripe customer or create new one for COMPANY
let customerId = companyData.stripe_customer_id;
if (!customerId) {
  const customer = await stripe.customers.create({
    name: companyData.name,
    email: companyData.email || user.email,
    metadata: { company_id: companyData.id }
  });
  customerId = customer.id;
  
  // Save to company record
  await supabaseClient
    .from('companies')
    .update({ stripe_customer_id: customerId })
    .eq('id', companyData.id);
}

// 4. Create checkout with company's Stripe customer
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  // ... rest of config
  metadata: {
    company_id: companyData.id,
    tier: requestedTier,
  },
});
```

### Step 3: Update Subscription UI Page

**File**: `src/pages/Subscription.tsx`

**Changes**:
- Import `useAuth` and check `userRole`
- Show "Subscribe" buttons only for `company_admin` users
- Show informational message for employees: "Your company's subscription: [tier]"
- Show informational message for customers: "You have free access through [company name]"

**UI Behavior by Role**:
| Role | See Tier Cards | Subscribe Buttons | Manage Button |
|------|----------------|-------------------|---------------|
| company_admin | Yes | Yes | Yes |
| employee | Yes (read-only) | No - "Contact your admin" | No |
| customer | Basic info | No | No |
| platform_admin | Yes | No (full access) | No |

### Step 4: Update AuthContext Subscription Logic

**File**: `src/contexts/AuthContext.tsx`

**Changes**:
- Update `SubscriptionTier` type to include all 5 tiers: `'free' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command'`
- Remove the old `PRODUCT_TO_TIER` mapping (handled in edge function now)
- Trust the `tier` value returned from `check-subscription` directly

### Step 5: Update `stripe-customer-portal` Edge Function

**File**: `supabase/functions/stripe-customer-portal/index.ts`

**Changes**:
- Add same role check as checkout: only `company_admin` can access
- Use `company.stripe_customer_id` instead of looking up by email

---

## Technical Details

### Database Queries Needed

**For employees** (in check-subscription):
```sql
-- Get company subscription tier directly
SELECT c.subscription_tier, c.trial_ends_at 
FROM companies c
JOIN profiles p ON p.company_id = c.id
WHERE p.id = :user_id;
```

**For customers** (in check-subscription):
```sql
-- Get associated company's tier
SELECT c.subscription_tier, c.trial_ends_at, c.name
FROM companies c
JOIN customer_company_associations cca ON cca.company_id = c.id
WHERE cca.customer_user_id = :user_id
LIMIT 1;
```

### Error Messages

| Scenario | Error Message |
|----------|---------------|
| Employee tries to subscribe | "Only company administrators can manage subscriptions" |
| Customer tries to subscribe | "Customers cannot subscribe directly. Contact the company for access." |
| No company association | "Your account is not associated with a company" |

---

## Files to Modify

1. `supabase/functions/check-subscription/index.ts` - Major refactor for role-based logic
2. `supabase/functions/create-checkout/index.ts` - Add role check, use company Stripe ID
3. `supabase/functions/stripe-customer-portal/index.ts` - Add role check, use company Stripe ID
4. `src/pages/Subscription.tsx` - Conditional UI based on role
5. `src/contexts/AuthContext.tsx` - Update tier type, simplify mapping

---

## Testing Scenarios

1. **Company Admin subscribes**: Creates Stripe customer for company, associates subscription
2. **Employee checks subscription**: Gets company's tier without Stripe API call
3. **Customer checks subscription**: Gets associated company's tier
4. **Employee tries to subscribe**: Sees disabled buttons with admin contact message
5. **Company upgrades tier**: All employees immediately see new tier on next refresh
