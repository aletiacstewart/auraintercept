

## Update Free Audit Tool — Public Access, Refreshed Content & Downloadable Onboarding Checklist PDF

### Problem
1. **`/audit` is gated to `platform_admin`** (Phase 6 over-restricted it) — clicking "Free Audit" in the header redirects to the auth page.
2. Audit questions reference older agent counts ("8 AI Agents", "AI Receptionist (Triage)") rather than the current plain-English / outcome-grouped naming and 24-agent / 10-operative model.
3. No downloadable takeaway — companies finish the audit with nothing in hand to plan their setup.

### Fix overview

**A. Make `/audit` public again**
- `src/App.tsx`: remove the `<ProtectedRoute requiredRole="platform_admin">` wrapper around `/audit`. Keep the other power-user pages (`/design-preview`, `/dashboard/architecture`, `/dashboard/calculators`, `/dashboard/export-docs`, mockup pages) admin-only.
- Update `mem://features/dashboard/power-user-pages-restricted-v1` and the index entry to reflect that `/audit` is intentionally public-facing.

**B. Refresh audit content in `src/components/audit/types.ts`**
- Update `TIER_RECOMMENDATIONS` `keyFeatures` and `description` strings to match the current platform language:
  - Use plain-English outcome groups: **"Front Desk"**, **"On The Way"**, **"Billing"**, **"Marketing"**, **"Reports"** (per `mem://features/dashboard/plain-english-labels-v1`).
  - Reference the new sidebar groups (Field Ops, Marketing, Customers, Settings).
  - Mention the Simple/Pro dashboard view.
  - Keep the canonical 4-tier pricing ($197 / $497 / $997 / $1,997) and agent counts (8/12/16/24) — those are correct.
- Trim the question set from **30 → ~20 questions** to reduce drop-off (SMB owners). Keep the 9 sections but consolidate the weakest 2-question pairs. Refresh question copy to match new outcome language ("Front Desk handling", "On-the-way ETA texts", etc.).
- Add **2 new questions** that drive checklist personalization:
  1. *"Which third-party integrations do you already have?"* (Stripe, Google Calendar, social accounts, business phone) — drives the checklist's "already done" vs "to set up" sections.
  2. *"What's your business phone setup today?"* (port existing number, get new number, forward calls, no business line) — drives the SignalWire/CFNA setup checklist section.

**C. New "Download Your Setup Checklist" PDF on the results screen**

Create `src/components/audit/AuditChecklistPDF.tsx` using the existing `@react-pdf/renderer` + `sanitizePdfText` pattern (matches `CompanyOnboardingPDF.tsx`, etc.). The PDF is **personalized to the recommended tier and the user's integration answers** and contains:

1. **Cover page** — Aura Intercept badge logo, company-friendly title "Your Aura Intercept Setup Plan", recommended tier + price, fit score.
2. **What's included in your plan** — full agent/operative list, consoles, employee limit, channels, white-label flag (pulled from `TIER_RECOMMENDATIONS`).
3. **Documents to gather** — business name & EIN, business phone number, hours of operation, services list, pricing, team roster, logo + brand colors, Google Business Profile URL, customer FAQ.
4. **Third-party setups required for your tier** (per `mem://integrations/3rd-party-requirements-standard`):
   - **All tiers:** SignalWire (voice/SMS), ElevenLabs (voice agent), Resend (email).
   - **Pro+:** Social platform OAuth (Facebook, Instagram, LinkedIn, TikTok, Google Business).
   - **Elite only:** Stripe (invoicing).
   - Each row: provider, what it's for, who needs an account, estimated monthly 3rd-party cost range, plus the **standard 3rd-party fee disclaimer** (per `mem://legal/third-party-fee-disclaimer`).
5. **Phone setup path** — based on the new "phone setup" question: port number / new SignalWire number / call forwarding / 10DLC registration steps.
6. **Your 30-day guided launch** — the 4-step Fast Start (Business Type → Integrations → Tell Aura → Launch) plus weekly milestones.
7. **Plan comparison page** — 4-column table of all tiers (Core/Boost/Pro/Elite) with price, agents, consoles, employee limit, implementation fee — so the owner can show partners/decision makers.
8. **Next steps & contact** — Start 30-day trial CTA URL (`https://auraintercept.ai/auth?mode=company`) and Concierge Kickoff Calendly link.

PDF rules followed: no emoji/Unicode (use `sanitizePdfText`), Helvetica only, hardcoded URLs use `https://auraintercept.ai`, includes the 3rd-party fee legal disclaimer.

**D. Wire the download button into `AuditResults.tsx`**
- Add a third primary action below the "Estimated Monthly Impact" card: **"Download Your Setup Checklist (PDF)"** using `<PDFDownloadLink>` from `@react-pdf/renderer`.
- Pass the recommended tier, fit score, and the raw `answers` object so the PDF can personalize the integrations section.
- Add a small "What's in this PDF" preview list (5 bullets) so users know it's worth downloading.

### Files touched / created
- `src/App.tsx` — un-gate `/audit` (1-line change)
- `src/components/audit/types.ts` — refreshed questions + tier copy
- `src/components/audit/AuditResults.tsx` — add PDF download CTA
- `src/components/audit/AuditChecklistPDF.tsx` — **new file**, the personalized PDF
- `mem://features/dashboard/power-user-pages-restricted-v1` + `mem://index.md` — note `/audit` is public

### Out of scope
- No changes to scoring logic, tier prices, or DB
- No changes to `PublicHeader` (link is already correct, just blocked by route guard)
- No changes to other power-user route guards

### Rollout
1. Un-gate route (instant fix for the broken Free Audit button)
2. Refresh question/tier copy
3. Build and ship the checklist PDF + download CTA

