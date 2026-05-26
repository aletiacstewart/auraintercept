## Goal
Give companies a single fillable PDF they can complete before kickoff so every piece of info, asset, account, and content the Aura onboarding team needs is collected up front.

## Current state
`src/components/documentation/CompanyOnboardingPDF.tsx` already renders a 7-section "Company Onboarding Questionnaire" (Company Profile, Business Ops, Subscription, Integrations, Knowledge Base, Employees, Goals). It's wired into `ExportDocumentation.tsx`. It's solid but missing several intake items the onboarding team actually needs.

## What to add (expansion, not rewrite)

1. **Cover + How-to-use page** — clear instructions: "Fill this out, email back with attachments listed in the checklist." Add company-name / date / tier-selected fields and a signature/acknowledgement block.

2. **Master Document & Asset Checklist** (new page near front) — single checkbox table the customer ticks off and attaches:
   - Logo (SVG/PNG transparent), favicon, brand colors, fonts
   - Business license / EIN / W-9 (for A2P 10DLC + Stripe)
   - Insurance certificate (field-ops verticals)
   - Existing website URL + login (if migrating)
   - Existing customer list (CSV template referenced)
   - Existing employee/technician list (CSV)
   - Service/price list, quote template, invoice template
   - Photos: team, storefront, completed jobs (for Smart Website + social)
   - Testimonials / Google review screenshots
   - Voicemail greeting script + after-hours script

3. **3rd-Party Account Worksheet** (new section, replaces brief integrations block) — per Aura policy every provider is customer-owned. For each, capture: account exists Y/N, account email, billing card on file Y/N, who will grant access:
   - SignalWire (voice + SMS)
   - ElevenLabs (voice agent)
   - Resend (email sending) + sending domain + DNS access
   - Tavily (web research)
   - Stripe (payments)
   - A2P 10DLC registration data (legal business name, EIN, address, brand vertical, sample messages, opt-in language)
   - Google Workspace / Calendar admin
   - Social accounts (FB, IG, LinkedIn, X, TikTok, YouTube, GBP) — handle + admin email

4. **Brand & Voice Worksheet** — tone descriptors, words to avoid, signature sign-offs, sample customer greetings, do/don't examples (feeds AI operative prompts).

5. **Knowledge Base Intake (expanded)** — keep current Services/FAQ/Differentiators, add: pricing rules, warranty/return policy, payment terms, cancellation policy, common objections, escalation rules, hours/holiday calendar, service-area ZIPs/radius, emergency protocols.

6. **Industry-Specific Intake Pack** (new) — one mini-form per industry cluster (Home Services, Professional Services, Retail/Restaurants, Real Estate, Healthcare/Wellness). Customer fills only the one that matches. Pulls field prompts from `industryFastStartQuestions.ts` + `industryPackSchema.ts`.

7. **Communication Routing Worksheet** — who answers what:
   - Voice: main line, after-hours, missed-call SMS text, transfer numbers per operative
   - SMS keywords + auto-reply text
   - Email aliases (sales@, support@, billing@)
   - Web chat escalation rules
   - Notification recipients (push/email/SMS) per event type

8. **Employee/Technician Roster Worksheet** — table to list each user: name, email, phone, role (admin/employee/technician/dispatcher), service area, availability, skills. Replaces today's brief employee section.

9. **Customer Portal & Booking Setup** — booking window, buffer, deposit, cancellation policy, intake-form custom fields, portal welcome message.

10. **Smart Website & Content Inputs** — preferred domain, current DNS provider, About-us copy or bullet points, services blurbs, 5 photo slots, hero headline preference.

11. **Sign-off & Submission page** — checklist of attachments included, signature line, return-to email, expected onboarding start date.

## Files to change
- `src/components/documentation/CompanyOnboardingPDF.tsx` — extend with new sections + checklist tables. Reuse existing styles + form-field components.
- No other files. (Existing `ExportDocumentation.tsx` link already works.)

## Data sources (read-only)
- `src/lib/industryFastStartQuestions.ts`, `industryPackSchema.ts`, `industryCapabilities.ts`
- `src/lib/documentationConfig.ts` (tiers + integration requirements already imported)
- Memory: third-party-fee-disclaimer, trial-period-standard, canonical-four-tier-model

## QA
Render PDF → `pdftoppm -jpeg -r 150` → inspect every page for overflow, clipped checkboxes, table alignment. Iterate until clean. Deliver `/mnt/documents/company-onboarding-workbook.pdf` via `<presentation-artifact>` and keep the in-app download on ExportDocumentation.

## Out of scope
New routes, business logic, pricing changes, separate per-industry PDFs (one combined PDF with all industries).
