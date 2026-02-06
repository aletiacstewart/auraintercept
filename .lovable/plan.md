
# PDF Documents & AI Agent Tests Update Plan

## Overview
Two issues need to be addressed:
1. **AI Agent Test Suite** - Invoice Agent and 6 other agents timing out/slow due to 15-second timeout being too short for complex AI inference + tool calls
2. **PDF Documents Outdated** - Multiple PDF exports use old tier names (Express, Flow, Halo, Core, Single-Point, Multi-Track, Pro Command) instead of new names (Starter, Scheduling, Growth, Business, Field Ops, Performance, Command)

---

## Issue 1: AI Agent Test Timeouts

### Root Cause
The AI Agent Test Suite has a 15-second timeout (`THRESHOLDS.TIMEOUT: 15000`) which is too short for complex agents like Invoice Agent that require:
- Initial AI inference call
- Tool call execution (quote/invoice generation)
- Follow-up AI call with tool results
- Total round-trip time can easily exceed 15 seconds

### Solution
Increase timeout thresholds to accommodate realistic AI inference latency:

| Metric | Current | New |
|--------|---------|-----|
| Pass threshold | 8 seconds | 10 seconds |
| Slow warning | 8-15 seconds | 10-25 seconds |
| Timeout | 15 seconds | 30 seconds |

### File Change
**`src/components/ai/AIAgentTestSuite.tsx`** - Update THRESHOLDS constant

---

## Issue 2: Outdated PDF Tier Names

### Tier Name Mapping

| Old Name | New Name |
|----------|----------|
| Aura Express | Aura Starter |
| Aura Flow | Aura Scheduling |
| Aura Halo | Aura Growth |
| Aura Core | Aura Business |
| Single-Point | Aura Field Ops |
| Multi-Track | Aura Performance |
| Aura Pro Command | Aura Command |

### Files Requiring Updates

#### 1. PricingSummaryPDF.tsx (Major Updates)
This file has extensive hardcoded tier references that need updating:

| Section | Changes Needed |
|---------|----------------|
| Table of Contents | Update tier page titles |
| Executive Summary Cards | Update all tier labels (AURA EXPRESS, etc.) |
| Feature Highlight Table | Update header labels |
| Complete Comparison Table | Update tier column headers |
| Individual Tier Pages | Update page titles and tier names |
| Annual Savings Table | Update tier names in rows |
| Implementation Fees Table | Update tier names in rows |
| Integration Notes | Update tier references |

Key changes:
- "AURA EXPRESS" becomes "AURA STARTER"
- "AURA FLOW" becomes "AURA SCHEDULING" 
- "AURA HALO" becomes "AURA GROWTH"
- "AURA CORE" becomes "AURA BUSINESS"
- "SINGLE-POINT" becomes "AURA FIELD OPS"
- "MULTI-TRACK" becomes "AURA PERFORMANCE"
- "PRO COMMAND" becomes "AURA COMMAND"
- Section titles like "Aura Express Tier" become "Aura Starter Tier"

#### 2. src/components/audit/types.ts (TIER_RECOMMENDATIONS)
Update the `label` field in each tier recommendation:

| Key | Current Label | New Label |
|-----|--------------|-----------|
| EXPRESS | Aura Express | Aura Starter |
| FLOW | Aura Flow | Aura Scheduling |
| HALO | Aura Halo | Aura Growth |
| CORE | Aura Core | Aura Business |
| SINGLE_POINT | Single-Point | Aura Field Ops |
| MULTI_TRACK | Multi-Track | Aura Performance |
| COMMAND | Aura Pro Command | Aura Command |

---

## Technical Details

### PricingSummaryPDF.tsx Changes Summary

```text
File: src/components/documentation/PricingSummaryPDF.tsx

Sections to update:
+--------------------------------------------------+
| Table of Contents (lines ~400-420)               |
|   - 'Aura Express Tier' -> 'Aura Starter Tier'   |
|   - 'Aura Flow Tier' -> 'Aura Scheduling Tier'   |
|   - 'Aura Halo Tier' -> 'Aura Growth Tier'       |
|   - etc.                                          |
+--------------------------------------------------+
| Executive Summary Cards (lines ~440-480)         |
|   - 'AURA EXPRESS' -> 'AURA STARTER'             |
|   - 'AURA FLOW' -> 'AURA SCHEDULING'             |
|   - etc.                                          |
+--------------------------------------------------+
| Feature Tables (lines ~488-515)                  |
|   - Column headers: Express -> Starter           |
|   - Halo -> Growth, Core -> Business             |
|   - Single -> Field Ops, Multi -> Performance    |
+--------------------------------------------------+
| Tier Detail Pages (lines ~589-900)               |
|   - Section titles and card names                |
+--------------------------------------------------+
| Annual Savings Table (lines ~919-935)            |
|   - Row labels: Aura Halo -> Aura Growth         |
+--------------------------------------------------+
| Implementation Fees Table (lines ~1050-1065)     |
|   - Row labels for all tiers                     |
+--------------------------------------------------+
```

### audit/types.ts Changes

```text
TIER_RECOMMENDATIONS object updates:

EXPRESS: {
  label: 'Aura Express' -> 'Aura Starter'
}

FLOW: {
  label: 'Aura Flow' -> 'Aura Scheduling'
}

HALO: {
  label: 'Aura Halo' -> 'Aura Growth'
}

CORE: {
  label: 'Aura Core' -> 'Aura Business'
}

SINGLE_POINT: {
  label: 'Single-Point' -> 'Aura Field Ops'
}

MULTI_TRACK: {
  label: 'Multi-Track' -> 'Aura Performance'
}

COMMAND: {
  label: 'Aura Pro Command' -> 'Aura Command'
}
```

---

## Files to Modify

| File | Type of Change |
|------|----------------|
| `src/components/ai/AIAgentTestSuite.tsx` | Increase timeout thresholds |
| `src/components/documentation/PricingSummaryPDF.tsx` | Update ~50+ tier name references |
| `src/components/audit/types.ts` | Update 7 TIER_RECOMMENDATIONS labels |

---

## Verification Steps
After implementation:
1. Export the Pricing Summary PDF and verify all tier names show correctly
2. Run AI Agent Test Suite in Standard mode to verify timeouts are improved
3. Complete a subscription audit to verify tier recommendations show new names
