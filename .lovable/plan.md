

# Consolidate Web Presence Console under Social-Marketing Console

## Summary
Move Web Presence Manager and Blog Management from a separate sidebar category into the "Social-Marketing Console & Mobile App" category. This maintains 7 consoles while keeping the Web Presence Agent as the 24th operative.

---

## Current Structure

```text
Sidebar Categories:
├── Social-Marketing Console & Mobile App
│   ├── Outreach & Sales Ops
│   └── Social Media Signal Ops
├── Web Presence (SEPARATE)
│   ├── Web Presence Manager
│   └── Blog Management
```

## Proposed Structure

```text
Sidebar Categories:
├── Social-Marketing Console & Mobile App
│   ├── Outreach & Sales Ops
│   ├── Social Media Signal Ops
│   ├── Web Presence Manager (MOVED)
│   └── Blog Management (MOVED)
```

---

## Changes Required

### 1. Sidebar Navigation (DashboardLayout.tsx)

**File:** `src/components/dashboard/DashboardLayout.tsx`

Move the Web Presence items from their own category into the "Social-Marketing Console" category:

**Before (lines 95-100, 111-118):**
```typescript
{
  label: 'Web Presence',
  items: [
    { label: 'Web Presence Manager', ... },
    { label: 'Blog Management', ... },
  ],
},
...
{
  label: 'Social-Marketing Console & Mobile App',
  items: [
    { label: 'Outreach & Sales Ops', ... },
    { label: 'Social Media Signal Ops', ... },
  ],
},
```

**After:**
```typescript
{
  label: 'Social-Marketing Console & Mobile App',
  requiredTier: 'command',
  items: [
    { label: 'Outreach & Sales Ops', ... },
    { label: 'Social Media Signal Ops', ... },
    { label: 'Web Presence Manager', icon: Globe, href: '/dashboard/smart-website', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config', requiredTier: 'command' },
    { label: 'Blog Management', icon: FileText, href: '/dashboard/blog-management', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config', requiredTier: 'command' },
  ],
},
// Remove the separate 'Web Presence' category entirely
```

---

### 2. Console Configuration (documentationConfig.ts)

**File:** `src/lib/documentationConfig.ts`

Update the CONSOLES array to consolidate web_presence under social_media:

**Changes:**
- Modify `social_media` console to include Web Presence tabs and increase agent count to 4
- Remove `content_engine` as a separate console (it's a feature within Social Media Signal Ops)
- Keep console count at 7

**Updated social_media console definition:**
```typescript
{
  id: 'social_media',
  name: 'Social Media Signal Ops & Web Presence',
  description: 'AI-powered social media signal management, web presence builder, and blog management with content creation for 6 platforms.',
  tier: 'command',
  agentCount: 4,  // social_content, social_scheduler, social_analytics, web_presence
  tabs: ['Social Posts', 'Content Engine', 'Web Presence', 'Blog', 'Calendar'],
  color: 'pink',
},
```

**Remove content_engine console (lines 562-570)** - Content Engine is already embedded in Social Media Signal Ops

---

### 3. Subscription Agent Config (subscriptionAgentConfig.ts)

**File:** `src/lib/subscriptionAgentConfig.ts`

Update console arrays to reflect the consolidation:

**Before (line 96):**
```typescript
consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'analytics_reports', 'content_engine', 'web_presence'],
```

**After:**
```typescript
consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'analytics_reports', 'ai_operatives_hub'],
```

Update `CONSOLE_REQUIRED_AGENTS` to merge web_presence into social_media:
```typescript
social_media: ['social_content', 'web_presence'],  // Add web_presence here
// Remove: web_presence: ['web_presence'],
// Remove: content_engine: ['creative'],
```

---

### 4. AI Operatives Hub (AIAgentsHub.tsx)

**File:** `src/pages/AIAgentsHub.tsx`

Move the web_presence agent from its own category into social_media:

**Update AI_OPERATIVES in documentationConfig.ts:**
Change `console: 'web_presence'` to `console: 'social_media'` for the web_presence agent (line 476)

**Update CATEGORY_INFO** - Remove web_presence and content_engine categories, keep agents under social_media

---

### 5. Platform Stats (documentationConfig.ts)

**File:** `src/lib/documentationConfig.ts`

Update `PLATFORM_STATS.totalConsoles` from 8 to 7:
```typescript
export const PLATFORM_STATS = {
  totalOperatives: 24,
  totalConsoles: 7,  // Keep at 7
  ...
};
```

---

## Final Console Structure (7 Consoles)

| # | Console ID | Console Name | Agents |
|---|------------|--------------|--------|
| 1 | customer_portal | Customer Portal | 4 (triage, booking, followup, review) |
| 2 | field_operations | Field Operations | 4 (dispatch, route, eta, checkin) |
| 3 | business_management | Business Operations | 4 (admin, quoting, invoice, inventory) |
| 4 | marketing_sales | Outreach & Sales Ops | 3 (campaign, lead, marketing) |
| 5 | social_media | Social Media & Web Presence | 5 (social_content, social_scheduler, social_analytics, creative, web_presence) |
| 6 | analytics_reports | Analytics & Reports | 4 (insights, performance, revenue, forecast) |
| 7 | ai_operatives_hub | AI Operatives Hub | 0 (management only) |

**Total: 24 AI Operatives across 7 Consoles**

---

## Files to Modify

1. `src/components/dashboard/DashboardLayout.tsx` - Move sidebar items
2. `src/lib/documentationConfig.ts` - Update console definitions and move agents
3. `src/lib/subscriptionAgentConfig.ts` - Update console arrays
4. `src/pages/AIAgentsHub.tsx` - Update category mappings

---

## What Stays the Same

- 24 AI Operatives total (no change)
- Web Presence Manager page still accessible at `/dashboard/smart-website`
- Blog Management still accessible at `/dashboard/blog-management`
- All agent functionality remains unchanged
- Only the organizational grouping changes

