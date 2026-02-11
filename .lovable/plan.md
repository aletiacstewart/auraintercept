

# Complete Platform Audit Report

## Overview

After a deep dive into the entire codebase -- all pages, consoles, PDFs, help docs, configs, landing page, subscription page, export documents, and legal pages -- I've identified **6 critical categories** of issues requiring fixes.

---

## Category 1: Pricing and Tier Name Inconsistencies (CRITICAL)

The platform has **3 different sets of pricing/naming** depending on where you look. The single source of truth (`documentationConfig.ts`) says one thing, while the Subscription page and several PDFs say another.

### Source of Truth (`documentationConfig.ts` + `subscriptionAgentConfig.ts`)

| Internal ID | Display Name | Price |
|---|---|---|
| express / starter | Aura Starter | $197 |
| aura_flow / scheduling | Aura Scheduling | $397 |
| halo / growth | Aura Growth | $597 |
| core / business | Aura Business | $797 |
| single_point / field_ops | Aura Field Ops | $1,497 |
| multi_track / performance | Aura Performance | $3,497 |
| command | Aura Command | $5,497 |

### Subscription Page (`Subscription.tsx`) -- WRONG

| What it shows | Source of Truth |
|---|---|
| "Aura Express" $197 | Should be "Aura Starter" $197 |
| "Aura Flow" $297 | Should be "Aura Scheduling" $397 |
| "Aura Halo" $397 | Should be "Aura Growth" $597 |
| "Aura Core" $500 | Should be "Aura Business" $797 |
| "Single-Point" $1,500 | Should be "Aura Field Ops" $1,497 |
| "Multi-Track" $3,997 | Should be "Aura Performance" $3,497 |
| "Aura Pro Command" $5,997 | Should be "Aura Command" $5,497 |
| Employee limits: 2/2/3/2/5/10/25 | Should be: 2/3/5/8/15/25/50 |

### Subscription Page Feature Comparison Table -- WRONG

The `sections` array in `Subscription.tsx` only shows 4 columns (Core, Single-Point, Multi-Track, Command) using old names and old prices. Should show all 7 tiers with correct names.

### PricingSummaryPDF Comparison Table -- PARTIALLY WRONG

- Page title says "Complete 7-Tier Comparison" but only shows 6 columns (missing Scheduling tier)
- Uses old variable names but pulls correct prices from `documentationConfig.ts`
- Text on line 434 says "five subscription tiers" -- should say seven
- Hardcoded prices in the comparison table rows ($500, $1,500, $3,997, $5,997) don't match source of truth

### Agent/Console Counts -- Inconsistent

| Tier | Source of Truth | Subscription Page |
|---|---|---|
| Growth | 11 agents, 3 consoles | 3 agents, 1 console |
| Business | 12 agents, 4 consoles | 0 agents, 0 consoles |
| Field Ops | 18 agents, 6 consoles | 3 agents, 1 console |
| Performance | 22 agents, 7 consoles | 10 agents, 2 consoles |
| Command | 24 agents, 7 consoles | 24 agents, 7 consoles |

### Files Affected
- `src/pages/Subscription.tsx` -- Wrong names, prices, agent/console counts, employee limits, feature table
- `src/components/documentation/PricingSummaryPDF.tsx` -- Hardcoded wrong prices in comparison table, says "five tiers"
- `src/components/documentation/PlatformDocumentPDF.tsx` -- References $297 for "Aura Flow", old tier structure
- `src/components/documentation/ComprehensiveGuidesPDF.tsx` -- Old names and prices ($1,500, $3,997, $5,997)
- `src/components/documentation/BrandAssetGuidePDF.tsx` -- Old tier names in color swatches ("Aura Express Orange", "Aura Flow Teal", "Multi-Track Purple")
- `src/components/documentation/SalesPitchDataPDF.tsx` -- ROI calculations using old pricing

---

## Category 2: Landing Page and Public-Facing Content

### `PricingComparisonTable.tsx` (Landing Page) -- CORRECT (mostly)
This file uses the NEW names (Starter, Scheduling, Growth, Business, Field Ops, Performance, Command) and correct pricing ($197, $397, $597, $797, $1,497, $3,497, $5,497). However:
- Line 62/68: References "Twilio" instead of "SignalWire" in feature descriptions and integration table (lines 188-189)
- Line 188: Integration row says "Twilio (SMS & Voice)" -- platform uses SignalWire, not Twilio

### `Index.tsx` (Landing Page)
- Integration cost section (lines 1149-1226) uses old tier names: "Halo, Single-Point, Multi-Track, Command" instead of new names
- Same "Required for" descriptions reference old names

---

## Category 3: Help Content Config Misalignment

### `helpContentConfig.ts`
- Uses `SubscriptionTier` type names correctly (starter, scheduling, growth, etc.)
- BUT the `social_media` console (line 211) lists tabs as `['Home', 'Social Posts', 'Content Engine', 'Web Presence', 'Blog']` which includes Content Engine and Web Presence tabs that belong to the `creative_web_presence` console, not Social Media
- Social Media console in `documentationConfig.ts` lists tabs as `['Home', 'Social Posts', 'Analytics']` -- these don't match
- Field Operations console tabs (line 104): Lists action-oriented labels like "Accept Job", "Get Directions" etc. while `documentationConfig.ts` lists structural tabs like "Map View", "Schedule", "Dispatch", "Check-in" -- inconsistent representation
- Business Management console help lists `Admin Agent` at tier `performance` but `documentationConfig.ts` lists it at tier `command`
- Business Management help lists `Quoting Agent` at tier `field_ops` but `documentationConfig.ts` lists it at tier `multi_track`

---

## Category 4: Copyright and Date Issues

### Outdated Copyright
- `PublicFooter.tsx` line 59: Shows "2025" -- should be "2026" (current date is Feb 2026)

### Documentation Timestamp
- `documentationConfig.ts` line 4: Says "Last updated: January 2026" -- should be updated to February 2026

---

## Category 5: Integration Naming ("Twilio" vs "SignalWire")

The platform uses **SignalWire** for SMS and voice, but several files still reference **Twilio**:

- `PricingComparisonTable.tsx` lines 62, 68, 188: "Twilio (SMS & Voice)"
- This is a **compliance and accuracy issue** -- customers reading the feature comparison will configure the wrong service

The rest of the platform correctly uses "SignalWire" in:
- `documentationConfig.ts` integrations
- `Subscription.tsx` (ironically uses the old names but correct vendor)
- All edge functions

---

## Category 6: Subscription Page Feature Comparison Table Structure

The `Subscription.tsx` feature comparison table (lines 227-318) has a fundamentally broken structure:
- Only shows 4 columns: Core, Single-Point, Multi-Track, Command
- Missing 3 tiers entirely: Starter, Scheduling, Growth
- Uses `FeatureRow` interface with only `core`, `singlePoint`, `multiTrack`, `command` properties
- Should mirror the 7-column layout from `PricingComparisonTable.tsx` which is correct

---

## Implementation Plan

### Phase 1: Fix Source of Truth Date
1. Update `documentationConfig.ts` header to "February 2026"
2. Update `PublicFooter.tsx` copyright to "2026"

### Phase 2: Fix Subscription Page (Highest Impact)
1. Replace the hardcoded `TIERS` array with data from `documentationConfig.ts` using the `SUBSCRIPTION_TIERS` import
2. Update the feature comparison `sections` to 7-column layout matching `PricingComparisonTable.tsx`
3. Update the `TIER_EMPLOYEE_LIMITS` to match source of truth (2/3/5/8/15/25/50)

### Phase 3: Fix PDFs
1. `PricingSummaryPDF.tsx`: Fix hardcoded prices in comparison table, change "five" to "seven", add missing Scheduling column
2. `PlatformDocumentPDF.tsx`: Update Aura Flow reference to Aura Scheduling with $397
3. `ComprehensiveGuidesPDF.tsx`: Update old tier names and prices
4. `BrandAssetGuidePDF.tsx`: Update color swatch tier names
5. `SalesPitchDataPDF.tsx`: Update ROI calculations

### Phase 4: Fix Landing Page
1. `PricingComparisonTable.tsx`: Change "Twilio" to "SignalWire" (3 locations)
2. `Index.tsx`: Update integration section tier name references

### Phase 5: Fix Help Content
1. `helpContentConfig.ts`: Fix Social Media console tabs to remove Content Engine/Web Presence tabs, align agent tier requirements with source of truth

### Estimated Scope
- **13 files** need updates
- **~50+ individual data points** are mismatched
- Priority: Subscription page and PDFs (customer-facing documents with wrong pricing)

