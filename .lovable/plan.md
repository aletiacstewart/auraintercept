
# Demo Accounts Setup Plan for Aura Halo and Aura Express

## Overview
Create demo company accounts for the **Aura Halo** ($397/mo) and **Aura Express** ($197/mo) tiers, following the existing demo account pattern used for Solo, Multi, and Command tiers.

## Current Demo Account Structure
| Tier | Company Email | Employee Email | Customer Email |
|------|--------------|----------------|----------------|
| Single-Point | companysolo@demo.com | employeesolo@demo.com | customersolo@demo.com |
| Multi-Track | companymulti@demo.com | employeemulti@demo.com | customermulti@demo.com |
| Command | companycmd@demo.com | employeecmd@demo.com | customercmd@demo.com |

## New Accounts to Create
| Tier | Company Email | Employee Email | Password |
|------|--------------|----------------|----------|
| **Aura Halo** | companyhalo@demo.com | employeehalo@demo.com | aidemo*! |
| **Aura Express** | companyxprs@demo.com | employeexprs@demo.com | aidemo*! |

---

## Implementation Tasks

### 1. Add Express Tier to Subscription Agent Config
**File:** `src/lib/subscriptionAgentConfig.ts`

The 'express' tier is missing from the agent configuration. This controls what agents and consoles are available in dashboards.

**Changes:**
- Update `SubscriptionTier` type to include `'express'`
- Add `express` configuration to `TIER_AGENT_CONFIG`:
  - Agents: `[]` (no AI automation agents - voice/chat only)
  - Consoles: `[]` (no consoles - uses smart link sharing)
  - Label: `'Aura Express'`
  - Price: `'$197/mo'`
  - Description: `'AI Voice & Chat for restaurants with smart link sharing'`
- Add `express` to `TIER_HIERARCHY` with value `1` (between free and core)
- Add `express` to `TIER_FEATURE_CONFIG` with basic features

### 2. Create Demo Companies in Database
**Method:** SQL Migration

Create two new company records:

**Demo Halo Company:**
```text
- Name: Demo Halo Company
- Slug: demo-halo
- Subscription Tier: halo
- Registration Code: auto-generated
```

**Demo Express Company:**
```text
- Name: Demo Express Company
- Slug: demo-xprs
- Subscription Tier: express
- Registration Code: auto-generated
```

### 3. Create Auth Users and Profiles
**Method:** Manual creation via Supabase Auth API or SQL

For each tier, create:
1. **Company Admin** user with `company_admin` role
2. **Employee** user with `employee` role
3. Link both to the respective company via `company_id` in profiles
4. Assign roles in `user_roles` table

**Accounts:**
| Email | Role | Company |
|-------|------|---------|
| companyhalo@demo.com | company_admin | Demo Halo Company |
| employeehalo@demo.com | employee | Demo Halo Company |
| companyxprs@demo.com | company_admin | Demo Express Company |
| employeexprs@demo.com | employee | Demo Express Company |

### 4. Dashboard Filtering Verification
The existing tier-based filtering will automatically apply based on `subscription_tier`:

**Aura Halo Features:**
- AI Receptionist (triage agent)
- Scheduling Agent (booking agent)
- Follow-up Agent
- Message Aura (Text)
- Talk to Aura (Voice)
- Customer Portal Console

**Aura Express Features:**
- Message Aura (Text)
- Talk to Aura (Voice)
- Smart Link Sharing
- No AI automation agents
- No consoles (widget-based only)

---

## Technical Details

### Tier Hierarchy Update
```text
free: 0
express: 1  ← NEW
halo: 2     ← Already exists
core: 3
single_point: 4
multi_track: 5
command: 6
```

### Required File Changes
1. `src/lib/subscriptionAgentConfig.ts` - Add express tier configuration
2. Database migration - Create companies and user accounts

### Security Considerations
- Passwords will be set via Supabase Auth (hashed automatically)
- RLS policies already restrict data to company scope
- Role assignments in `user_roles` table for proper access control

---

## Execution Order
1. Update `subscriptionAgentConfig.ts` to add express tier
2. Run database migration to create companies
3. Create auth users via edge function or Supabase dashboard
4. Create profile records linked to companies
5. Assign roles in user_roles table
6. Test login and dashboard filtering for each account
