# Policy Change: All 3rd-Party Services → Customer-Owned Accounts

## New rule
Every 3rd-party provider (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Social APIs) requires the customer to:
1. Create their own account directly with the provider (compliance + ownership)
2. Put a valid credit card on file with that provider
3. Receive a separate bill from that provider, paid directly to them
4. Aura plan fees cover the Aura platform only — they do NOT include any 3rd-party usage

Concierge Onboarding still configures these accounts on the customer's behalf, but uses the customer's own login + credit card.

## Files to update

### 1. Core disclosure dialog (primary surface)
`src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`
- Rewrite `COST_ITEMS`: every entry → "Your own account required · billed separately by [Vendor]"
- Replace `estimatedCost` strings to drop "Bundled" wording; show provider's pricing page link + note "you pay [Vendor] directly"
- All items become `required: true` except Social (required only if using social posting) and Stripe (required only if collecting customer payments)
- Update dialog title/description: remove "bundled in your plan" language, replace with "Aura plan covers the Aura platform only. Each service below is billed separately by the provider — your account, your credit card, their invoice."
- Update Concierge copy: "We set up these accounts on your behalf using your login and card — you remain the account owner and billing contact."
- Update bottom amber callout: remove overage/metering language, replace with vendor-direct billing notice.

### 2. Signup / Auth page
`src/pages/Auth.tsx`
- Lines ~991–1008: rewrite intro paragraph + per-provider rows. Each row → "Your account · billed by [Vendor]" instead of "Bundled in tier"
- Line ~1407: rewrite final acknowledgement checkbox — single statement that ALL 3rd-party fees (SignalWire, ElevenLabs, Resend, Tavily, A2P 10DLC, Stripe, Social) are billed directly by the provider to the customer's card on file with that provider
- Keep tier prices unchanged; add a small clarifier "Platform only — 3rd-party usage billed separately by each provider"

### 3. Subscription / pricing page
`src/pages/Subscription.tsx`
- Lines 87, 106: change "(bundled)" → "(your provider accounts)"
- Lines 218, 243–249: rename section to "Required 3rd-Party Accounts (billed separately by each provider)" and change every cell from "Bundled" → "Your account"
- Add note under tier prices: "Platform only — provider usage billed separately"

### 4. Pricing comparison + landing
`src/components/landing/PricingComparisonTable.tsx`
- Lines 51, 144, 170: remove "bundled in every plan" tooltip and section copy; rewrite to "Requires your own SignalWire + ElevenLabs accounts (billed directly by each provider)"
`src/pages/Index.tsx` — sweep for any "bundled" / "included usage" claims and update to match.

### 5. Terms of Service
`src/pages/TermsOfService.tsx`
- Lines 76–80, 196: rewrite "Bundled Usage & Overages" section → "Third-Party Provider Accounts". State explicitly:
  - Customer must hold accounts at each provider, with a valid card on file
  - Provider invoices customer directly; Aura is not a billing intermediary
  - Aura plan fee does not include any provider usage

### 6. Documentation / PDFs / guides (sweep — change "bundled" → "your account")
- `src/lib/documentationConfig.ts` (lines 43, 74)
- `src/lib/demoFeatureStatus.ts` (lines 36, 43, 50)
- `src/components/documentation/PlatformDocumentPDF.tsx` (line 1227)
- `src/components/documentation/ComprehensiveGuidesPDF.tsx` (lines 247, 302, 356, 451)
- `src/components/documentation/CompanyOnboardingPDF.tsx` (lines 631–632)
- `src/components/documentation/CompanyGuidesPDF.tsx` (line 473)
- `src/components/documentation/AIAgentGuidesPDF.tsx` (lines 668, 1302)
- `src/components/documentation/PlatformFAQPDF.tsx` — update any FAQ mentioning bundled usage
- `src/pages/PlatformGuides.tsx` (line 161)

### 7. Integration pages + setup guides (sweep)
- `src/pages/Integrations.tsx` line 139 — Tavily note
- `src/pages/integrations/TavilyIntegration.tsx`, `VoiceIntegration.tsx`, `EmailIntegration.tsx`, `SMSIntegration.tsx`, `SocialMediaIntegration.tsx`, `CalendarIntegration.tsx`
- `src/components/integrations/TavilySetupGuide.tsx` (lines 117–145) — drop "bundled allowance" panel, replace with "Create your Tavily account → add card → enter API key"
- `src/components/integrations/SignalWireSetupGuide.tsx`, `ResendSetupGuide.tsx` — emphasize account creation + card on file

### 8. Memory updates
- `mem://index.md` Core: replace the "3rd-Party Fees" bullet with: "All 3rd-party services (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Social) require customer's own account + valid card; billed directly by each provider, separate from Aura plan fees."
- `mem://legal/third-party-fee-disclaimer` — rewrite to BYO-account-and-card-billed-separately policy
- `mem://billing/transparency/third-party-cost-disclosure` — update the UX standard to match new disclosure model

## Out of scope
- Tier price values (Core $197 / Boost $497 / Pro $997 / Elite $1,997) and onboarding fees stay unchanged
- Backend usage tracking, edge functions, Stripe price IDs — no code/data layer changes
- Provider integration code itself

## Approach
Single-pass implementation: update memory + disclosure dialog first (the source of truth), then sweep the listed surfaces with consistent copy. Final pass: `rg "bundled|pass-through|absorbed"` to catch stragglers.
