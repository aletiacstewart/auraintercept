## Goal
Add a Terms of Service agreement + signature section to the Company Onboarding Workbook PDF so the company formally agrees to and signs the ToS as part of onboarding intake.

## Scope
Single file: `src/components/documentation/CompanyOnboardingPDF.tsx`. No route, schema, or business-logic changes.

## Changes

1. **New `TermsOfServiceAgreementPage` component** (2 pages, A4) inserted in the `<Document>` order immediately before `SignOffPage`:

   - **Page A — Master Services Agreement Summary**
     - Section title: "Terms of Service Agreement"
     - Intro paragraph: this page summarizes the binding terms; full ToS at `https://auraintercept.ai/terms-of-service` and Privacy Policy at `/privacy-policy`.
     - Numbered clause summaries pulled in plain English from the existing `TermsOfService.tsx` page (Services, Subscription & Trial, Onboarding Fee, 3rd-Party Provider Accounts & Billing Pass-Through, Customer Data & Privacy, Acceptable Use, IP, Disclaimers/Limitation of Liability, Termination, Governing Law).
     - Callout box restating the 3rd-party billing disclaimer (per legal/third-party-fee-disclaimer memory) and 90-Day Live Trial / onboarding fee terms (per product/trial-period-standard memory).

   - **Page B — Acknowledgement & Signature**
     - Checkbox rows the signer initials:
       - "I have read and agree to the Aura Intercept Terms of Service."
       - "I have read and agree to the Privacy Policy."
       - "I understand all 3rd-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social platforms) require my own account + credit card and are billed to me directly and separately from my Aura plan fee."
       - "I authorize Concierge Onboarding to configure these accounts on my behalf using my credentials."
       - "I agree to the 90-Day Live Trial terms; the onboarding fee for my selected tier is due at trial start and is non-refundable."
     - Form rows: Company Legal Name, Authorized Signer Name, Title, Email.
     - Signature block: Authorized Signature + Date.
     - Witness/secondary signature block (optional): Printed Name + Signature + Date.

2. **Update `SignOffPage`** to add one checklist item "Signed Terms of Service Agreement (previous page)" and a short reminder that the ToS signature page must be returned with the workbook.

3. **Register the page** in the `CompanyOnboardingPDF` `<Document>` ordering between `SmartWebsiteInputsPage` and `SignOffPage`.

## Out of scope
- Editing `TermsOfService.tsx` or legal copy beyond summarizing existing content.
- New routes, DB tables, e-signature integration.
- Other PDFs.

## Validation
Render the PDF via the existing Export Documentation page, rasterize the two new pages, and visually confirm layout/no clipping.
