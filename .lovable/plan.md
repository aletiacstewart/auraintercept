
## Price Update: Performance $497 & Command $697

Simple price change across all files. No structural changes — only price values updated.

| Tier | Old Price | New Price | Old Annual | New Annual |
|---|---|---|---|---|
| Aura Performance | $2,497 | **$497** | $24,970 | **$4,970** |
| Aura Command | $3,497 | **$697** | $34,970 | **$6,970** |

Annual savings recalculate as: Performance saves $994/yr, Command saves $1,394/yr (based on 2 months free = 10x monthly).

---

### Files to Update

**1. `src/lib/documentationConfig.ts`**
- `multi_track` (Performance): price 2497→497, annualPrice 24970→4970, annualSavings 4994→994
- `command`: price 3497→697, annualPrice 34970→6970, annualSavings 6994→1394

**2. `src/lib/subscriptionAgentConfig.ts`**
- `performance`: price string `'$2,497/mo'` → `'$497/mo'`
- `command`: price string `'$3,497/mo'` → `'$697/mo'`

**3. `src/components/agents/AgentRequirementCalculator.tsx`**
- `TIER_PRICES`: performance 2497→497, command 3497→697

**4. `src/pages/Subscription.tsx`**
- `TIERS` array: `multi_track` monthlyPrice `$2,497`→`$497`, annualPrice `$24,970`→`$4,970`, annualSavings `Save $4,994`→`Save $994`
- `command` monthlyPrice `$3,497`→`$697`, annualPrice `$34,970`→`$6,970`, annualSavings `Save $6,994`→`Save $1,394`
- Pricing section `sections` array: performance column `$2,497`→`$497`, command `$3,497`→`$697`
- Annual row: performance `$24,970`→`$4,970`, command `$34,970`→`$6,970`
- Annual savings row: performance `Save $4,994`→`Save $994`, command `Save $6,994`→`Save $1,394`
- FAQ text at line ~862: update price references
- `TIER_EMPLOYEE_LIMITS` stays the same (not price-related)

**5. `src/pages/Auth.tsx`**
- Tier picker: `multi_track` price `'$2,497'`→`'$497'`, `command` price `'$3,497'`→`'$697'`

**6. `supabase/functions/create-checkout/index.ts`**
- `performance`: price 249700→49700, comment `$2,497`→`$497`
- `command`: price 349700→69700, comment `$3,497`→`$697`
- `multi_track` alias: price 249700→49700

**7. `supabase/functions/check-subscription/index.ts`**
- Update comments: `$2,497/month`→`$497/month`, `$3,497/month`→`$697/month`

**8. `supabase/functions/landing-chat/index.ts`**
- System prompt: update `Aura Performance ($2,497/mo)`→`($497/mo)`, `Aura Command ($3,497/mo)`→`($697/mo)`

**9. `src/pages/PlatformGuides.tsx`**
- Update price strings for Performance and Command

**10. `src/components/documentation/PlatformFAQPDF.tsx`**
- Update FAQ answer mentioning old prices

**11. `src/components/landing/PricingComparisonTable.tsx`**
- Update performance and command columns in pricing section

**12. `src/pages/DemoAccounts.tsx`**
- Performance price `$2,497/mo`→`$497/mo`, Command `$3,497/mo`→`$697/mo`

**13. `src/pages/TermsOfService.tsx`**
- Update price range mention from `$3,497` → `$697`

**14. `src/components/documentation/BrandAssetGuidePDF.tsx`**
- Update color swatch usage labels for Performance and Command

**15. `src/pages/AIAgentGuide.tsx`**
- Update command cost references from `$3,497` → `$697`

**16. `src/components/documentation/SalesPitchDataPDF.tsx`**
- Update any Performance/Command price references

**17. `supabase/functions/ai-agent-chat/index.ts`**
- Update comments referencing `$2,497/mo` and `$3,497/mo`

**18. `src/pages/Help.tsx`**
- Update price reference for Command tier

**19. `src/pages/ExportDocumentation.tsx`**
- Update page description mentioning old prices

**20. `src/components/smartwebsite/VisitorLimitModal.tsx`**
- Command price `$3,497/mo`→`$697/mo`

**Note on Stripe**: The existing Stripe price IDs (`price_1T02XqJ9fo9y8fGHMDDvQxR3` for Performance, `price_1T02YAJ9fo9y8fGHJ7Q7g4Cq` for Command) are linked to old amounts in Stripe. New price IDs will need to be created in Stripe at $497 and $697 and swapped in `create-checkout` and `check-subscription`. The plan will add placeholder comments noting this, and the old price IDs will remain as legacy fallbacks.
