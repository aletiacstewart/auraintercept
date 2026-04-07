

# Remove Multi-Location Claims + Test AI Agent Flow

## Part 1: Remove "Multi-location support" from Elite tier (13 files)

Strip all multi-location/franchise references from the Elite tier description since this feature is not implemented. Replace with accurate language about the full agent suite.

### Files to update:

1. **`src/lib/documentationConfig.ts`** (lines 119, 131)
   - Remove `'Multi-location support'` from highlights array
   - Change `bestFor` from "Multi-location franchises, property management firms, enterprise teams" to "Large service teams, property management firms, enterprise operations"

2. **`src/lib/helpContentConfig.ts`** (line 430)
   - Remove `'Multi-location support'` from command tier highlights

3. **`src/pages/Index.tsx`** (lines 69, 902-903)
   - Admin Agent description: change "multi-location support" to "access control"
   - Elite card: change "Multi-Location / Enterprise" to "Full Suite / Enterprise" and update bestFor text

4. **`src/pages/Auth.tsx`** (line 746)
   - Change Elite subtitle from "Multi-Location • Franchise • Enterprise" to "Full Suite • Enterprise • Unlimited"

5. **`src/pages/DemoAccounts.tsx`** (line 71)
   - Change businessType from "Multi-Location Enterprise" to "Enterprise Operations"

6. **`src/pages/PlatformGuides.tsx`** (line 381)
   - Remove "multi-location" from Admin Agent step description

7. **`src/components/audit/types.ts`** (lines 9, 55-57, 483)
   - Update ELITE comment, remove multi_location audit question, update Elite description

8. **`src/components/landing/PricingComparisonTable.tsx`** (line 28)
   - Admin Agent tooltip: remove "multi-location support"

9. **`src/components/documentation/SalesPitchDataPDF.tsx`** (lines 561, 564, 734, 807)
   - Remove multi-location references from sales pitch content

10. **`src/pages/Subscription.tsx`** — verify no multi-location references (likely clean)

## Part 2: Test AI Agent Flow End-to-End

Run the `ai-agent-health` endpoint and then invoke `ai-agent-chat` with test messages for each of the 10 consolidated operatives to verify:
- Health check passes (DB connectivity, agent configs, API keys)
- Each operative responds correctly
- Tier gating works (locked agents return proper 403)
- Handoff routing works (triage → customer_journey → dispatch chain)
- Legacy agent name normalization works

### Test sequence:
1. Call `ai-agent-health` with the demo company ID
2. Call `ai-agent-chat` for each of the 10 operatives: `triage`, `customer_journey`, `dispatch`, `field_navigation`, `admin`, `business_finance`, `outreach`, `creative_content`, `web_presence`, `analytics_intelligence`
3. Test a handoff scenario: send a booking request to triage, verify it hands off to customer_journey
4. Report results with pass/fail per agent and any errors found

## Execution order
1. Remove multi-location claims (all files in parallel)
2. Run agent health check
3. Run agent chat tests
4. Report findings and fix any issues

