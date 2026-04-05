

# Batches 3 & 4 — Final 3-Tier Consolidation

## Summary
Update ~20 remaining files to remove all legacy 7-tier references (Starter, Growth, Presence, Logistics) and align with the canonical 3-tier model. This covers PDF documentation, the audit scoring system, help center, and miscellaneous UI pages.

---

## Files & Changes

### Audit System (3 files — most complex)

**`src/components/audit/types.ts`** (569 lines)
- Change `TierType` from 7 keys to `'CONNECT' | 'PERFORMANCE' | 'COMMAND'`
- Change `TierScores` interface to 3 fields
- Collapse all 30 questions' `tierScores` from 7 values to 3 using max-of-group: `max(EXPRESS, FLOW, CORE, HALO)` → CONNECT, `max(SINGLE_POINT, MULTI_TRACK)` → PERFORMANCE, COMMAND stays
- Replace 7 `TIER_RECOMMENDATIONS` entries with 3: Connect (5 agents/4 consoles/$297), Performance (8/6/$497), Command (10/7/$697)

**`src/components/audit/AuditResults.tsx`** (311 lines)
- Reduce `TIER_ICONS`, `TIER_COLORS`, `TIER_BG_COLORS`, `TIER_ORDER`, `TIER_ROI_ESTIMATES` from 7 entries to 3
- Update "7-Tier Comparison" → "3-Tier Comparison"

**`src/components/audit/AgentOpportunityAudit.tsx`** (already shown in current code)
- Update comment "7 tiers" → "3 tiers"
- Change `tierPercentages` initial object to 3 keys
- Change `recommendedTier` scoring array to 3 entries

### Help Center & Misc UI (6 files)

**`src/components/help/AIHelpCenter.tsx`**
- Lines 76-83: Replace legacy tier labels on consoles (Logistics+ → Performance+, Growth+ → Connect+, Presence+ → Connect+)
- Lines 93-105: Same for operatives
- Lines 110-117: Replace 7-tier Growth Ladder with 3-tier listing (Connect $297, Performance $497, Command $697)

**`src/pages/TalkToAura.tsx`**
- Lines 44-52: Replace 7-entry `tierLabels` with 3 entries (connect, performance, command)

**`src/pages/Help.tsx`**
- Line 654: "all 24 AI agents" → "all 10 AI operatives"

**`src/pages/DesignPreview.tsx`**
- Line 463: "24 AI operatives" → "10 AI operatives"

**`src/pages/VideoPromptsPage.tsx`**
- Lines 326-328, 341-343: "24 AI operative" → "10 AI operative", "24 agents" → "10 operatives", "24-agent" → "10-operative"

**`src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`**
- Line 67: "Logistics+ tiers" → "Performance+ tiers"
- Line 85: "Growth+ tiers" → "Connect+ tiers"

### PDF Documentation (7 files)

**`src/components/documentation/PricingSummaryPDF.tsx`**
- Full rewrite: 7-tier tables → 3-tier tables, $197 start → $297, 24 operatives → 10

**`src/components/documentation/SalesPitchDataPDF.tsx`**
- "7-Tier ROI" → "3-Tier ROI", remove legacy tier cards, "24 AI Operatives" → "10 AI Operatives"

**`src/components/documentation/BrandAssetGuidePDF.tsx`**
- Remove Starter/Growth/Presence/Logistics color swatches, keep 3 tier colors
- "24 AI OPERATIVES" → "10 AI OPERATIVES", "$197-$697" → "$297-$697"

**`src/components/documentation/PlatformDocumentPDF.tsx`**
- "24 specialized AI operatives" → "10 AI operatives" (multiple locations)

**`src/components/documentation/ComprehensiveGuidesPDF.tsx`**
- Rewrite tier listings from 7 to 3 with correct agent/console/employee counts

**`src/components/documentation/WebsiteCopyPDF.tsx`**
- "24 AI Operatives" → "10 AI Operatives", "$197/mo" → "$297/mo", update all tier copy blocks

**`src/components/documentation/PlatformFAQPDF.tsx`**
- Update FAQ answers: "24 AI Operatives" → "10", replace 7-tier plan listing with 3-tier

**`src/components/documentation/SocialMediaContentPackPDF.tsx`**
- Update pricing references ($197 → $297, legacy tier names)

### Guides & Export Pages (3 files)

**`src/pages/PlatformGuides.tsx`**
- Lines 95-130: Replace 7-tier subscription guide with 3-tier listing
- Lines 160-172: Update console tier labels (Logistics+ → Performance+, Growth+ → Connect+, Presence+ → Connect+)
- Lines 185-196: "24 AI Operatives organized into 6 stacks" → "10 AI Operatives organized into 5 stacks"
- All other legacy tier/agent references throughout the file

**`src/pages/ExportDocumentation.tsx`**
- Update card descriptions: "24 AI operatives" → "10 AI operatives", "7-Tier" → "3-Tier", "24 agents" → "10 operatives"
- Update page previews (line 671, 680, 714 etc.)

**`src/pages/IntegrationDocs.tsx`**
- Line 30: Remove "Aura Presence" reference → "all tiers"

### Edge Function

**`supabase/functions/trial-reminders/index.ts`**
- Lines 264, 308: "$197/month" → "$297/month"

---

## Technical Notes
- The audit scoring collapse uses `Math.max()` of legacy group scores to preserve differentiation
- PDF files import from `documentationConfig.ts` which is already updated to 3 tiers — any references to old keys (`express`, `aura_flow`, etc.) will cause runtime errors until fixed
- Total: ~20 files, executed in one pass since changes are independent

