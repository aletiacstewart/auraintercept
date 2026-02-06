

# Demo Accounts Full Rename Plan

## Current State

### 7 Demo Companies in Database
| Current Name | Current Tier | Company ID | Business Type |
|--------------|--------------|------------|---------------|
| Demo Flow Company | free | b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f | Personal Assistant |
| Demo Core Company | core | c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a | Real Estate |
| Demo Express Company | express | d4a6c195-c89a-4208-a818-981902af6c51 | Restaurant |
| Demo Halo Company | halo | 56c0a3a8-a2a1-4689-9c18-d115080a816d | Nail & Hair Salon |
| Demo Solo Company | single_point | 8fafcec0-4b2a-45a1-8663-f9ccb5afc545 | HVAC |
| Demo Multi Company | multi_track | 4f85ed98-0e98-480c-b904-1c33424e26ad | Plumbing |
| Demo Command Company | command | 298a7275-0a1f-4bd8-a0ae-b692fdbcd3af | Electrical |

### Edge Function Issue
The `create-demo-accounts` edge function only has 5 companies defined (missing Flow and Core). It creates 15 accounts total but should create 21 accounts (7 tiers × 3 account types).

---

## New Tier Mapping

| New Tier | Price | Old Tier | Company ID | Business Type |
|----------|-------|----------|------------|---------------|
| **Starter** | $197 | Express | d4a6c195-c89a-4208-a818-981902af6c51 | Restaurant |
| **Scheduling** | $397 | Halo | 56c0a3a8-a2a1-4689-9c18-d115080a816d | Nail & Hair Salon |
| **Growth** | $597 | Core | c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a | Real Estate |
| **Business** | $797 | Flow/Free | b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f | Personal Assistant |
| **Field Ops** | $1,497 | Single-Point | 8fafcec0-4b2a-45a1-8663-f9ccb5afc545 | HVAC |
| **Performance** | $3,497 | Multi-Track | 4f85ed98-0e98-480c-b904-1c33424e26ad | Plumbing |
| **Command** | $5,497 | Command | 298a7275-0a1f-4bd8-a0ae-b692fdbcd3af | Electrical |

---

## Complete Demo Accounts (21 Total)

### All Account Emails
| Tier | Company Admin | Employee | Customer |
|------|---------------|----------|----------|
| Starter | companystarter@demo.com | employeestarter@demo.com | customerstarter@demo.com |
| Scheduling | companysched@demo.com | employeesched@demo.com | customersched@demo.com |
| Growth | companygrowth@demo.com | employeegrowth@demo.com | customergrowth@demo.com |
| Business | companybiz@demo.com | employeebiz@demo.com | customerbiz@demo.com |
| Field Ops | companyfops@demo.com | employeefops@demo.com | customerfops@demo.com |
| Performance | companyperf@demo.com | employeeperf@demo.com | customerperf@demo.com |
| Command | companycmd@demo.com | employeecmd@demo.com | customercmd@demo.com |

**Password for all accounts:** `aidemo*!`

---

## Implementation Steps

### Step 1: Database Migration
Update company names and subscription tiers:

```sql
-- Update Demo Express → Demo Starter
UPDATE companies SET 
  name = 'Demo Starter Company',
  subscription_tier = 'starter',
  slug = 'demo-starter'
WHERE id = 'd4a6c195-c89a-4208-a818-981902af6c51';

-- Update Demo Halo → Demo Scheduling
UPDATE companies SET 
  name = 'Demo Scheduling Company',
  subscription_tier = 'scheduling',
  slug = 'demo-scheduling'
WHERE id = '56c0a3a8-a2a1-4689-9c18-d115080a816d';

-- Update Demo Core → Demo Growth
UPDATE companies SET 
  name = 'Demo Growth Company',
  subscription_tier = 'growth',
  slug = 'demo-growth'
WHERE id = 'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a';

-- Update Demo Flow → Demo Business
UPDATE companies SET 
  name = 'Demo Business Company',
  subscription_tier = 'business',
  slug = 'demo-business'
WHERE id = 'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f';

-- Update Demo Solo → Demo Field Ops
UPDATE companies SET 
  name = 'Demo Field Ops Company',
  subscription_tier = 'field_ops',
  slug = 'demo-fieldops'
WHERE id = '8fafcec0-4b2a-45a1-8663-f9ccb5afc545';

-- Update Demo Multi → Demo Performance
UPDATE companies SET 
  name = 'Demo Performance Company',
  subscription_tier = 'performance',
  slug = 'demo-performance'
WHERE id = '4f85ed98-0e98-480c-b904-1c33424e26ad';

-- Update Demo Command (keep name, just ensure tier)
UPDATE companies SET 
  subscription_tier = 'command',
  slug = 'demo-command'
WHERE id = '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af';
```

### Step 2: Update Edge Function
Update `supabase/functions/create-demo-accounts/index.ts`:

**Companies object:**
```typescript
const companies = {
  starter: 'd4a6c195-c89a-4208-a818-981902af6c51',
  scheduling: '56c0a3a8-a2a1-4689-9c18-d115080a816d',
  growth: 'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
  business: 'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
  field_ops: '8fafcec0-4b2a-45a1-8663-f9ccb5afc545',
  performance: '4f85ed98-0e98-480c-b904-1c33424e26ad',
  command: '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af',
};
```

**Accounts array (21 accounts):**
```typescript
const accounts = [
  // Company Admins (7)
  { email: 'companystarter@demo.com', name: 'Starter Demo Admin', role: 'company_admin', companyId: companies.starter },
  { email: 'companysched@demo.com', name: 'Scheduling Demo Admin', role: 'company_admin', companyId: companies.scheduling },
  { email: 'companygrowth@demo.com', name: 'Growth Demo Admin', role: 'company_admin', companyId: companies.growth },
  { email: 'companybiz@demo.com', name: 'Business Demo Admin', role: 'company_admin', companyId: companies.business },
  { email: 'companyfops@demo.com', name: 'Field Ops Demo Admin', role: 'company_admin', companyId: companies.field_ops },
  { email: 'companyperf@demo.com', name: 'Performance Demo Admin', role: 'company_admin', companyId: companies.performance },
  { email: 'companycmd@demo.com', name: 'Command Demo Admin', role: 'company_admin', companyId: companies.command },
  
  // Employees (7)
  { email: 'employeestarter@demo.com', name: 'Starter Demo Employee', role: 'employee', companyId: companies.starter },
  { email: 'employeesched@demo.com', name: 'Scheduling Demo Employee', role: 'employee', companyId: companies.scheduling },
  { email: 'employeegrowth@demo.com', name: 'Growth Demo Employee', role: 'employee', companyId: companies.growth },
  { email: 'employeebiz@demo.com', name: 'Business Demo Employee', role: 'employee', companyId: companies.business },
  { email: 'employeefops@demo.com', name: 'Field Ops Demo Employee', role: 'employee', companyId: companies.field_ops },
  { email: 'employeeperf@demo.com', name: 'Performance Demo Employee', role: 'employee', companyId: companies.performance },
  { email: 'employeecmd@demo.com', name: 'Command Demo Employee', role: 'employee', companyId: companies.command },
  
  // Customers (7)
  { email: 'customerstarter@demo.com', name: 'Starter Demo Customer', role: 'customer', companyId: companies.starter },
  { email: 'customersched@demo.com', name: 'Scheduling Demo Customer', role: 'customer', companyId: companies.scheduling },
  { email: 'customergrowth@demo.com', name: 'Growth Demo Customer', role: 'customer', companyId: companies.growth },
  { email: 'customerbiz@demo.com', name: 'Business Demo Customer', role: 'customer', companyId: companies.business },
  { email: 'customerfops@demo.com', name: 'Field Ops Demo Customer', role: 'customer', companyId: companies.field_ops },
  { email: 'customerperf@demo.com', name: 'Performance Demo Customer', role: 'customer', companyId: companies.performance },
  { email: 'customercmd@demo.com', name: 'Command Demo Customer', role: 'customer', companyId: companies.command },
];
```

### Step 3: Update DemoAccounts.tsx UI

**New demoAccounts array:**
```typescript
const demoAccounts = [
  {
    tier: 'Aura Starter',
    tierColor: 'bg-amber-500/20 text-amber-600',
    price: '$197/mo',
    companyAdmin: 'companystarter@demo.com',
    employee: 'employeestarter@demo.com',
    customer: 'customerstarter@demo.com',
    businessType: 'Restaurant',
    agents: 1,
    consoles: 0,
  },
  {
    tier: 'Aura Scheduling',
    tierColor: 'bg-rose-500/20 text-rose-600',
    price: '$397/mo',
    companyAdmin: 'companysched@demo.com',
    employee: 'employeesched@demo.com',
    customer: 'customersched@demo.com',
    businessType: 'Nail & Hair Salon',
    agents: 3,
    consoles: 1,
  },
  {
    tier: 'Aura Growth',
    tierColor: 'bg-cyan-500/20 text-cyan-600',
    price: '$597/mo',
    companyAdmin: 'companygrowth@demo.com',
    employee: 'employeegrowth@demo.com',
    customer: 'customergrowth@demo.com',
    businessType: 'Real Estate',
    agents: 11,
    consoles: 3,
  },
  {
    tier: 'Aura Business',
    tierColor: 'bg-gray-500/20 text-gray-600',
    price: '$797/mo',
    companyAdmin: 'companybiz@demo.com',
    employee: 'employeebiz@demo.com',
    customer: 'customerbiz@demo.com',
    businessType: 'Personal Assistant',
    agents: 12,
    consoles: 4,
  },
  {
    tier: 'Aura Field Ops',
    tierColor: 'bg-blue-500/20 text-blue-600',
    price: '$1,497/mo',
    companyAdmin: 'companyfops@demo.com',
    employee: 'employeefops@demo.com',
    customer: 'customerfops@demo.com',
    businessType: 'HVAC',
    agents: 18,
    consoles: 6,
  },
  {
    tier: 'Aura Performance',
    tierColor: 'bg-purple-500/20 text-purple-600',
    price: '$3,497/mo',
    companyAdmin: 'companyperf@demo.com',
    employee: 'employeeperf@demo.com',
    customer: 'customerperf@demo.com',
    businessType: 'Plumbing',
    agents: 22,
    consoles: 7,
  },
  {
    tier: 'Aura Command',
    tierColor: 'bg-emerald-500/20 text-emerald-600',
    price: '$5,497/mo',
    companyAdmin: 'companycmd@demo.com',
    employee: 'employeecmd@demo.com',
    customer: 'customercmd@demo.com',
    businessType: 'Electrical',
    agents: 24,
    consoles: 8,
  },
];
```

**New tierFeatures object:**
```typescript
const tierFeatures: Record<string, string[]> = {
  'Aura Starter': [
    'AI Receptionist (Triage)',
    'Talk to Aura (Voice)',
    'Message Aura (Text)',
    'Smart Link Sharing',
    'Lead Capture',
  ],
  'Aura Scheduling': [
    'All Starter features',
    'Scheduling Agent',
    'Follow-up Agent',
    'Customer Portal Console',
    'Calendar Integration',
  ],
  'Aura Growth': [
    'All Scheduling features',
    '11 AI Agents',
    'Outreach & Sales Console',
    'Social Media Console',
    'Marketing Automation',
  ],
  'Aura Business': [
    'All Growth features',
    '12 AI Agents',
    'Creative & Web Console',
    'Web Presence Agent',
    'Brand Management',
  ],
  'Aura Field Ops': [
    'All Business features',
    '18 AI Agents',
    'Field Operations Console',
    'Business Management Console',
    'Dispatch & Route Optimization',
  ],
  'Aura Performance': [
    'All Field Ops features',
    '22 AI Agents',
    'Analytics & Reports Console',
    'Insights & Performance Agents',
    'Business Intelligence',
  ],
  'Aura Command': [
    'All Performance features',
    '24 AI Agents (Full Suite)',
    'AI Operatives Hub Console',
    'Revenue & Forecast Agents',
    'Predictive Analytics',
  ],
};
```

---

## Files to Update

| File | Changes |
|------|---------|
| **Database** | Rename 7 companies, update subscription_tier values |
| `supabase/functions/create-demo-accounts/index.ts` | Add all 7 companies, expand to 21 accounts |
| `src/pages/DemoAccounts.tsx` | New tier names, prices, emails, features |

---

## Summary

| Component | Before | After |
|-----------|--------|-------|
| Demo Companies | 7 with old names | 7 with new tier names |
| Company Admin Accounts | 5 | 7 |
| Employee Accounts | 5 | 7 |
| Customer Accounts | 5 | 7 |
| **Total Demo Accounts** | **15** | **21** |

### Final Account Structure
```text
7 Tiers × 3 Account Types = 21 Demo Accounts

Starter ($197):      companystarter@demo.com, employeestarter@demo.com, customerstarter@demo.com
Scheduling ($397):   companysched@demo.com, employeesched@demo.com, customersched@demo.com
Growth ($597):       companygrowth@demo.com, employeegrowth@demo.com, customergrowth@demo.com
Business ($797):     companybiz@demo.com, employeebiz@demo.com, customerbiz@demo.com
Field Ops ($1,497):  companyfops@demo.com, employeefops@demo.com, customerfops@demo.com
Performance ($3,497): companyperf@demo.com, employeeperf@demo.com, customerperf@demo.com
Command ($5,497):    companycmd@demo.com, employeecmd@demo.com, customercmd@demo.com

All accounts use password: aidemo*!
```

