
# Update Export Documentation PDFs to Use Centralized Data Source

## Problem Summary
The PDF export files have **hardcoded tier data** that is out of sync with the centralized `documentationConfig.ts`. Key discrepancies include:

| Tier | Document Shows | Should Be (per config) |
|------|----------------|------------------------|
| Core | 0 operatives, 0 consoles | 3 operatives, 3 consoles |
| Single-Point | 3 operatives, 1 console | 6 operatives, 6 consoles |
| Multi-Track | 10 operatives, 2 consoles | 12 operatives, 7 consoles |
| Aura Flow | Missing from tables | $297/mo, 3 operatives, 0 consoles |

Additionally, the "Aura Flow" tier ($297/mo) is completely missing from summary grids and comparison tables.

---

## Solution: Centralize All PDF Data

### Phase 1: Update PricingSummaryPDF.tsx (Primary Fix)

**File:** `src/components/documentation/PricingSummaryPDF.tsx`

1. **Remove local `SUBSCRIPTION_TIERS` constant** (lines 335-428)
2. **Import from centralized config:**
   ```typescript
   import { SUBSCRIPTION_TIERS, TIER_ORDER, AI_OPERATIVES, CONSOLES } from '@/lib/documentationConfig';
   ```

3. **Update Executive Summary Grid** (lines 535-572):
   - Add missing "Aura Flow" card between Express and Halo
   - Update all operative/console counts to pull from config

4. **Update Comparison Tables** (lines 577-604 and 625-669):
   - Add "Flow" column to all comparison tables (currently only 6 columns)
   - Fix all operative/console/employee counts to match config

5. **Fix Core Tier Description** (lines 771-822):
   - Remove outdated "No Automation" label (config shows `hasAutomation: true`)
   - Update operative count from 0 to 3
   - Update console count from 0 to 3

6. **Fix Aura Flow Page** - Add dedicated tier page (currently missing individual breakdown)

---

### Phase 2: Update AIAgentGuidesPDF.tsx

**File:** `src/components/documentation/AIAgentGuidesPDF.tsx`

1. **Import from centralized config** instead of hardcoded `TIER_ACCESS` array
2. **Update tier data** (lines 755-830):
   - Core: `agentCount: 0` → `agentCount: 3`
   - Single-Point: `agentCount: 3` → `agentCount: 6`
   - Multi-Track: `agentCount: 10` → `agentCount: 12`
   - Multi-Track consoles: 2 → 7

---

### Phase 3: Update PlatformDocumentPDF.tsx

**File:** `src/components/documentation/PlatformDocumentPDF.tsx`

1. **Import from centralized config**
2. **Fix pricing section** (lines 1198-1212):
   - Multi-Track: "10 AI Operatives + 2 Consoles" → "12 AI Operatives + 7 Consoles"

---

### Phase 4: Update SalesPitchDataPDF.tsx

**File:** `src/components/documentation/SalesPitchDataPDF.tsx`

1. **Import from centralized config**
2. **Update ROI calculators** to use correct tier pricing and feature counts
3. **Add Aura Flow tier** to all comparison/ROI sections

---

## Technical Implementation Details

### Import Pattern for All PDF Files
```typescript
import { 
  SUBSCRIPTION_TIERS, 
  TIER_ORDER, 
  AI_OPERATIVES, 
  CONSOLES,
  type TierConfig 
} from '@/lib/documentationConfig';
```

### Helper Functions to Add
```typescript
// Get tier by ID with type safety
const getTier = (id: string): TierConfig => SUBSCRIPTION_TIERS[id];

// Format price for display
const formatPrice = (price: number): string => 
  `$${price.toLocaleString()}`;

// Get operative count for tier
const getOperativeCount = (tierId: string): number => 
  SUBSCRIPTION_TIERS[tierId].operatives;
```

### Comparison Table Data Generation
```typescript
// Generate table rows from config
const tableRows = TIER_ORDER.map(tierId => ({
  tier: SUBSCRIPTION_TIERS[tierId].name,
  price: formatPrice(SUBSCRIPTION_TIERS[tierId].price),
  operatives: SUBSCRIPTION_TIERS[tierId].operatives,
  consoles: SUBSCRIPTION_TIERS[tierId].consoles,
  employees: SUBSCRIPTION_TIERS[tierId].employees,
  hasVoice: SUBSCRIPTION_TIERS[tierId].hasVoice,
  hasAutomation: SUBSCRIPTION_TIERS[tierId].hasAutomation,
}));
```

---

## Files to Modify

| File | Changes Required |
|------|------------------|
| `src/components/documentation/PricingSummaryPDF.tsx` | Remove local constants, import from config, add Flow tier, fix all counts |
| `src/components/documentation/AIAgentGuidesPDF.tsx` | Import from config, fix tier access data |
| `src/components/documentation/PlatformDocumentPDF.tsx` | Import from config, fix pricing section |
| `src/components/documentation/SalesPitchDataPDF.tsx` | Import from config, update ROI calculators |
| `src/components/documentation/ComprehensiveGuidesPDF.tsx` | Verify tier references match config |
| `src/components/documentation/CompanyGuidesPDF.tsx` | Verify tier references match config |

---

## Expected Outcome

After implementation:
- All 7 tiers will display correctly: Express, Flow, Halo, Core, Single-Point, Multi-Track, Command
- Correct operative counts: 1, 3, 1, 3, 6, 12, 24
- Correct console counts: 0, 0, 1, 3, 6, 7, 7
- Single source of truth ensures future updates propagate automatically
- No more manual data synchronization needed between PDFs and config

---

## Verification Steps

1. Download each PDF after changes
2. Verify all 7 tiers appear in comparison tables
3. Verify operative/console/employee counts match `documentationConfig.ts`
4. Verify Aura Core shows as "AI-Assisted" with 3 operatives (not 0)
5. Verify Aura Flow ($297) appears in all relevant sections
