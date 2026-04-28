# Update Terms of Service & Privacy Policy

Audit confirmed both legal pages contain stale or inconsistent content versus current canonical truth (4-tier pricing, bundled 3rd-party usage with overage billing, 90-day trial, one-time implementation fees, 24-agent / 10-operative model, SignalWire-only telephony, Tavily search, Lovable Cloud branding).

## TermsOfService.tsx — Changes

**Effective Date** → bump to April 28, 2026.

**Section 2 — Description of Service**
- Replace "10 AI operatives across seven Control Centers" line with canonical model: "**24 AI agents organized into 10 operatives** across the platform's Consoles: Customer Portal, Field Operations, Business Management, Outreach & Sales Ops, Social Media, Web Presence, Analytics & Reports, and the AI Operatives Hub."
- Remove "currently hosted via the Lovable.dev platform" (replace with "hosted on Lovable Cloud infrastructure").

**Section 3 — Subscription and Payment Terms** (largest rewrite)
- Pricing line: keep "$197 to $1,997 per month across 4 tiers (Aura Core, Aura Boost, Aura Pro, Aura Elite)" — already correct.
- Add new bullet: **One-time implementation fee** — Aura Core $199, Aura Boost $399, Aura Pro $599, Aura Elite $799 (charged once at activation, non-refundable after onboarding completes).
- Add **Free Trial** section: "90-day free trial, no credit card required. Trial includes full platform access subject to your selected tier's monthly usage allowances."
- Replace **Usage-Based Charges** section with **Bundled Usage & Overages** (canonical wording per `mem://legal/third-party-fee-disclaimer`):
  - SMS, voice minutes, AI-generated voice, transactional email, and AI web search are **bundled into your Platform Plan** up to your tier's monthly allowance.
  - Usage above your monthly allowance is **billed separately on a single overage invoice at the end of each billing month**.
  - Aura Intercept does not pass through SignalWire, ElevenLabs, Resend, or Tavily fees as separate line items — they are absorbed into the Platform Plan and overage rate.
  - Current allowances and overage rates are published on the pricing page and may be updated with 30 days' notice.
- **Refund Policy** clarification: "Trial Period: cancel any time during the 90 days at no charge — no refund needed because no payment is taken." Replace "Full refund if cancelled within 90 days."

**Section 6 — Third-Party Integrations**
- Replace "Twilio: Voice calling and SMS messaging" with "**SignalWire**: Voice calling and SMS messaging."
- Add "**Tavily**: AI-powered web search for content and research operatives."
- Add "**Lovable Cloud (Supabase)**: Application hosting, database, authentication, and file storage."
- Keep ElevenLabs, Stripe, Resend, Google Calendar.
- Add closing note: "Costs for these providers are bundled into your Platform Plan; see Section 3."

**Section 11 / 12 — Disclaimers / Limitation of Liability**
- Find/replace "Twilio" → "SignalWire" (keep Twilio nowhere except historic carrier reference if needed — remove).

**Section 22 — Force Majeure**
- Replace "Twilio" with "SignalWire" in the provider list.

## PrivacyPolicy.tsx — Changes

**Effective Date** → bump to April 28, 2026.

**Section 1 — Information We Collect**
- Voice recording retention line: keep 90 days.
- Add bullet: "**AI Web Search Queries:** When operatives use AI-powered web search (Tavily), we log the query text and timestamps to monitor usage allowances and improve relevance."

**Section 4 — Disclosure of Your Information**
- Already says "SignalWire" — good. Add Tavily to the third-party service-provider list: "Tavily for AI web search."
- Add "Lovable Cloud / Supabase for application hosting, database, and authentication."

**Section 5 — Data Retention Policy**
- Add bullet: "**Search Query Logs:** Retained for 90 days for usage allowance accounting."

**Section 6 — Multi-Tenant Data Architecture** — no changes.

**Section 9 — TDPSA Sensitive Personal Data**
- Verify alignment with current GPC honoring; no content change needed.

**Section 10 — Third-Party Websites**
- Replace "the Lovable platform" with "the Lovable Cloud platform."

**Section 14 — Platform Privacy Policy**
- Reword: "This application is hosted on Lovable Cloud (powered by Supabase). For information about how the underlying platform handles your data, please review the [Lovable Privacy Policy](https://lovable.dev/privacy)."

**Section 15 — ElevenLabs AI Agent Disclosure** — content accurate; verify "Message Aura (Text)" / "Talk to Aura (Voice)" branding matches canonical naming registry. No change.

## Cross-link & Footer Verification

- Confirm `PublicFooter.tsx` links to `/terms-of-service` and `/privacy-policy` (already does — no change).
- No new routes needed.

## Files to Edit

- `src/pages/TermsOfService.tsx`
- `src/pages/PrivacyPolicy.tsx`

## Out of Scope

- No database migrations.
- No changes to `Auth.tsx` consent checkbox (already updated in prior turn).
- No changes to PDF-generated legal docs unless they exist as separate exports (none found in current registry).
