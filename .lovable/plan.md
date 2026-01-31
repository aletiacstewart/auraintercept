

# Platform-Wide Audit: Updates & Enhancements Required

## Executive Summary
This audit identified **12 critical issues** across pricing, documentation, agent configuration, and feature naming that need immediate attention to ensure platform consistency.

---

## Critical Issues Found

### 1. PRICING INCONSISTENCIES (HIGH PRIORITY)

| Location | Current (Wrong) | Correct Value |
|----------|-----------------|---------------|
| `landing-chat/index.ts` | Single-Point $497/mo | $1,500/mo |
| `landing-chat/index.ts` | Multi-Track $897/mo | $3,997/mo |
| `trial-reminders/index.ts` | "Starting at $497/month" | "Starting at $197/month" |
| `subscriptionAgentConfig.ts` | Single-Point $497/mo | $1,500/mo |
| `subscriptionAgentConfig.ts` | Multi-Track $897/mo | $3,997/mo |

**Files to Update:**
- `supabase/functions/landing-chat/index.ts` (lines 17-18)
- `supabase/functions/trial-reminders/index.ts` (lines 264, 308)
- `src/lib/subscriptionAgentConfig.ts` (lines 52, 64)

---

### 2. EMPLOYEE COUNT INCONSISTENCIES

| Tier | documentationConfig.ts | Subscription.tsx | Correct |
|------|------------------------|------------------|---------|
| Halo | 3 employees | 2 employees | 3 employees |

**Files to Update:**
- `src/pages/Subscription.tsx` - `TIER_EMPLOYEE_LIMITS` (line 187)

---

### 3. AGENT NAMING DISCREPANCIES

The landing page `Index.tsx` Marketing section lists different agents than `documentationConfig.ts`:

| Index.tsx | documentationConfig.ts | Resolution |
|-----------|----------------------|------------|
| Lead Agent | Campaign Agent | Keep both - Lead Agent exists |
| Promo Agent | Marketing Agent | Standardize to Marketing Agent per memory |
| Campaign Agent | - | Already present |

**Recommendation:** Update `documentationConfig.ts` to include all 3 Marketing agents (Campaign, Lead/Marketing, Promo) to match the Index.tsx definitions.

---

### 4. MISSING TIER INFORMATION IN LANDING CHAT

The `landing-chat/index.ts` system prompt is missing:
- Aura Express ($197/mo) - Restaurants tier
- Aura Halo ($397/mo) - Salons/Wellness tier
- Aura Core ($500/mo) - AI-Assisted tools tier

**File to Update:**
- `supabase/functions/landing-chat/index.ts` - Add all 6 tiers to pricing section

---

### 5. NEW FEATURES NOT DOCUMENTED

Recently added AI automation features need documentation:
- **Knowledge Base AI Generator** (just added)
- **Campaign Series Generator** (just added)
- **SMS Template AI Generation** (just added)
- **Quote/Invoice Line Item AI** (just added)

**Files to Update:**
- `src/pages/Help.tsx` - Add new feature documentation
- `src/pages/PlatformGuides.tsx` - Add guides for new AI generators

---

## Files Requiring Updates

### Edge Functions (Deploy Required)

| File | Changes |
|------|---------|
| `supabase/functions/landing-chat/index.ts` | Update all pricing, add Express/Halo/Core tiers |
| `supabase/functions/trial-reminders/index.ts` | Update CTA pricing from $497 to $197 |

### Frontend Configuration

| File | Changes |
|------|---------|
| `src/lib/subscriptionAgentConfig.ts` | Update Single-Point to $1,500, Multi-Track to $3,997 |
| `src/lib/documentationConfig.ts` | Verify agent counts match, update Marketing agents |
| `src/lib/helpContentConfig.ts` | Add new AI generation features |

### Pages

| File | Changes |
|------|---------|
| `src/pages/Subscription.tsx` | Fix Halo employee limit (2 to 3) |
| `src/pages/Help.tsx` | Add documentation for new AI generators |
| `src/pages/PlatformGuides.tsx` | Add guides for Knowledge Base AI, Campaign Series |

---

## Detailed Changes

### 1. Update `landing-chat/index.ts` System Prompt

```
Pricing Tiers (6 Total):
- Aura Express ($197/mo): AI Voice & Chat for restaurants, smart link sharing, 2 employees
- Aura Halo ($397/mo): 4 AI operatives for salons/wellness, Customer Portal, 3 employees
- Aura Core ($500/mo): AI-assisted tools only (no automation), Social Media Signal, Web Presence, 2 employees
- Single-Point ($1,500/mo): 3 AI operatives, 1 console, lead intake & reputation, 5 employees
- Multi-Track ($3,997/mo): 10 AI operatives, 2 consoles, field operations + booking, 10 employees
- Pro Command ($5,997/mo): All 23 AI operatives, 7 consoles, enterprise automation, 25 employees
```

### 2. Update `subscriptionAgentConfig.ts` Prices

```typescript
single_point: {
  // ...
  label: 'Single-Point',
  price: '$1,500/mo',  // Was $497/mo
  // ...
},
multi_track: {
  // ...
  label: 'Multi-Track',
  price: '$3,997/mo',  // Was $897/mo
  // ...
},
```

### 3. Update `Subscription.tsx` Employee Limits

```typescript
export const TIER_EMPLOYEE_LIMITS: Record<string, number> = {
  halo: 3,  // Was 2
  core: 2,
  single_point: 5,
  multi_track: 10,
  command: 25,
};
```

### 4. Update `trial-reminders/index.ts` CTA

Change "Starting at $497/month" to "Starting at $197/month" (Aura Express is now lowest tier)

---

## Recommended Enhancements

### A. Help Page Updates
Add new sections for:
1. **AI Content Generation** - SMS templates, quote/invoice line items
2. **Knowledge Base AI Generator** - How to batch-generate FAQs, services, hours
3. **Campaign Series Generator** - Multi-week coordinated email/SMS campaigns

### B. Platform Guides Updates
Add new guides:
1. "Using AI to Generate Knowledge Base Content" (5 min)
2. "Creating Multi-Week Campaign Series" (8 min)
3. "AI-Powered Line Item Descriptions" (3 min)

### C. Landing Page Chat Enhancement
Update the landing page chat AI to know about:
- New AI generation capabilities
- All 6 subscription tiers with accurate pricing
- Industry-specific packages (Express for restaurants, Halo for salons)

---

## Implementation Order

1. **Phase 1: Critical Pricing Fixes** (Immediate)
   - Update `landing-chat/index.ts`
   - Update `trial-reminders/index.ts`
   - Update `subscriptionAgentConfig.ts`
   - Update `Subscription.tsx` employee limits

2. **Phase 2: Documentation Updates** (Next)
   - Update `Help.tsx` with new features
   - Update `PlatformGuides.tsx` with new guides
   - Verify `documentationConfig.ts` agent consistency

3. **Phase 3: Edge Function Deployment**
   - Deploy updated `landing-chat`
   - Deploy updated `trial-reminders`

---

## Summary Table

| Category | Issues Found | Priority |
|----------|--------------|----------|
| Pricing Inconsistencies | 5 locations | Critical |
| Employee Count Mismatch | 1 location | High |
| Agent Naming | 2 locations | Medium |
| Missing Tier Info | 1 location | Medium |
| Missing Feature Docs | 4 features | Medium |
| **Total** | **13 items** | - |

