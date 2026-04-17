

## Update Terms of Service — Stronger Legal Protection for Aura Intercept LLC

### Goal
Add explicit, broad legal protections covering AI errors, business losses, social media outcomes, and entity-level liability — written to maximize legal coverage for **Aura Intercept LLC**.

### Changes to `src/pages/TermsOfService.tsx`

**1. Update entity references** — Replace generic "Aura Intercept" liability references with **"Aura Intercept LLC"** in disclaimer/limitation/indemnification sections so the LLC shield is explicit.

**2. Update Effective Date** to today (April 17, 2026).

**3. Strengthen Section 5 (AI-Specific Terms)** — Add a new "No Performance Guarantee" subsection stating:
- No guarantee/warranty AI will function 100% accurately, reliably, or without error, downtime, hallucination, or misclassification
- No guarantee of specific business outcomes (bookings, revenue, lead conversions, response quality)
- AI is a tool to assist — not replace — human judgment

**4. Rewrite Section 11 (Disclaimer of Warranties)** — Expand to expressly disclaim:
- Uninterrupted/error-free operation
- AI accuracy, completeness, or fitness
- Any guarantee of business results, customer acquisition, retention, or social media performance (followers, likes, shares, reach, engagement)

**5. Rewrite Section 12 (Limitation of Liability)** — Expand the loss list to explicitly include:
- Lost business, lost customers, lost leads, lost revenue, lost profits, lost goodwill
- Lost or reduced social media followers, likes, shares, comments, reach, engagement, account suspensions/bans by social platforms
- Missed appointments, miscommunicated quotes, AI misrouting, incorrect dispatch, failed/delayed SMS or voice calls
- Third-party platform changes, outages, API deprecations, or account terminations (Meta, Google, TikTok, LinkedIn, X, Stripe, SignalWire, ElevenLabs, Resend)
- Cap total liability at **the lesser of (a) fees paid in the prior 3 months or (b) $100**

**6. Add new Section 12A — "No Guarantee of Results"** covering:
- No guarantee of revenue, ROI, lead volume, customer acquisition, social engagement, SEO rankings, or website traffic
- Customer success depends on factors outside our control (market conditions, customer's own business practices, third-party algorithms)

**7. Add new Section 12B — "Social Media Disclaimer"** specifically covering:
- Not responsible for social platform algorithm changes, shadow-bans, account suspensions, deleted posts, lost followers/engagement
- AI-generated content is the publishing user's responsibility; user must review before posting
- Platform reserves right to refuse content that may violate third-party platform policies

**8. Strengthen Section 13 (Indemnification)** — Add coverage for:
- Claims arising from AI-generated content the user published
- Claims by the user's customers regarding AI miscommunications, missed bookings, incorrect quotes
- Social media platform violations

**9. Add new Section 21 — "Assumption of Risk & Acknowledgment"** — Explicit user acknowledgment that:
- AI technology is inherently probabilistic and may produce errors
- User has independently evaluated the Service and assumes all risk of use
- User will maintain independent backup systems for critical business operations

**10. Add new Section 22 — "Force Majeure"** — Standard clause for outages, AI provider failures, internet disruptions, acts of God.

**11. Add new Section 23 — "Severability & Survival"** — Disclaimers, limitations, indemnification, and governing law survive termination.

### Out of Scope
- No new pages, routes, or components
- No changes to `TermsAgreementCheckbox` (already links here)
- No DB or edge function changes

### File Touched
- `src/pages/TermsOfService.tsx` (single file, expanded ~150 lines)

