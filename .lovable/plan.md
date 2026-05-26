## Add examples + onboarding plan/invoice fields to intake workbook

Edit `src/pages/PublicOnboardingIntake.tsx` only. No DB / edge function changes (form_data already accepts any keys, and submit-onboarding email already includes the full form_data dump).

### 1. Add example placeholders / helper text to 4 steps

**Step 2 — Brand & Voice**
- Tone: placeholder `"e.g. Friendly, professional, confident"`
- Never-say: placeholder `"e.g. 'cheap', 'guaranteed', competitor names"`
- Greeting: placeholder `"e.g. Thanks for calling Acme Plumbing, this is Aura — how can I help today?"`
- Primary color: keep `#0ea5a4`; Secondary: placeholder `"#0f172a"`

**Step 8 — Industry-Specific Intake**
- Intake questions: placeholder
  `"e.g.\n• What's the address of the property?\n• Is this a repair or new install?\n• When did the issue start?"`
- Terminology: placeholder `"e.g. 'condenser', 'evaporator coil', 'SEER rating'"`
- Compliance: placeholder `"e.g. EPA 608 certified, state contractor license #12345, HIPAA if medical"`

**Step 9 — Smart Website Inputs**
- Headline: placeholder `"e.g. 24/7 HVAC repair across Phoenix — answered in 6 seconds"`
- Subheadline: placeholder `"e.g. Licensed techs, upfront pricing, same-day appointments."`
- Service blurbs: placeholder
  `"e.g.\nAC Repair — Fast diagnostics, transparent quotes, most jobs done same day.\nFurnace Tune-Up — Seasonal maintenance to prevent breakdowns and lower bills."`

**Step 11 — Document & Image Uploads**
- Add a small helper line under each row label with an example (e.g. "Ex: acme-logo.svg, 512×512 transparent", "Ex: brand-guide.pdf, hero photos", "Ex: IRS CP-575 letter or W-9 PDF", "Ex: customers.csv with name, email, phone, last service", "Ex: techs.csv with name, role, phone, email", "Ex: 2025-price-sheet.pdf or services.xlsx", "Ex: insurance cert, prior contracts, SOPs").

### 2. Onboarding plan + invoice email on Step 12 (Terms)

Add a new block above the acknowledgement checkboxes titled **"Onboarding plan & invoice"**:

- **Plan selector** (radio cards, single-select) — sourced from canonical 4-tier model:
  - Aura Core — $497/mo · $497 one-time onboarding
  - Aura Boost — $697/mo · $697 one-time onboarding
  - Aura Pro — $1,197/mo · $1,197 one-time onboarding
  - Aura Elite — $2,197/mo · $2,197 one-time onboarding
  - Stored at `data.terms.plan` as `'core' | 'boost' | 'pro' | 'elite'`.
- **Billing frequency** small toggle: Monthly / Annual (annual ≈ 20% off, shown next to selected plan). Stored at `data.terms.billing_cycle`.
- **Invoice email for onboarding fee** — `Input type="email"`, stored at `data.terms.invoice_email`, with helper text "We'll send the one-time onboarding invoice here. Subscription billing starts after the 90-day Live Trial."
- A live summary line: `"Due at start of trial: $<onboarding_fee>. Then $<monthly>/mo (or $<annual>/yr) after the 90-day Live Trial."`

Submit validation (in `submit()`):
- Require `terms.plan` and a valid-looking `terms.invoice_email` in addition to existing checks.
- On failure, toast and jump to last step (already does).

No backend changes needed — `form_data` is already forwarded in the submission email, so plan + invoice email will appear in the admin notification to `ai@auraintercept.ai`.

### Files touched
- `src/pages/PublicOnboardingIntake.tsx` (only)
