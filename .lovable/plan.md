
# Create Social-Marketing Console & Mobile App Menu Category

## Overview
Create a new sidebar menu category called "Social-Marketing Console & Mobile App" and move the Social Media Signal Ops and Outreach & Sales Ops consoles under it, separating them from the Business Management section.

## Current State
The "Business Mgt Console & Mobile App" category currently contains 5 items:
- Business Mgt Ops Console
- Business Mgt Ops Install
- Analytics & Reports Ops
- Outreach & Sales Ops ← will move
- Social Media Signal Ops ← will move

## New Structure

**Business Mgt Console & Mobile App** (3 items):
- Business Mgt Ops Console
- Business Mgt Ops Install
- Analytics & Reports Ops

**Social-Marketing Console & Mobile App** (2 items):
- Outreach & Sales Ops
- Social Media Signal Ops

---

## Technical Changes

### File: `src/components/dashboard/DashboardLayout.tsx`

**1. Update "Business Mgt Console & Mobile App" group (lines 96-106):**
Remove the two social/marketing items, keeping only:
```typescript
{
  label: 'Business Mgt Console & Mobile App',
  requiredTier: 'command',
  items: [
    { label: 'Business Mgt Ops Console', icon: Briefcase, href: '/dashboard/ai-consoles/business-mgt-ops', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['billing_specialist'], featureColor: 'text-feature-platform', requiredTier: 'command' },
    { label: 'Business Mgt Ops Install', icon: Smartphone, href: '/dashboard/business-mgt-ops-install', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
    { label: 'Analytics & Reports Ops', icon: BarChart3, href: '/dashboard/ai-consoles/analytics', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
  ],
},
```

**2. Add new "Social-Marketing Console & Mobile App" group after Business Mgt:**
```typescript
{
  label: 'Social-Marketing Console & Mobile App',
  requiredTier: 'command',
  items: [
    { label: 'Outreach & Sales Ops', icon: Megaphone, href: '/dashboard/ai-consoles/marketing-sales', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
    { label: 'Social Media Signal Ops', icon: Share2, href: '/dashboard/ai-consoles/social-media', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
  ],
},
```

---

## Result

| Sidebar Section | Items |
|-----------------|-------|
| Business Mgt Console & Mobile App | Business Mgt Ops Console, Install, Analytics & Reports Ops |
| Social-Marketing Console & Mobile App | Outreach & Sales Ops, Social Media Signal Ops |

## Benefits
- Clearer separation of business operations vs marketing/social functions
- Logical grouping of outreach and social media tools together
- Easier navigation for users focused on marketing activities
