## Goal
Wherever the app/docs reference the **90-Day Live Trial**, add a clarifier that **the first 30 days are used for onboarding** (so customers understand the cadence: 30 days onboarding → 60 days live use).

## Standard clarifier copy
- Short form (buttons/badges, where space is tight): `(first 30 days = onboarding)`
- Long form (paragraphs, FAQs, PDFs): `The first 30 days of your 90-Day Live Trial are dedicated to onboarding — account configuration, AI agent setup, knowledge-base build-out, 3rd-party activation, and training — so the remaining 60 days are spent fully live.`
- Spanish (common.json): keep button label as-is; add tooltip-style note where used in paragraphs.

Buttons/CTAs themselves stay as "90-Day Live Trial" — clarifier appears as adjacent helper text, not inside the button label.

## Files to update

### Auth / signup
- `src/pages/Auth.tsx`
  - Line ~841 "90-Day Live Trial — Full Access" header block: append long-form clarifier sentence.
  - Line ~858 beta-period paragraph: append clarifier.
  - Line ~1464 onboarding-fee tooltip: prepend the onboarding-window framing ("First 30 days of the trial are your onboarding window…").
  - Line ~1486 helper text under CTA: add short-form "(first 30 days = onboarding)".
  - Line ~1507 cyan helper text: append clarifier.

### Dashboard / in-app
- `src/components/dashboard/TrialBanner.tsx` (line 117): expand line to mention "First 30 days are onboarding; remaining 60 days are full live use."
- `src/components/onboarding/FastStartWizard.tsx` (line 348): append short-form clarifier after "90-Day Live Trial".
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx` (line 100 comment + nearby UI string if present): update comment + any user-visible string.

### Audit / results
- `src/components/audit/AuditResults.tsx` (line 417): add clarifier sentence after the trial mention.
- `src/components/audit/AuditChecklistPDF.tsx` (lines 308, 599, 614): append clarifier sentence to the paragraph forms; bullet at 308 becomes "90-Day Live Trial included (first 30 days = onboarding)".

### Marketing pages
- `src/pages/About.tsx` (line 185): keep button label, add small helper text below CTA: "First 30 days = onboarding".
- `src/pages/Contact.tsx` (if 90-Day Live Trial CTA present): same treatment.

### PDFs / documentation
- `src/components/documentation/PlatformDocumentPDF.tsx` (lines 935, 1154, 1166, 1176, 1186, 1265, 1278, 1364): append clarifier to each trial mention; for the per-tier onboarding-fee bullets, change to `"$XXX one-time onboarding fee (due at start of 90-Day Live Trial; first 30 days dedicated to onboarding)"`.
- `src/components/documentation/PlatformFAQPDF.tsx` (lines 376, 458): expand answers to explain the 30-day onboarding window.
- `src/components/documentation/PricingSummaryPDF.tsx` (lines 243, 337, 375, 412, 456, 583–586): append clarifier to each line.
- `src/components/documentation/SalesPitchDataPDF.tsx` (lines 817, 853): append clarifier.
- `src/components/documentation/WebsiteCopyPDF.tsx` (lines 581, 586): expand FAQ answers.

### Memory (update standard so future copy stays consistent)
- `.lovable/memory/product/trial-period-standard.md`: replace stale "60-Day" content with the current 90-day standard **plus** the new rule: "First 30 days of the 90-Day Live Trial are onboarding; remaining 60 days are full live use."
- `.lovable/memory/marketing/pricing/canonical-four-tier-model.md`: same clarifier added to the onboarding-fee paragraph.
- `.lovable/memory/architecture/canonical-naming-registry.md` (line 64) and `.lovable/memory/architecture/trial-honors-selected-tier.md`: add the onboarding-window note.
- `.lovable/memory/index.md` Core entry for trial: update one-liner to include "first 30d = onboarding".

## Out of scope
- No changes to trial **length** (still 90 days) or fee math.
- No changes to backend reminder cadence in `supabase/functions/trial-reminders` (still 7d/3d/1d/expired).
- Button labels are not changed.