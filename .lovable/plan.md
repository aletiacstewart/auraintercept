

# Batches 3 & 4 — PDF Documentation, Audit, and Remaining UI (3-Tier Consolidation)

## Summary
Complete the migration by updating ~20 files still referencing legacy 7-tier data. This covers PDF documentation, the audit scoring system, the help center knowledge base, and miscellaneous UI pages.

---

## Batch 3 — PDF Documentation & Guides

### 3A. `src/components/documentation/PricingSummaryPDF.tsx` (1122 lines)
Full rewrite of pricing content:
- Cover page: "7" tiers → "3", "24" operatives → "10", "$197" starting → "$297"
- Table of contents: Remove Starter/Connect-old/Growth/Presence/Logistics pages, replace with 3 tier pages
- Executive summary: 7 summary cards → 3 cards (Connect $297, Performance $497, Command $697)
- Comparison table: 7 columns → 3 columns
- Individual tier detail pages: Remove 4 legacy pages, keep/update Connect, Performance, Command
- Third-party integrations: Update "Growth+" references to "Performance+"
- Annual savings table: 3 rows instead of 7

### 3B. `src/components/documentation/SalesPitchDataPDF.tsx`
- "7-Tier ROI Calculators" → "3-Tier ROI Calculators"
- Remove legacy tier ROI cards (Starter, Growth, Presence, Logistics)
- "All 24 AI Operatives" → "All 10 AI Operatives"
- "All 7 Consoles" → "All 7 Consoles" (unchanged)
- Update tier bullet points for Connect/Performance/Command only

### 3C. `src/components/documentation/BrandAssetGuidePDF.tsx`
- "24 AI OPERATIVES ACROSS 7 CONSOLES" → "10 AI OPERATIVES ACROSS 7 CONSOLES"
- Remove extra tier color swatches, keep 3

### 3D. `src/components/documentation/PlatformDocumentPDF.tsx`
- "Our 24 AI operatives" → "Our 10 AI operatives"
- "24 AI Operatives Working Together" → "10 AI Operatives Working Together"

### 3E. `src/components/documentation/AIAgentGuidesPDF.tsx`
- Update tier pricing table to reference 3 tiers from `SUBSCRIPTION_TIERS` using keys `aura_connect`, `aura_performance`, `command`
- Remove references to `multi_track`, `single_point`, etc.

### 3F. `src/components/documentation/ComprehensiveGuidesPDF.tsx`
- Rewrite tier listings from 7 to 3

### 3G. `src/components/documentation/PlatformFAQPDF.tsx`
- Update FAQ answers referencing 7 tiers / 24 agents

### 3H. `src/components/documentation/WebsiteCopyPDF.tsx`
- Update copy blocks for 3 tiers

### 3I. `src/components/documentation/SocialMediaContentPackPDF.tsx`
- Update pricing references

### 3J. `src/pages/PlatformGuides.tsx`
- Lines 95-128: Replace 7-tier listing with 3-tier listing (Connect $297, Performance $497, Command $697)
- Lines 186-193: "24 AI Operatives organized into 6 stacks" → "10 AI Operatives organized into 5 stacks"
- Line 544: "all 24 AI Operatives" → "all 10 AI Operatives"

### 3K. `src/pages/ExportDocumentation.tsx`
- Update any "7-Tier" labels in export UI

### 3L. `src/pages/Help.tsx`
- Line 654: "all 24 AI agents, all 7 Control Centers" → "all 10 AI operatives, all 7 Control Centers"

---

## Batch 4 — Audit System, Help Center, Misc UI

### 4A. `src/components/audit/types.ts` (569 lines — largest single change)
- `TierType`: Change from 7 keys to `'CONNECT' | 'PERFORMANCE' | 'COMMAND'`
- `TierScores`: Reduce to 3 fields
- All 30 questions: Collapse 7 `tierScores` values into 3 per option. Mapping logic: EXPRESS/FLOW/CORE/HALO → max of those = CONNECT score; SINGLE_POINT/MULTI_TRACK → max = PERFORMANCE; COMMAND stays
- `TIER_RECOMMENDATIONS`: Replace 7 entries with 3 matching the canonical model (Connect 5 agents/4 consoles, Performance 8/6, Command 10/7)
- Section order stays the same (9 sections, 30 questions)

### 4B. `src/components/audit/AuditResults.tsx`
- `TIER_ICONS`: 3 entries (Zap for Connect, Users for Performance, Crown for Command)
- `TIER_COLORS`, `TIER_BG_COLORS`: 3 entries
- `TIER_ORDER`: 3 entries
- `TIER_ROI_ESTIMATES`: 3 entries
- "7-Tier Comparison" comment/heading → "3-Tier Comparison"

### 4C. `src/components/audit/AgentOpportunityAudit.tsx`
- "7 tiers" comment → "3 tiers"
- `tierPercentages` initial object: 3 keys
- `recommendedTier` scoring: 3 entries

### 4D. `src/components/help/AIHelpCenter.tsx`
- Lines 110-117: Replace "7-Tier Growth Ladder" with 3-tier listing:
  - Aura Connect ($297/mo): 5 operatives, 4 consoles, 5 employees
  - Aura Performance ($497/mo): 8 operatives, 6 consoles, 15 employees
  - Aura Command ($697/mo): 10 operatives, all 7 consoles, Unlimited employees
- Lines 99-101: Update "Logistics+" → "Performance+"

### 4E. `src/pages/TalkToAura.tsx`
- Lines 44-52: Replace 7-entry `tierLabels` with 3 entries:
  ```
  connect: 'Aura Connect',
  performance: 'Aura Performance',
  command: 'Aura Command',
  ```

### 4F. `src/pages/VideoPromptsPage.tsx`
- Lines 326-328: "All 24 AI operative icons" → "All 10 AI operative icons", "24 agents" → "10 operatives"

### 4G. `src/pages/DesignPreview.tsx`
- Line 463: "24 AI operatives" → "10 AI operatives"

### 4H. `src/pages/DemoAccounts.tsx`
- Lines 154-205: `tierFeatures` record still has legacy tier entries (Starter, Growth, Presence, Logistics). Replace with 3 tier feature lists matching canonical model.

---

## Execution Order
Batch 3 and 4 will be implemented together since they are independent changes. The audit system (4A-4C) is the most complex change due to collapsing 30 questions x 7 scores into 3 scores each.

## Risk Notes
- PDF files reference `SUBSCRIPTION_TIERS` keys from `documentationConfig.ts`. The config was already updated to use `aura_connect`, `aura_performance`, `command` keys, so PDF files referencing old keys like `express`, `aura_flow`, `halo`, `core`, `single_point`, `multi_track` will cause runtime errors until fixed.
- The audit scoring collapse (7→3) uses a max-of-group strategy to preserve relative differentiation.

