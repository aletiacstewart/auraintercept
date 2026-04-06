

# Platform-Wide Consistency Deep Dive — Full Synchronization Plan

## Problem Summary
Despite previous updates, significant inconsistencies remain across the platform. The canonical model is:
- **Aura Core** ($197/mo) — 8 agents, 3 consoles, 10 employees, $0 implementation fee
- **Aura Boost** ($497/mo) — 12 agents, 5 consoles, 25 employees, $299 implementation fee
- **Aura Pro** ($997/mo) — 16 agents, 5 consoles, 50 employees, $599 implementation fee
- **Aura Elite** ($1,997/mo) — 24 agents, 7 consoles + AI Hub, unlimited employees, $999 implementation fee

## Issues Found (grouped by file)

### 1. `supabase/functions/create-checkout/index.ts`
- **CRITICAL**: Still says "3-TIER STRUCTURE: Boost ($297), Pro ($497), Elite ($697)" with old prices ($297/$497/$697 instead of $197/$497/$997/$1,997)
- Missing Aura Core tier entirely
- All legacy aliases map to wrong prices
- **Fix**: Rewrite to 4-tier structure with correct prices ($19700/$49700/$99700/$199700 cents)

### 2. `supabase/functions/trial-reminders/index.ts`
- Two email templates say "Starting at $297/month" — should be "$197/month"
- **Fix**: Update both CTA buttons

### 3. `src/components/audit/types.ts`
- Still uses 3-tier model (CONNECT/PERFORMANCE/COMMAND) — missing Aura Core and Aura Pro
- `TierType` only has 3 values
- PERFORMANCE is mislabeled as "Aura Boost" ($497) — should be Aura Boost mapped to CONNECT tier
- No CORE or PRO tier definitions
- **Fix**: Expand to 4-tier model (CORE/BOOST/PRO/ELITE) with correct agent counts and features

### 4. `src/components/audit/AuditResults.tsx` & `AgentOpportunityAudit.tsx`
- References "3-Tier Comparison" and "3 tiers"
- Implementation fees text says "start at $299" — should mention $0 for Core
- 14-day trial reference — should be 30-day
- **Fix**: Update to 4-tier comparison

### 5. `src/components/documentation/PricingSummaryPDF.tsx`
- Line 194: Says "18 AI Agents" for Pro — should be 16
- Line 232: Old implementation fees "Connect: $299 | Performance: $499 | Command: Custom"
- Still references old 3-column table (columns c/p/cmd) — needs 4-column (core/boost/pro/elite)
- Lines 387: "Everything in Boost (12 agents)" then lists Campaign/Outreach as Boost — wrong, those are Pro
- **Fix**: Full rewrite of tier detail pages and implementation fee text

### 6. `src/components/documentation/WebsiteCopyPDF.tsx`
- Line 599: Implementation fee text says "$299–$499 depending on tier, Custom for Command"
- Line 594: Says "14-day free trial" — should be 30-day
- **Fix**: Update to "$0–$999" range and 30-day trial

### 7. `src/components/documentation/PlatformDocumentPDF.tsx`
- Line 880: References "Single-Point/Multi-Track" tiers (legacy)
- Line 935: Says "14-day free trial" — should be 30-day
- Line 1277: "14-day free trial"
- **Fix**: Replace all legacy tier references with Core/Boost/Pro/Elite

### 8. `src/components/documentation/ComprehensiveGuidesPDF.tsx`
- Lines 244-248: Legacy tier names "Single-Point", "Multi-Track+"
- Lines 284, 302, 312, 356: Legacy tier references
- **Fix**: Replace with current tier names

### 9. `src/components/documentation/BrandAssetGuidePDF.tsx`
- Lines 928-935: Says "23 AI Agents" and "6 Control Centers" — should be 24 and 7
- Line 974: References "Multi-Track tier"
- **Fix**: Update stats to 24 agents, 7 consoles

### 10. `src/pages/PlatformGuides.tsx`
- Line 122: "18 AI Agents" for Pro — should be 16; includes "Admin, Quoting" which are Elite-only
- Lines 148-152: Legacy "Single-Point", "Multi-Track+" references
- Lines 160-166: Legacy tier names "Connect+", "Logistics+", "Growth+", "Presence+", "Performance+"
- Lines 186-191: Outdated agent stack groupings
- **Fix**: Rewrite with current tier names (Core/Boost/Pro/Elite) and correct agent lists

### 11. `src/pages/Help.tsx`
- Line 699: "18 AI Agents" for Pro with "Admin, Quoting" — should be 16 without those
- **Fix**: Update Pro agent description

### 12. `src/components/help/AIHelpCenter.tsx`
- Lines 76-101: Legacy tier suffixes ("Connect+", "Performance+", "Logistics+", "Growth+", "Presence+")
- **Fix**: Replace with current tier names (Core/Boost/Pro/Elite)

### 13. `src/lib/helpContentConfig.ts`
- Line 59: Comment says "3-TIER STRUCTURE"
- Line 351: Comment says "3-TIER STRUCTURE"
- **Fix**: Update comments to "4-TIER STRUCTURE"

### 14. `src/components/smartwebsite/VisitorLimitModal.tsx`
- Line 43: "6 Control Centers" for Pro — should be "5 Control Centers"
- **Fix**: Update console count

### 15. `src/components/documentation/SalesPitchDataPDF.tsx`
- Lines 506-508: "3-Tier ROI Calculators" — should be 4-tier
- Line 974: References "Multi-Track tier"
- **Fix**: Update to 4-tier

### 16. `src/pages/ExportDocumentation.tsx`
- Line 58: "3-Tier Subscription Access" — should be 4-Tier
- **Fix**: Update label

### 17. `src/components/documentation/AIAgentGuidesPDF.tsx`
- Line 752: Comment says "3-tier model" — should be 4-tier
- **Fix**: Update comment

### 18. `src/pages/Auth.tsx`
- Line 808: "Performance+" legacy tier reference
- **Fix**: Replace with "Pro+" or "All tiers"

## Implementation Approach

### Batch 1 — Backend / Edge Functions (3 files)
- `create-checkout/index.ts`: 4-tier pricing with correct cents values
- `trial-reminders/index.ts`: "$197/month" CTA
- `check-subscription/index.ts`: Verify mappings (already looks correct)

### Batch 2 — Audit System (3 files)
- `audit/types.ts`: Expand to 4-tier (CORE/BOOST/PRO/ELITE)
- `audit/AuditResults.tsx`: 4-tier comparison
- `audit/AgentOpportunityAudit.tsx`: 4-tier scoring

### Batch 3 — PDF Documents (6 files)
- `PricingSummaryPDF.tsx`, `WebsiteCopyPDF.tsx`, `PlatformDocumentPDF.tsx`, `ComprehensiveGuidesPDF.tsx`, `BrandAssetGuidePDF.tsx`, `SalesPitchDataPDF.tsx`

### Batch 4 — Platform Pages & Components (8 files)
- `PlatformGuides.tsx`, `Help.tsx`, `AIHelpCenter.tsx`, `helpContentConfig.ts`, `VisitorLimitModal.tsx`, `ExportDocumentation.tsx`, `AIAgentGuidesPDF.tsx`, `Auth.tsx`

Total: ~20 files with targeted fixes to achieve full platform consistency.

