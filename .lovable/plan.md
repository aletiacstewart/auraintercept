
# Documentation, Guides & Dashboard Sync Plan

## Overview

Following the pricing restructure and agent redistribution (Option C), multiple documentation files, guides, PDFs, and help content need to be updated to reflect:

1. **New Pricing Structure** (6 tiers changed)
2. **Agent Redistribution** (Performance: 22 agents, Command: 24 agents)
3. **Console Access Updates** (Performance: 7 consoles, Command: 8 consoles)
4. **Tier Name Updates** (using new tier names: Starter, Scheduling, Growth, Business, Field Ops, Performance, Command)

---

## Files Requiring Updates

### Category 1: Configuration Files (Source of Truth)

These files were already updated in the previous implementation, but we need to verify consistency:

| File | Status | Notes |
|------|--------|-------|
| `src/lib/subscriptionAgentConfig.ts` | Updated | New prices and agent arrays |
| `src/lib/documentationConfig.ts` | Updated | SUBSCRIPTION_TIERS and AI_OPERATIVES |

### Category 2: PDF Documentation (13 files)

| File | Updates Needed |
|------|----------------|
| `src/components/documentation/PricingSummaryPDF.tsx` | Pulls from documentationConfig - should auto-update |
| `src/components/documentation/AIAgentGuidesPDF.tsx` | Pulls from SUBSCRIPTION_TIERS - should auto-update |
| `src/components/documentation/ComprehensiveGuidesPDF.tsx` | **Hardcoded pricing** at lines 219-230 |
| `src/components/documentation/CompanyGuidesPDF.tsx` | May have hardcoded tier info |
| `src/components/documentation/PlatformDocumentPDF.tsx` | Pulls from config - verify |
| `src/components/documentation/PlatformFAQPDF.tsx` | Pulls from config - verify |
| `src/components/documentation/SalesPitchDataPDF.tsx` | May have hardcoded pricing |
| `src/components/documentation/WebsiteCopyPDF.tsx` | May have hardcoded tier descriptions |
| `src/components/documentation/BrandAssetGuidePDF.tsx` | May have tier references |
| `src/components/documentation/VideoScriptsPDF.tsx` | May have pricing in scripts |
| `src/components/documentation/SocialMediaContentPackPDF.tsx` | May have promotional content |
| `src/components/documentation/IndustryMarketingKitPDF.tsx` | May have pricing references |
| `src/components/documentation/CompanyOnboardingPDF.tsx` | May have tier options |

### Category 3: Dashboard & UI Components (5 files)

| File | Updates Needed |
|------|----------------|
| `src/pages/PlatformGuides.tsx` | **Hardcoded pricing** at lines 120-131 |
| `src/pages/Auth.tsx` | **Hardcoded pricing** at lines 722-942 |
| `src/components/agents/TierComparisonCards.tsx` | **Hardcoded pricing** at lines 294-327 |
| `src/components/help/AIHelpCenter.tsx` | **Hardcoded pricing** in SYSTEM_PROMPT at line 77 |

### Category 4: Feature Gating & Access Control (Already Correct)

| File | Status |
|------|--------|
| `src/components/subscription/FeatureGate.tsx` | Uses subscriptionAgentConfig - OK |
| `src/hooks/useSubscription.ts` | Uses tier config - OK |

---

## Detailed Changes

### 1. ComprehensiveGuidesPDF.tsx (Lines 219-230)

**Current (Outdated):**
```text
'Aura Express ($197/mo): AI Voice + Chat for restaurants...'
'Aura Flow ($297/mo): AI Personal Assistant...'
'Aura Halo ($397/mo): 3 AI Operatives for salons...'
'Aura Core ($500/mo): AI-Assisted (No Automation)...'
'Single-Point ($1,500/mo): 3 AI Operatives...'
'Multi-Track ($3,997/mo): 10 AI Operatives...'
'Aura Pro Command ($5,997/mo): All 24 AI Operatives...'
```

**Updated:**
```text
'Aura Starter ($197/mo): AI Receptionist for 24/7 lead capture'
'Aura Scheduling ($397/mo): AI booking with calendar sync + Customer Portal'
'Aura Growth ($597/mo): 11 AI Operatives + Marketing Automation'
'Aura Business ($797/mo): 12 AI Operatives + Web Presence'
'Aura Field Ops ($1,497/mo): 18 AI Operatives + Field Operations'
'Aura Performance ($3,497/mo): 22 AI Operatives + Analytics & Reports'
'Aura Command ($5,497/mo): All 24 AI Operatives + AI Operatives Hub'
```

### 2. PlatformGuides.tsx (Lines 120-131)

Same updates as ComprehensiveGuidesPDF - the guide content needs to match.

### 3. Auth.tsx (Lines 722-942)

Update the tier selection cards during signup:
- Scheduling: $297 to $397
- Growth: $397 to $597
- Business: $500 to $797
- Field Ops: $1,500 to $1,497
- Performance: $3,997 to $3,497
- Command: $5,997 to $5,497

### 4. TierComparisonCards.tsx (Lines 294-327)

Update the upgrade summary bar with new prices:
```text
Express $197 → Flow $397 → Halo $597 → Core $797 → Single-Point $1,497 → Multi-Track $3,497 → Command $5,497
```

Also update the `upgradeFrom` price differences in the card props.

### 5. AIHelpCenter.tsx (Line 77)

Update the SYSTEM_PROMPT with correct pricing:
```text
4. **Subscription Tiers**: Starter ($197), Scheduling ($397), Growth ($597), Business ($797), Field Ops ($1,497), Performance ($3,497), Command ($5,497)
```

---

## Agent/Console Distribution Updates

Files need to reflect the correct agent counts per tier:

| Tier | Agents | Consoles | Key Change |
|------|--------|----------|------------|
| Starter | 1 | 0 | No change |
| Scheduling | 3 | 1 | No change |
| Growth | 11 | 3 | No change |
| Business | 12 | 4 | No change |
| Field Ops | 18 | 6 | No change |
| Performance | **22** | 7 | Excludes revenue, forecast |
| Command | 24 | 8 | Full suite + AI Operatives Hub |

### Analytics Agent Access

- **Performance ($3,497)**: Gets `insights` + `performance` agents (basic analytics)
- **Command ($5,497)**: Gets all 4 analytics agents (`insights`, `performance`, `revenue`, `forecast`)

---

## Implementation Order

### Phase 1: UI Components (High Visibility)
1. `src/pages/Auth.tsx` - Signup flow pricing
2. `src/pages/PlatformGuides.tsx` - User-facing guides
3. `src/components/agents/TierComparisonCards.tsx` - Agent hub comparison
4. `src/components/help/AIHelpCenter.tsx` - AI help system prompt

### Phase 2: PDF Documents
5. `src/components/documentation/ComprehensiveGuidesPDF.tsx`
6. Review and update remaining PDF files as needed

### Phase 3: Verification
7. Generate and review all PDFs for consistency
8. Test tier comparison displays
9. Verify feature gating works correctly for Performance vs Command

---

## Technical Notes

### Files Using Centralized Config (Auto-Updated)
These files import from `documentationConfig.ts` and should automatically reflect the new prices:
- `PricingSummaryPDF.tsx`
- `AIAgentGuidesPDF.tsx`
- `PlatformFAQPDF.tsx`
- `PlatformDocumentPDF.tsx`

### Files with Hardcoded Values (Manual Update Required)
- `ComprehensiveGuidesPDF.tsx`
- `PlatformGuides.tsx`
- `Auth.tsx`
- `TierComparisonCards.tsx`
- `AIHelpCenter.tsx`

---

## Summary of Price Changes

| Tier | Old Price | New Price |
|------|-----------|-----------|
| Starter | $197 | $197 (unchanged) |
| Scheduling | $297 | **$397** |
| Growth | $397 | **$597** |
| Business | $500 | **$797** |
| Field Ops | $1,500 | **$1,497** |
| Performance | $3,997 | **$3,497** |
| Command | $5,997 | **$5,497** |

## Performance vs Command Differentiation

The key differentiation is now clearly defined:
- **Performance**: 22 agents, 7 consoles, basic analytics (insights + performance metrics)
- **Command**: 24 agents, 8 consoles, full analytics (adds revenue + forecast) + AI Operatives Hub
