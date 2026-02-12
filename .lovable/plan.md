

## Rename Three Subscription Tiers Platform-Wide

### Name Changes
- **Aura Scheduling** --> **Aura Connect**
- **Aura Business** --> **Aura Presence**
- **Aura Field Ops** --> **Aura Logistics**

**Important:** The "Field Operations Console" and "Field Ops" as a feature/console name stays the same. Only the **subscription tier name** changes.

### Stripe Price Alignment
The current Stripe prices don't match the platform's documented prices. New Stripe products and prices will be created for the three renamed tiers at the correct amounts:

| Tier (New Name) | Config Price | Current Stripe Price | Action |
|---|---|---|---|
| Aura Connect | $397/mo | $297/mo (price_1SxfFN...) | Create new product + price at $397 |
| Aura Presence | $797/mo | $500/mo (price_1StwXq...) | Create new product + price at $797 |
| Aura Logistics | $1,497/mo | $1,500/mo (price_1StwY2...) | Create new product + price at $1,497 |

The other 4 tiers (Starter, Growth, Performance, Command) also have Stripe price mismatches but are out of scope for this change unless you'd like those fixed too.

---

### Files to Update (18 files)

**Central Config (Source of Truth):**
1. `src/lib/documentationConfig.ts` -- Update tier names, update "Everything in Field Ops" to "Everything in Logistics" in Performance highlights
2. `src/lib/subscriptionAgentConfig.ts` -- Update label and comments
3. `src/lib/helpContentConfig.ts` -- Update titles and "Everything in Field Ops" reference

**Stripe Backend Functions:**
4. `supabase/functions/create-checkout/index.ts` -- Update tier names + swap in new Stripe price IDs
5. `supabase/functions/check-subscription/index.ts` -- Update tier name comments + add new price ID mappings

**Pages:**
6. `src/pages/Auth.tsx` -- Update tier display names in signup plan selector
7. `src/pages/Subscription.tsx` -- Update tier names in subscription cards
8. `src/pages/Index.tsx` -- Update homepage pricing section

**Landing/Marketing Components:**
9. `src/components/landing/PricingComparisonTable.tsx` -- Update column headers

**PDF/Documentation Exports (6 files):**
10. `src/components/documentation/ComprehensiveGuidesPDF.tsx`
11. `src/components/documentation/PricingSummaryPDF.tsx`
12. `src/components/documentation/BrandAssetGuidePDF.tsx`
13. `src/components/documentation/VideoScriptsPDF.tsx`
14. `src/components/documentation/PlatformFAQPDF.tsx`
15. Plus any other PDF components referencing these names

**Audit System:**
16. `src/components/audit/types.ts` -- Update tier recommendation labels

**Other:**
17-18. Any remaining files from the 18 identified

### Implementation Order
1. Create 3 new Stripe products and prices (Aura Connect $397, Aura Presence $797, Aura Logistics $1,497)
2. Update `documentationConfig.ts` (source of truth) with new names
3. Update all 17 remaining files with find-and-replace of the three tier names
4. Update edge functions with new Stripe price IDs
5. Deploy updated edge functions

### What Stays the Same
- Internal IDs (`aura_flow`, `core`, `single_point`, `scheduling`, `business`, `field_ops`) remain unchanged in code keys
- "Field Operations Console" and "Field Ops" as feature/console names are NOT renamed
- "Technician-Field Ops" console branding stays as-is
- All other tier names (Starter, Growth, Performance, Command) are unchanged
