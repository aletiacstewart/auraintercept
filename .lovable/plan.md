## Goal
Combine four overlapping boxes on the homepage pricing area into one clean section, placed **below** the 4 pricing cards. Remove duplicated content.

## Boxes being merged
1. **BETA Sign-Up — Limited Time** (currently above the pricing grid via `<BetaSignupNotice />`)
2. **SMS System — FCC 10DLC Compliance** (below pricing)
3. **3rd-Party Integrations & Usage Fees** intro header (below pricing)
4. **60-Day Live Trial** summary box (bottom of section)

## Duplicates to drop
- "60-Day Live Trial" explained 3 times → keep once
- "Bring your own provider accounts / billed directly" said in beta notice, 3rd-party header, and again on each vendor card → keep one concise line
- "A2P 10DLC" detailed in both the SMS compliance box AND the A2P vendor card → keep details only in the merged section; trim the A2P card to a brief pointer
- Repeated "valid credit card required" → state once

## New consolidated layout (single bordered card below pricing grid)

```text
┌─ BETA ─ BETA Sign-Up — Limited Time ───────────────────────────┐
│                                                                │
│ 60-Day Live Trial · Beta Pricing locked in · Onboarding = 50% │
│ of beta monthly (due at start, non-refundable once started)    │
│                                                                │
│ What onboarding covers: account config, AI agent setup,        │
│ knowledge-base build-out, 3rd-party activation, A2P 10DLC      │
│ filing, initial training.                                      │
│                                                                │
│ ─────────────────────────────────────────────────────────────  │
│ 3rd-Party Integrations — bring your own accounts, vendor       │
│ bills you directly (pay-as-you-go, incl. during trial).        │
│ Valid credit card required on each provider.                   │
│                                                                │
│  ┌─ SMS / 10DLC Compliance (required for SMS) ──────────────┐ │
│  │ Pass-through fees           │ Approval & docs            │ │
│  │ • Brand reg $4.50 one-time  │ Timeline: 3–5 biz days     │ │
│  │ • Campaign $1.50–$30/mo     │ (1–2+ wks if re-vetting)   │ │
│  │ • DCA vetting $7.50         │ Docs: EIN, legal name,     │ │
│  │ • Opt. vetting $40          │ DBA, website, opt-in/out,  │ │
│  │ • T-Mobile non-use $250     │ sample + help messages     │ │
│  │ Typical all-in: $16–$42     │                            │ │
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

The vendor cards grid (Google Calendar, Resend, ElevenLabs, SignalWire, A2P, Stripe, Social, Tavily) stays below this consolidated card, unchanged except the A2P card trimmed to one line that references the section above.

## File changes (single file)
**`src/pages/Index.tsx`**
1. Remove the `<BetaSignupNotice />` block (lines ~670–673) from above the pricing grid.
2. Replace the existing "3rd Party Integrations" header + "SMS System — FCC 10DLC Compliance" box + bottom "60-Day Live Trial" summary with one unified card containing:
   - BETA chip + heading
   - Trial / pricing / onboarding paragraph
   - Onboarding-covers paragraph
   - Divider
   - 3rd-party intro line (one sentence)
   - SMS/10DLC two-column compact block (kept, since it's the only place with the fee table)
3. Trim the A2P vendor card to: "Required for SMS — see 10DLC details above. $4.50 brand reg + campaign fees."
4. Keep the vendor grid below.

No changes to `BetaSignupNotice.tsx` (component still used on `/auth` signup page). No copy changes to vendor cards beyond the A2P trim.

## Out of scope
- Pricing tier cards, comparison table, employee-add-on copy
- Other pages that import `BetaSignupNotice` (SignUp form keeps it)
