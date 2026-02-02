
# Platform Consistency & Compliance Audit Plan

## Executive Summary
A comprehensive audit has identified **47+ inconsistencies** across the platform that must be corrected before generating marketing materials. These span naming conventions, pricing data, agent counts, console labels, and tier configurations.

---

## Critical Findings by Category

### 1. Console/Feature Naming Violations (HIGH PRIORITY)

Per standardization memory, "Outreach & Sales Ops" is the official name. Found violations:

| Location | Current (Wrong) | Should Be |
|----------|-----------------|-----------|
| `helpContentConfig.ts` line 172 | `'Marketing & Sales'` | `'Outreach & Sales Ops'` |
| `AIAgentsHub.tsx` line 80 | `'Marketing & Sales'` | `'Outreach & Sales Ops'` |
| `PricingComparisonTable.tsx` line 48, 141 | `'Marketing & Sales Console'` | `'Outreach & Sales Ops Console'` |
| `Subscription.tsx` line 58, 263 | `'Marketing & Sales Console'` | `'Outreach & Sales Ops Console'` |
| `PlatformDocumentPDF.tsx` line 863 | `'Marketing & Sales'` | `'Outreach & Sales Ops'` |

---

### 2. Agent Count Discrepancies

| Tier | documentationConfig.ts | subscriptionAgentConfig.ts | Subscription.tsx | Landing Page |
|------|------------------------|----------------------------|------------------|--------------|
| Express | 1 operative | 0 agents | 1 agent | Not shown |
| Aura Flow | 3 operatives | 3 agents | 4 agents | Not shown |
| Halo | 3 operatives | 3 agents | 3 agents | Not shown |

**Issue**: Express claims 1 operative but has 0 actual agents. Aura Flow shows 4 in Subscription page but 3 elsewhere.

---

### 3. Employee Limit Conflicts

| Tier | documentationConfig.ts | PricingComparisonTable.tsx |
|------|------------------------|----------------------------|
| Halo | 3 employees | "2 included" |

**Fix Required**: Align all sources to show 3 employees for Halo.

---

### 4. Tier Hierarchy vs Pricing Mismatch

Current hierarchy order: `express → aura_flow → halo → core → single_point → multi_track → command`

Pricing order: `Express ($197) → Aura Flow ($297) → Halo ($397) → Core ($500)`

**Problem**: Core is priced HIGHER than Halo but positioned AFTER in hierarchy. This breaks tier comparison logic.

---

### 5. Subscription Page Missing Tiers

The detailed comparison table in `Subscription.tsx` (lines 227-319) only shows:
- Core, Single-Point, Multi-Track, Command

**Missing from comparison**: Express, Aura Flow, Halo (the lower tiers)

---

### 6. Console Naming Variations (Same Console, 3 Names)

| Source | Business Console Name |
|--------|----------------------|
| documentationConfig.ts | "Business Operations" |
| Sidebar (DashboardLayout.tsx) | "Business Mgt Ops Console" |
| helpContentConfig.ts | "Business Operations" |

**Standard per memory**: "Business Mgt Ops Console"

---

### 7. Missing Agents in Console Configs

`helpContentConfig.ts` marketing_sales console missing:
- Lead Agent (should be listed per Outreach & Sales Ops standard)

---

### 8. Web Presence Console vs Tab Confusion

- `PricingComparisonTable.tsx` lists "Web Presence Console" as separate console
- `documentationConfig.ts` shows Web Presence as a TAB within Social Media console
- Memory says Web Presence Agent belongs to Social Media & Web Presence console

---

### 9. AI Operatives Hub Tier Setting

`documentationConfig.ts` sets `ai_operatives_hub` tier to `'halo'` but this is a management console that should be accessible to all company admins regardless of subscription.

---

### 10. PDF Document Data Sources

All 11 PDF generators in `src/components/documentation/` need verification:
- PlatformDocumentPDF.tsx
- PricingSummaryPDF.tsx
- CompanyGuidesPDF.tsx
- AIAgentGuidesPDF.tsx
- etc.

Currently using inline data instead of importing from `documentationConfig.ts` single source of truth.

---

## Remediation Plan

### Phase 1: Core Data Alignment (Files to Update)

1. **src/lib/helpContentConfig.ts**
   - Change `title: 'Marketing & Sales'` → `'Outreach & Sales Ops'`
   - Add Lead Agent to marketing_sales agents array
   - Update tabs to match standard

2. **src/pages/AIAgentsHub.tsx**
   - Change CATEGORY_INFO `marketing_sales.label` → `'Outreach & Sales Ops'`

3. **src/components/landing/PricingComparisonTable.tsx**
   - All "Marketing & Sales" → "Outreach & Sales Ops"
   - Fix Halo employee count: "2 included" → "3 included"

4. **src/pages/Subscription.tsx**
   - All "Marketing & Sales" → "Outreach & Sales Ops"
   - Add missing tiers (Express, Aura Flow, Halo) to comparison sections
   - Fix agentCount for Aura Flow: 4 → 3

5. **src/lib/documentationConfig.ts**
   - Verify Express operatives count (currently 1, should match agents array)
   - Review tier order alignment with pricing

6. **src/lib/subscriptionAgentConfig.ts**
   - Verify TIER_HIERARCHY order matches business pricing logic

### Phase 2: PDF Generators Update

All PDF generators must import from `documentationConfig.ts`:
- PlatformDocumentPDF.tsx
- PricingSummaryPDF.tsx
- CompanyGuidesPDF.tsx
- AIAgentGuidesPDF.tsx
- BrandAssetGuidePDF.tsx
- ComprehensiveGuidesPDF.tsx
- IndustryMarketingKitPDF.tsx
- SalesPitchDataPDF.tsx
- SocialMediaContentPackPDF.tsx
- VideoScriptsPDF.tsx
- WebsiteCopyPDF.tsx

### Phase 3: Landing Page & Marketing

- Verify Index.tsx agentCategories and agentConsoles arrays match documentationConfig.ts
- Ensure all feature boxes use correct standardized names

---

## Files Requiring Changes (Estimated)

| Category | File Count | Priority |
|----------|------------|----------|
| Naming Fixes | 8 files | HIGH |
| Agent Count Fixes | 4 files | HIGH |
| Employee Limit Fixes | 2 files | MEDIUM |
| PDF Generator Updates | 11 files | MEDIUM |
| Tier Hierarchy Review | 2 files | LOW |

**Total Estimated Changes**: ~27 files

---

## Verification Checklist

After fixes, verify consistency across:
- [ ] All console names match "Outreach & Sales Ops" standard
- [ ] Agent counts per tier match across all sources
- [ ] Employee limits match across all sources
- [ ] PDF exports show correct data
- [ ] Landing page features match documentation
- [ ] Subscription page shows all 7 tiers
- [ ] Sidebar labels match console page headers
- [ ] Help content matches feature tooltips

---

## Technical Notes

The centralized data source (`src/lib/documentationConfig.ts`) should be the single source of truth. All other files should import from it rather than defining inline data. This includes:
- Tier pricing and features
- Agent names and descriptions
- Console configurations
- Employee limits

Current violations where inline data exists:
- `Subscription.tsx` defines its own TIERS array
- `PricingComparisonTable.tsx` defines featureDescriptions inline
- `Index.tsx` defines agentCategories inline
- Most PDF generators define data inline

