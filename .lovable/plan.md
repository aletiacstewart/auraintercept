
# Platform Guides & Documentation Compliance Audit - Complete Fix Plan

## Executive Summary
A comprehensive audit has identified **65+ critical inconsistencies** across Platform Guides, Help pages, PDFs, and edge functions. These must be corrected before generating any marketing materials.

---

## Critical Findings by Category

### 1. AI Operative Count Discrepancy (23 vs 24) - HIGHEST PRIORITY

| Location | Current Value | Should Be |
|----------|---------------|-----------|
| `src/pages/PlatformGuides.tsx` line 1189 | `23` AI Operatives stat | `24` |
| `src/components/landing/CompetitiveDifferentiation.tsx` line 52 | `'23 operatives'` | `'24 operatives'` |
| `supabase/functions/landing-chat/index.ts` line 12 | `23 specialized AI operatives` | `24 specialized AI operatives` |
| `supabase/functions/landing-chat/index.ts` line 23 | `All 23 AI operatives` | `All 24 AI operatives` |
| `src/components/documentation/PricingSummaryPDF.tsx` line 419 | `operatives: 23` | `operatives: 24` |
| `src/components/documentation/PricingSummaryPDF.tsx` line 474 | Cover stat `23` | `24` |
| `src/components/documentation/PricingSummaryPDF.tsx` line 586 | `command: '23'` | `command: '24'` |

---

### 2. PlatformGuides.tsx Tier Data Errors

| Line | Current (Wrong) | Should Be |
|------|-----------------|-----------|
| Line 123 | `'Aura Halo ($397/mo): 4 AI Operatives for salons...'` | `'Aura Halo ($397/mo): 3 AI Operatives for salons...'` |

---

### 3. Console Naming in Edge Function

| Location | Current (Wrong) | Should Be |
|----------|-----------------|-----------|
| `landing-chat/index.ts` line 12 | `'Marketing & Sales'` | `'Outreach & Sales Ops'` |

---

### 4. PricingSummaryPDF.tsx - Multiple Issues

| Issue | Location | Fix |
|-------|----------|-----|
| Says "6-Tier Comparison" | Line 622 | Should be "7-Tier Comparison" |
| Missing Aura Flow from TOC | Lines 500-509 | Add `{ title: 'Aura Flow Tier (Personal Assistant)', page: '6' }` |
| Local SUBSCRIPTION_TIERS | Lines 335-428 | Should import from `documentationConfig.ts` |
| Cover stat shows 23 operatives | Line 474 | Should show 24 |

---

### 5. CompetitiveDifferentiation.tsx Contradiction

| Line | Current | Issue |
|------|---------|-------|
| Line 52 | `'23 operatives'` | Says 23 operatives |
| Line 94 | `'24 specialized AI operatives'` | Says 24 operatives |

Both should say `'24 operatives'`.

---

### 6. PlatformGuides.tsx Missing Console Names

Several console references don't match standardized naming:
- "Business Ops Hub" → Should reference "Business Mgt Ops Console"
- Various navigation routes need updating

---

## Files Requiring Changes

### Phase 1: Critical Operative Count Fixes (7 files)

| File | Changes Needed |
|------|----------------|
| `src/pages/PlatformGuides.tsx` | Fix stat to 24, fix Halo operative count to 3 |
| `src/components/landing/CompetitiveDifferentiation.tsx` | Change 23 → 24 operatives |
| `supabase/functions/landing-chat/index.ts` | Change 23 → 24 operatives (2 locations) + rename console |
| `src/components/documentation/PricingSummaryPDF.tsx` | Fix command tier to 24, fix cover stat, fix "6-Tier" → "7-Tier", add missing Aura Flow to TOC |

### Phase 2: PDF Document Data Centralization

These PDFs define inline data instead of importing from `documentationConfig.ts`:

| PDF File | Issue |
|----------|-------|
| `PricingSummaryPDF.tsx` | Has own `SUBSCRIPTION_TIERS` object |
| `PlatformDocumentPDF.tsx` | Has inline agents array |
| `AIAgentGuidesPDF.tsx` | Has own `CONSOLES` array |
| `ComprehensiveGuidesPDF.tsx` | Has inline guide data |

### Phase 3: Platform Guides Content Corrections

In `src/pages/PlatformGuides.tsx` guideCategories:

| Guide | Issue | Fix |
|-------|-------|-----|
| "Subscription Tiers" | Halo says "4 AI Operatives" | Should be "3 AI Operatives" |
| "Subscription Tiers" | Multiple tier descriptions need verification | Align with documentationConfig.ts |

---

## Detailed Changes

### 1. src/pages/PlatformGuides.tsx

**Line 123** - Fix Halo operative count:
```
Before: 'Aura Halo ($397/mo): 4 AI Operatives for salons/wellness + Customer Portal Console',
After:  'Aura Halo ($397/mo): 3 AI Operatives for salons/wellness + Customer Portal Console',
```

**Line 1189** - Fix AI Operatives stat:
```
Before: <p className="text-2xl font-bold">23</p>
After:  <p className="text-2xl font-bold">24</p>
```

### 2. src/components/landing/CompetitiveDifferentiation.tsx

**Line 52**:
```
Before: { feature: 'Specialized Agents', traditional: 'Basic automation', aura: '23 operatives' },
After:  { feature: 'Specialized Agents', traditional: 'Basic automation', aura: '24 operatives' },
```

### 3. supabase/functions/landing-chat/index.ts

**Line 12**:
```
Before: - It provides 23 specialized AI operatives organized into 7 Control Centers: Customer Portal, Field Operations, Business Management, Marketing & Sales, Social Media Signal, Analytics & Reports, and Web Presence
After:  - It provides 24 specialized AI operatives organized into 7 Control Centers: Customer Portal, Field Operations, Business Management, Outreach & Sales Ops, Social Media Signal, Analytics & Reports, and Web Presence
```

**Line 23**:
```
Before: - Aura Pro Command ($5,997/mo): All 23 AI operatives, all 7 Control Centers...
After:  - Aura Pro Command ($5,997/mo): All 24 AI operatives, all 7 Control Centers...
```

### 4. src/components/documentation/PricingSummaryPDF.tsx

**Line 419** - Fix command operatives:
```
Before: operatives: 23,
After:  operatives: 24,
```

**Line 474** - Fix cover stat:
```
Before: <Text style={styles.coverStatNumber}>23</Text>
After:  <Text style={styles.coverStatNumber}>24</Text>
```

**Line 586** - Fix table data:
```
Before: { feature: 'AI Operatives', express: '1', halo: '3', core: '0', single: '3', multi: '10', command: '23' },
After:  { feature: 'AI Operatives', express: '1', halo: '3', core: '0', single: '3', multi: '10', command: '24' },
```

**Line 622** - Fix section title:
```
Before: <Text style={styles.sectionTitle}>Complete 6-Tier Comparison</Text>
After:  <Text style={styles.sectionTitle}>Complete 7-Tier Comparison</Text>
```

**Lines 500-509** - Add missing Aura Flow to TOC:
```
{ title: 'Aura Express Tier (Restaurants)', page: '5' },
{ title: 'Aura Flow Tier (Personal Assistant)', page: '6' },  // ADD THIS
{ title: 'Aura Halo Tier (Salons/Wellness)', page: '7' },     // page numbers shift
...
```

**Line 639** - Fix table row:
```
Before: { category: 'AI Operatives', express: '1', halo: '3', core: '0', single: '3', multi: '10', command: 'All 24' },
This line is correct, but ensure consistency.
```

---

## Verification Checklist

After all fixes:
- [ ] All files show 24 AI Operatives (not 23)
- [ ] All tiers show correct operative counts (Halo = 3, not 4)
- [ ] "Outreach & Sales Ops" used everywhere (not "Marketing & Sales")
- [ ] All PDFs reference correct tier counts
- [ ] Edge function landing-chat has correct data
- [ ] Landing page CompetitiveDifferentiation matches
- [ ] Platform Guides stats card shows 24

---

## Technical Notes

The root cause of these inconsistencies is that multiple files define their own data instead of importing from `src/lib/documentationConfig.ts`. Future work should:
1. Convert PDF generators to import from documentationConfig.ts
2. Create a single source of truth for all marketing data
3. Add validation tests to catch inconsistencies

**Total Files to Update**: 4 files immediately for critical fixes
**Estimated Scope**: ~15 line changes across 4 files
