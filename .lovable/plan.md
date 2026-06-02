# Pricing Update — Locked Numbers & DIY Breakdown

## New canonical pricing (effective immediately, no beta delay)

| Tier  | Monthly  | Onboarding (half) | Old monthly | Old onboarding |
|-------|----------|-------------------|-------------|----------------|
| Core  | **$697** | **$349**          | $497        | $497           |
| Boost | **$1,097** | **$549**        | $697        | $697           |
| Pro   | **$1,997** | **$999**        | $1,197      | $1,197         |
| Elite | **$3,497** | **$1,749**      | $2,197      | $2,197         |

Onboarding is exactly half of the new monthly (rounded to nearest whole dollar). This **breaks** the existing core memory rule "monthly price equals onboarding fee" — that rule will be replaced with "onboarding fee = 50% of monthly, rounded to nearest dollar."

Yearly "Save ~20%" math will be recomputed per tier (e.g. Core $697 × 12 × 0.8 ≈ $6,691/yr — rounded down to a clean number per existing display).

## Scope

This is a global sweep. Every surface that displays or computes tier prices gets updated in lockstep so nothing shows a stale number. **No** changes to feature scope, agent counts, employee counts, or 3rd-party policy — only dollar amounts.

## Files to update (grouped)

### 1. Source-of-truth config (do these first)
- `src/lib/subscriptionAgentConfig.ts` — canonical tier price map
- `src/lib/documentationConfig.ts` — tier limits/labels
- `src/lib/helpSystemPrompt.ts` — AI agent system prompt pricing
- `src/components/audit/types.ts` — audit recommendation copy
- `supabase/functions/check-subscription/index.ts` — Stripe price → tier mapping (keeps LEGACY_TIER_MAP entries so old $497/$697/$1,197/$2,197 Stripe price IDs still resolve correctly during migration)
- `supabase/functions/create-checkout/index.ts` — new price IDs
- `supabase/functions/ai-agent-chat/index.ts` — operative pricing references
- `supabase/functions/landing-chat/index.ts` — landing chatbot pricing
- `supabase/functions/trial-reminders/index.ts` — onboarding fee in reminders

### 2. UI pages
- `src/pages/Index.tsx` — 4 plan cards, onboarding fee panel, "Why an onboarding fee" copy
- `src/pages/Subscription.tsx`
- `src/pages/AIAgentGuide.tsx`
- `src/pages/PublicOnboardingIntake.tsx`
- `src/pages/PlatformGuides.tsx`
- `src/pages/Contact.tsx`
- `src/pages/ExportDocumentation.tsx`
- `src/pages/DemoAccountSeeder.tsx`
- `src/pages/Help.tsx`

### 3. Components
- `src/components/landing/PricingComparisonTable.tsx`
- `src/components/marketing/IndustryROICalculator.tsx` (cost-side math)
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`
- `src/components/smartwebsite/VisitorLimitModal.tsx`
- `src/components/agents/AgentDependencyDiagram.tsx`

### 4. PDF documentation (all referenced PDFs)
- `CompanyOnboardingPDF.tsx`
- `PricingSummaryPDF.tsx`
- `PlatformFAQPDF.tsx`
- `PlatformDocumentPDF.tsx`
- `MarketingSalesMasterPDF.tsx`
- `ComprehensiveGuidesPDF.tsx`
- `BrandAssetGuidePDF.tsx`
- `AIAgentGuidesPDF.tsx`
- `WebsiteCopyPDF.tsx`
- `VideoScriptsPDF.tsx`
- `SalesPitchDataPDF.tsx`

### 5. Memory rules (rewrite, don't append)
- `mem://index.md` Core rule for 4-Tier Model — change to new numbers + "onboarding = 50% of monthly"
- `.lovable/memory/marketing/pricing/canonical-four-tier-model.md`
- `.lovable/memory/architecture/canonical-naming-registry.md`
- Any other memory file that hardcodes the old `$497/$697/$1,197/$2,197` pair

### 6. Database migration
New migration file (do NOT edit existing migrations) that:
- Updates default tier-pricing data in any seeded table if such a table exists
- Adds a comment on the `subscription_tier` column noting the new canonical prices
- Leaves existing customer subscription rows untouched (price changes apply to new signups; existing customers continue on whatever Stripe price they were enrolled in until Stripe-side migration)

### 7. Stripe (manual, post-deploy)
Stripe products/prices are not auto-created here. After code ships, new Stripe Prices must be created for each tier at the new monthly amounts and the new price IDs pasted into `create-checkout` and `check-subscription`. Old price IDs remain in `LEGACY_TIER_MAP` for grandfathering.

## DIY breakdown — add at bottom of "See More Details"

`src/pages/Index.tsx` collapsible (already wraps `<PricingComparisonTable />`) gets a new section rendered after it: **"What Would It Cost To Build This Yourself?"**

Implemented as two new files:
- `src/lib/diyCostBreakdown.ts` (data) — per-tier line items with `{label, low, high}` ranges and totals
- `src/components/landing/DiyCostBreakdown.tsx` (component) — 4-column responsive grid using existing `dark-card-surface` + cyan accent styling

Per-tier line items and totals (monthly USD, U.S. market pricing):

**Core ($697 Aura)** — AI receptionist $300–900 · web chat/SMS AI $80–300 · scheduling $20–60 · website builder $25–75 · email tools $30–120 · social posting $15–45 · analytics $0–70 · setup contractor $1,500–4,000 one-time → **DIY ~$470–$1,570/mo + $1,500–$4,000 one-time** · vs Aura: **save up to ~$870/mo**

**Boost ($1,097 Aura)** — Core stack plus dispatch software $99–400 · route optimization $40–150 · tech mobile/GPS $125–400 (5 techs) · 10DLC SMS upgrade $20–80 · Zapier/Make $50–150 → **DIY ~$800–$2,750/mo + $1,500–$4,000 one-time** · vs Aura: **save ~$0–$1,650/mo**

**Pro ($1,997 Aura)** — Boost stack plus CRM (HubSpot Pro/Salesforce) $450–1,200 · marketing automation $200–600 · review platform (Birdeye/Podium) $300–600 · content tools (Jasper) $50–200 · AI contractor retainer $500–1,500 → **DIY ~$2,300–$6,850/mo + $5,000–$12,000 one-time** · vs Aura: **save ~$300–$4,850/mo**

**Elite ($3,497 Aura)** — Pro stack plus enterprise voice AI $400–1,500 · invoice/billing automation $200–500 · BI suite (Tableau/PowerBI) $150–500 · fractional AI engineer $1,500–2,500 · white-label portal (amortized) $300–800 → **DIY ~$4,850–$12,650/mo + $15,000–$40,000 one-time** · vs Aura: **save ~$1,350–$9,150/mo**

Footer disclaimer: *"Estimates based on publicly listed 2025 pricing for comparable tools and U.S. market rates. Actual costs vary by vendor, volume, region, and feature mix. Aura's per-tier price excludes 3rd-party usage fees (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC) — those are billed directly by each provider on either path."*

## Out of scope

- No Stripe Price object creation via API (manual step after code ships).
- No grandfathering UI or migration emails to existing customers (separate task if needed).
- No changes to feature lists, agent counts, employee seat counts, or trial length.
- No changes to 3rd-party pass-through fee panel.
- No new public route or new admin tool — the DIY block lives only inside the existing pricing collapsible on `/`.

## Technical notes

- Centralize new prices in `src/lib/subscriptionAgentConfig.ts` and import everywhere possible to avoid future drift. Where a file currently inlines the dollar figure, replace with the import.
- Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })` for DIY breakdown formatting.
- After updates, run a final ripgrep for `497`, `697`, `1,197`, `2,197`, `1197`, `2197` across `src/`, `supabase/`, `.lovable/`, and any remaining hits must be intentional (legacy Stripe price ID maps, migration comments).
