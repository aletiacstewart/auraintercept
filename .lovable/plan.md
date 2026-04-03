

# 3-Tier Pricing Consolidation: Deep Audit & Migration Plan

## The Problem

The platform has **7 different tier names and prices** scattered across 30+ files, but the correct model is **3 tiers only**:

| Tier | Price | Operatives | Consoles | Employees |
|------|-------|-----------|----------|-----------|
| **Aura Connect** | $297/mo | 5 (triage, customer_journey, outreach, creative_content, web_presence) | 4 (Customer Portal, Marketing/Sales, Social Media, Creative/Web) | 5 |
| **Aura Performance** | $497/mo | 8 (+ dispatch, field_navigation, business_finance) | 6 (+ Field Ops, Business Mgmt) | 15 |
| **Aura Command** | $697/mo | All 10 (+ admin, analytics_intelligence) | All 7 + AI Operatives Hub | Unlimited |

**Tiers to REMOVE entirely**: Aura Starter ($197), Aura Connect ($397 — old price), Aura Growth ($597), Aura Presence ($797), Aura Logistics ($1,497)

---

## Files Requiring Changes (Grouped by Area)

### 1. Source of Truth Config Files

| File | Change |
|------|--------|
| `src/lib/subscriptionAgentConfig.ts` | Remove `growth` and `field_ops` tiers from `SubscriptionTier` type, `TIER_AGENT_CONFIG`, `TIER_HIERARCHY`, `TIER_FEATURE_CONFIG`. Update `connect` to include 5 agents + 4 consoles at $297. Keep legacy maps pointing old names → 3 canonical tiers. |
| `src/lib/documentationConfig.ts` | Remove `aura_growth` and `single_point` tier configs. Rename `aura_connect` price to 297, update operatives/consoles/employees. Rename `multi_track` → keep as performance key. Update `TIER_ORDER` to 3 entries. Update `LEGACY_TIER_ID_MAP`. |

### 2. Edge Functions (Backend)

| File | Change |
|------|--------|
| `supabase/functions/check-subscription/index.ts` | Map all old price IDs to 3 canonical tiers (connect, performance, command). Remove "7-TIER" comments. Map starter/scheduling/growth/business/field_ops → connect or performance. |
| `supabase/functions/create-checkout/index.ts` | Reduce to 3 tier entries with correct Stripe price IDs ($297, $497, $697). Keep legacy ID aliases pointing to canonical 3. |
| `supabase/functions/landing-chat/index.ts` | Update system prompt to describe 3 tiers only. |

### 3. Auth & Signup

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replace 7-tier selector with 3-tier selector (Connect $297, Performance $497, Command $697). Remove all industry-specific tier grouping. Update `selectedTier` type. |

### 4. Subscription & Pricing Pages

| File | Change |
|------|--------|
| `src/pages/Subscription.tsx` | Replace 7-tier `TIERS` array with 3. Rebuild comparison table for 3 columns. Update FAQ section. |
| `src/pages/DemoAccounts.tsx` | Reduce demo accounts to 3 tiers + platform admin. Update tier features. |

### 5. Homepage

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Change "24 Smart AI Agents" → "10 AI Operatives". Update any pricing references on the landing page. |

### 6. Help & Documentation

| File | Change |
|------|--------|
| `src/components/help/AIHelpCenter.tsx` | Update embedded knowledge base text from 7-tier to 3-tier. |
| `src/pages/Help.tsx` | Update FAQ references from 24 agents / 7 tiers to 10 operatives / 3 tiers. |
| `src/pages/PlatformGuides.tsx` | Update tier listing in guide content. |
| `src/pages/ExportDocumentation.tsx` | Update "7-Tier" references to "3-Tier". |
| `src/pages/TermsOfService.tsx` | Update "$197 to $697 across 7 tiers" → "$297 to $697 across 3 tiers". |
| `src/pages/Contact.tsx` | Update tier selector dropdown from 7 to 3 options. |

### 7. PDF Documentation Components

| File | Change |
|------|--------|
| `src/components/documentation/ComprehensiveGuidesPDF.tsx` | Rewrite all tier listings to 3-tier model. |
| `src/components/documentation/PlatformFAQPDF.tsx` | Update FAQ answers to 3-tier model. |
| `src/components/documentation/PricingSummaryPDF.tsx` | Rebuild entire PDF for 3 tiers instead of 7. |
| `src/components/documentation/SalesPitchDataPDF.tsx` | Update ROI calculators and tier cards to 3. |
| `src/components/documentation/BrandAssetGuidePDF.tsx` | Remove extra tier color swatches, keep 3. |
| `src/components/documentation/WebsiteCopyPDF.tsx` | Rewrite copy blocks for 3 tiers. |
| `src/components/documentation/SocialMediaContentPackPDF.tsx` | Update pricing references. |

### 8. Audit System

| File | Change |
|------|--------|
| `src/components/audit/types.ts` | Reduce `TierType` from 7 to 3. Update tier configs, scores, and question mappings. |
| `src/components/audit/AgentOpportunityAudit.tsx` | Update tier scoring to 3 tiers. |
| `src/components/audit/AuditResults.tsx` | Update comparison table to 3 tiers. |

### 9. Other UI References

| File | Change |
|------|--------|
| `src/pages/TalkToAura.tsx` | Update `tierLabels` map to 3 tiers. |
| `src/pages/VideoPromptsPage.tsx` | Update "24 AI" references to "10 AI operatives". |
| `src/pages/IntegrationDocs.tsx` | Update tier references. |
| `src/components/landing/CompetitiveDifferentiation.tsx` | Update "From $397" → "From $297". |

---

## Implementation Strategy

Due to the sheer volume (~30+ files, thousands of lines), this will be executed in **4 batches**:

**Batch 1 — Config & Backend** (Critical path): `subscriptionAgentConfig.ts`, `documentationConfig.ts`, `check-subscription`, `create-checkout`, `landing-chat`

**Batch 2 — Core UI Pages**: `Auth.tsx`, `Subscription.tsx`, `Index.tsx`, `DemoAccounts.tsx`, `Help.tsx`, `Contact.tsx`, `TermsOfService.tsx`

**Batch 3 — PDF Documentation**: All 7 PDF component files + `ExportDocumentation.tsx` + `PlatformGuides.tsx`

**Batch 4 — Audit & Misc**: Audit system files, `TalkToAura.tsx`, `VideoPromptsPage.tsx`, `AIHelpCenter.tsx`, `CompetitiveDifferentiation.tsx`, `IntegrationDocs.tsx`

### Key Decisions
- **Agent count**: 10 operatives (not 24) across the platform
- **Console count**: 7 consoles (unchanged)
- **Legacy Stripe price IDs**: Keep in `check-subscription` for backward compatibility with existing subscribers, but map them all to the 3 canonical tiers
- **"24 Smart AI Agents"**: Replace with "10 AI Operatives" on homepage and all marketing materials
- **Annual pricing**: Connect $2,970/yr, Performance $4,970/yr, Command $6,970/yr

