
# Platform Consistency Audit: Comprehensive Update Plan

## Executive Summary
After auditing the entire platform including dashboards, consoles, audit system, export docs, guides, and signup pages, I identified **15+ critical inconsistencies** related to the new 7-tier subscription structure (including Aura Flow). The primary issues are outdated tier counts, missing Aura Flow from key configurations, and outdated documentation.

---

## Critical Issues Found

### 1. Auth.tsx - Company Signup Page (HIGH PRIORITY)
**Location**: `src/pages/Auth.tsx` (Lines 52, 700-876)
**Issue**: Company signup only displays 3 tiers (Single-Point, Multi-Track, Command)
**Missing Tiers**: 
- Aura Express ($197)
- Aura Flow ($297) 
- Aura Halo ($397)
- Aura Core ($500)

**Impact**: New companies cannot see or select the lower-priced tiers during registration

---

### 2. documentationConfig.ts - Tier Count & Hierarchy (HIGH PRIORITY)
**Location**: `src/lib/documentationConfig.ts`

| Line | Current Value | Should Be |
|------|--------------|-----------|
| 8 | "5-TIER STRUCTURE" | "7-TIER STRUCTURE" |
| 607 | `totalTiers: 6` | `totalTiers: 7` |
| 649-657 | tierHierarchy missing aura_flow | Add aura_flow: 2 |
| 668-676 | tierHierarchy missing aura_flow | Add aura_flow: 2 |

---

### 3. PricingSummaryPDF.tsx - PDF Export (MEDIUM PRIORITY)
**Location**: `src/components/documentation/PricingSummaryPDF.tsx`

| Line | Current Value | Should Be |
|------|--------------|-----------|
| 466 | "6-Tier Pricing Breakdown" | "7-Tier Pricing Breakdown" |
| 469 | "6 Pricing Tiers" stat | "7 Pricing Tiers" |
| 499 | "6-Tier Comparison Table" | "7-Tier Comparison Table" |
| 619, 622 | "6-Tier" references | "7-Tier" |

---

### 4. ExportDocumentation.tsx - Document Descriptions (MEDIUM PRIORITY)
**Location**: `src/pages/ExportDocumentation.tsx`

| Line | Current Value | Should Be |
|------|--------------|-----------|
| 55 | "5-Tier Subscription Access" | "7-Tier Subscription Access" |
| 165 | "Five-Tier Comparison" | "Seven-Tier Comparison" |

---

### 5. PlatformGuides.tsx - Subscription Tiers Guide (MEDIUM PRIORITY)
**Location**: `src/pages/PlatformGuides.tsx` (Lines 119-133)
**Issue**: The "Subscription Tiers" guide step is missing:
- Aura Express ($197/mo) - Restaurant tier
- Aura Flow ($297/mo) - Personal Assistant tier

**Current**: Lists only 5 tiers (Halo, Core, Single-Point, Multi-Track, Command)
**Should**: Include all 7 tiers with descriptions

---

## Files Requiring Updates

### High Priority (Core Functionality)

| File | Changes Required |
|------|-----------------|
| `src/pages/Auth.tsx` | Add 4 missing tier cards (Express, Flow, Halo, Core) to company signup |
| `src/lib/documentationConfig.ts` | Update comment (5→7), totalTiers (6→7), add aura_flow to both tierHierarchy functions |

### Medium Priority (Documentation/PDFs)

| File | Changes Required |
|------|-----------------|
| `src/components/documentation/PricingSummaryPDF.tsx` | Update all "6-Tier" references to "7-Tier" |
| `src/pages/ExportDocumentation.tsx` | Update tier count references |
| `src/pages/PlatformGuides.tsx` | Add Express and Flow to subscription tiers guide |

### Already Correct (No Changes Needed)

| File | Status |
|------|--------|
| `src/pages/Index.tsx` | Has all 7 tiers displayed |
| `src/pages/Subscription.tsx` | Has all 7 tiers in TIERS array |
| `supabase/functions/landing-chat/index.ts` | Correctly shows 7 tiers |
| `src/lib/helpContentConfig.ts` | Has aura_flow in tierHierarchy |
| `src/components/audit/types.ts` | Recently updated with FLOW tier |

---

## Detailed Implementation

### Phase 1: Fix Core Configuration

**documentationConfig.ts Updates:**
```typescript
// Line 8: Update comment
// SUBSCRIPTION TIERS - 7-TIER STRUCTURE

// Line 607: Update totalTiers
totalTiers: 7,

// Lines 649-657 and 668-676: Add aura_flow to tierHierarchy
const tierHierarchy: Record<string, number> = {
  free: 0,
  express: 1,
  aura_flow: 2,  // ADD THIS
  halo: 3,
  core: 4,
  single_point: 5,
  multi_track: 6,
  command: 7,
};
```

### Phase 2: Fix Auth.tsx Company Signup

**Current Structure (3 tiers):**
- Starter → Single-Point ($1,500)
- Professional → Multi-Track ($3,997)
- Enterprise → Command ($5,997)

**New Structure (7 tiers):**
Display industry-specific packages prominently:
1. Aura Express ($197) - Restaurants
2. Aura Flow ($297) - Personal Assistant
3. Aura Halo ($397) - Salons/Wellness

Display general tiers:
4. Aura Core ($500) - AI-Assisted
5. Single-Point ($1,500) - Solo-Focus
6. Multi-Track ($3,997) - Small Scale
7. Aura Pro Command ($5,997) - Enterprise

**Key Changes:**
- Update `selectedTier` type from `'starter' | 'professional' | 'enterprise'` to match actual tier IDs
- Add 4 new tier selection cards with proper styling
- Match the Index.tsx pricing display for consistency

### Phase 3: Fix PDF Exports

**PricingSummaryPDF.tsx:**
- Update cover page stats from "6" to "7" tiers
- Update subtitle from "6-Tier" to "7-Tier"
- Update table of contents entries
- Update section headers

### Phase 4: Fix Platform Guides

**PlatformGuides.tsx - Subscription Tiers Guide:**
Add missing entries:
```typescript
'Aura Express ($197/mo): AI Voice + Chat for restaurants with smart link sharing',
'Aura Flow ($297/mo): AI Personal Assistant with scheduling via calendar sync',
```

---

## Summary of Changes

| Category | Files | Estimated Effort |
|----------|-------|------------------|
| Core Config | 1 file | 10 min |
| Company Signup | 1 file | 45 min |
| PDF Exports | 2 files | 15 min |
| Platform Guides | 1 file | 10 min |
| **Total** | **5 files** | **~80 min** |

---

## Testing Checklist

After implementation:
1. Navigate to `/auth?mode=company` and verify all 7 tiers display
2. Download Pricing Summary PDF and verify "7-Tier" appears throughout
3. Check Platform Guides subscription section for all tiers
4. Verify documentationConfig helper functions return correct tier order
5. Test audit to ensure FLOW tier recommendations work correctly
