
## New Pricing Matrix

| Tier  | Normal (strikethrough) | Beta (billed)   | Annual Normal (~20% off ×12) | Annual Beta (~20% off ×12) |
|-------|------------------------|-----------------|------------------------------|----------------------------|
| Core  | $697 / mo              | $497 / mo       | $6,691                       | $4,771                     |
| Boost | $1,394 / mo            | $994 / mo       | $13,382                      | $9,542                     |
| Pro   | $2,788 / mo            | $1,988 / mo     | $26,765                      | $19,085                    |
| Elite | $5,576 / mo            | $3,979 / mo     | $53,530                      | $38,198                    |

Annual = `round(monthly × 12 × 0.8)`. Both monthly and annual show strikethrough normal + billed beta + "Beta Pricing" chip everywhere.

### Blocker — need from you before implementing
**Onboarding (one-time) fees:** you chose "I'll specify exact amounts". Please reply with 8 numbers in this format:
`Core: normal $___ / beta $___ · Boost: $___ / $___ · Pro: $___ / $___ · Elite: $___ / $___`
(For reference, current values are Core 349/249, Boost 549/449, Pro 999/899, Elite 1749/1549.)

---

## Scope of Changes

### 1. Source-of-truth pricing layer
- Rewrite `src/lib/launchPricing.ts` to the new matrix. Rename label `Launch Pricing` → `Beta Pricing`. Keep `LAUNCH_PRICING.active` toggle.
- Add `annualOriginal` / `annualSale` per tier (computed but stored explicitly so PDFs/Stripe don't drift).
- Update `mem://billing/launch-pricing` and the Core memory line to the new numbers.
- Update `mem://marketing/pricing/canonical-four-tier-model`.

### 2. Stripe (8 new prices + migration)
- Create 8 new products/prices: 4 normal + 4 beta, monthly recurring. (Annual prices created in a second pass once monthly is live; flag below.)
- Wire new `price_*` IDs into `src/lib/launchPricing.ts` and the edge functions that resolve tier → price ID (`create-checkout`, `check-subscription`, `LEGACY_TIER_MAP`).
- Keep existing `Tee*` and `Tdvk*` IDs in `LEGACY_TIER_MAP` so check-subscription still recognizes them as the same tier.
- **Migrate existing active subs** to the new monthly beta price via a one-off edge function `migrate-subs-to-beta-2026`: lists active subs, matches old price → new beta price, calls `stripe.subscriptions.update` with `proration_behavior: 'none'` (no surprise charges, applies at next renewal). Run once, log results.
- Decision needed on annual: confirm you want me to also create 8 annual prices now, or monthly-only for this pass.

### 3. UI / marketing surfaces
Update every place that hardcodes a price string. Most read from `launchPricing.ts` and `SalePrice`/`SalePriceInline` and update automatically; the rest need manual edits:
- `src/components/agents/TierComparisonCards.tsx` — strikethrough + sale row at bottom.
- `src/lib/diyCostBreakdown.ts` — `auraMonthly` per tier (497 → 497, 897 → 994, 1797 → 1988, 3097 → 3979). DIY comparison line items unchanged.
- `src/pages/Index.tsx`, `src/pages/SignUp.tsx`, `src/pages/ForBusiness.tsx`, `src/pages/Calculators.tsx`, pricing sections of marketing components.
- Tier comparison / upgrade-delta copy ($300, $500, $1000 deltas → $497, $994, $1991).
- Any "Save ~20%" annual copy verified against new numbers.

### 4. PDFs & documents
Regenerate-on-render PDFs that embed pricing:
- `src/components/documentation/CompanyOnboardingPDF.tsx`
- Outreach toolkit PDFs under `src/components/documentation/*` (audit checklist, sales packet, etc.) — sweep for `$697|$1,?097|$1,?997|$3,?497|$497|$897|$1,?797|$3,?097` and replace via central helpers.
- `src/lib/documentationConfig.ts` `implementationFee` per tier ← new onboarding numbers.
- Audit / `AuditReport.tsx` pricing call-outs.

### 5. Database
- Migration: update `companies.subscription_tier_price` (or equivalent cached price columns) for active rows to the new beta monthly amount keyed by tier.
- Insert (not migration): backfill `subscription_events` with a `pricing_migration_2026_beta` row per affected company for audit trail.
- Refresh demo seeder so `/dashboard/demo-seeder` reflects new prices.

### 6. Memory updates
- `mem://billing/launch-pricing` → new numbers + new Stripe price IDs + note about migration.
- `mem://marketing/pricing/canonical-four-tier-model` → new normal/beta tables.
- Update Core rule line in `mem://index.md`.

---

## Verification checklist (run after build)
1. `/` homepage and `/sign-up` show strikethrough normal + beta price for all 4 tiers, both monthly and annual.
2. Tier comparison card row shows `~$697 $497`, `~$1,394 $994`, `~$2,788 $1,988`, `~$5,576 $3,979`.
3. `create-checkout` for each tier returns a session with the new beta `price_*`.
4. `check-subscription` correctly maps both legacy and new price IDs to the same tier label.
5. Generated `CompanyOnboardingPDF` and audit PDF show new pricing and new onboarding fees.
6. Existing test subscriber on Stripe sandbox auto-renews at the new beta price after migration script run.

---

## Reply before I start
1. The 8 onboarding amounts (required).
2. Annual Stripe prices now, or monthly-only first pass?
