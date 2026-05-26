# Carrier Call-Forwarding Guide + Export PDF Sync

## Goal
1. Add a built-in **Carrier Call-Forwarding Guide** (immediate, no-answer, busy, unreachable, cancel) for every major US carrier into the Contact Routing step of the fillable onboarding intake.
2. Rebuild the downloadable **Company Onboarding Questionnaire PDF** so its sections match the 12-step fillable intake, including the new forwarding guide and the Terms/Plan selector that were added in prior turns.

---

## 1. New shared data file
Create `src/lib/carrierForwarding.ts` exporting a single typed dataset used by both the React intake and the PDF. Each carrier entry has the same row shape so the table renders identically in both places.

Fields per carrier:
- `name` (e.g. "Verizon Wireless")
- `type` — `"Postpaid"` / `"Prepaid / MVNO"` / `"VoIP"`
- `immediate_on` — code/steps for unconditional "forward all calls"
- `immediate_off`
- `no_answer_on` — Conditional Forward No Answer (CFNA) — fires after rings
- `no_answer_off`
- `busy_on` — Conditional Forward Busy (CFB)
- `busy_off`
- `unreachable_on` — Conditional Forward Not Reachable (CFNR) — phone off / no signal
- `unreachable_off`
- `cancel_all`
- `verify` (e.g. `*#21#`, `*#62#`)
- `notes` (CDMA quirks, app-only paths, dialer steps for visual UIs)

Carriers covered (US market, ordered by share):
1. **Verizon Wireless** — `*72{num}` / `*73`, plus My Verizon app path for CFNA/CFB/CFNR (Verizon is CDMA-origin and doesn't accept the GSM star codes; document the app flow under Settings → Manage device → Call forwarding).
2. **AT&T Mobility** — full GSM set: `**21*{num}#`, `##21#`, `**61*{num}**{rings}#`, `##61#`, `**67*{num}#`, `##67#`, `**62*{num}#`, `##62#`, `##002#` to cancel all, `*#21#` / `*#61#` to verify.
3. **T-Mobile** (incl. Sprint legacy) — same GSM star codes as AT&T; note Sprint legacy numbers also accept `*72` / `*720`.
4. **US Cellular** — `*72{num}` / `*73` immediate; CFNA via app or `*92{num}` / `*93` on supported handsets.
5. **Google Voice** — Settings → Calls → Call forwarding (web/app only; no star codes).
6. **Cricket Wireless** (AT&T MVNO) — GSM star codes as AT&T.
7. **Metro by T-Mobile** — GSM star codes as T-Mobile.
8. **Visible** (Verizon MVNO) — Visible app → Account → Call forwarding; star codes not supported.
9. **Mint Mobile** (T-Mobile MVNO) — GSM star codes as T-Mobile.
10. **Xfinity Mobile / Spectrum Mobile** (Verizon MVNO) — carrier app only.
11. **Generic GSM fallback** — the `**21*`, `**61*`, `**67*`, `**62*` family with explanation.
12. **iPhone visual path** (any GSM carrier) — Settings → Phone → Call Forwarding (immediate only; conditional still requires star codes).

Every row will tell the user to replace `{num}` with the Aura business number they were assigned during setup, and (for CFNA) replace `{rings}` with `30` for ~6 rings.

## 2. Contact Routing step — new collapsible "Carrier Forwarding Setup Guide"
In `src/pages/PublicOnboardingIntake.tsx`, inside the `contact_routing` section, add an accordion below the existing forwarding-number fields:

- Heading: **"How to forward your business line to Aura"** + one-line explainer.
- Carrier picker (`Select`) defaulting to the carrier the user types into a new `carrier` field (saved to `data.contact_routing.carrier`).
- Picked-carrier card shows a 5-row table: Immediate / No Answer / Busy / Unreachable / Cancel, each with the on-code, off-code, and copy-to-clipboard button.
- "Verify current forwarding" and "Notes" rows below the table.
- A "Show all carriers" toggle that expands the full list as stacked cards (used as the printable reference).
- Persisted choice is saved into `data.contact_routing.carrier` so the submitted JSON / PDF includes which carrier the company is on.

No backend changes — this is presentation only, written against the existing `data.contact_routing` slice.

## 3. Export PDF — rewrite to match the 12 fillable sections
`src/components/documentation/CompanyOnboardingPDF.tsx` is currently structured around a legacy 7-section audit workbook. Rewrite the page list so it matches the live intake one-for-one:

```text
Cover
How to Use This Workbook (refreshed)
1. Company Profile
2. Brand & Voice                       (new)
3. Contact Routing
   3a. Carrier Call-Forwarding Guide   (new — full table for every carrier)
4. 3rd-Party Accounts                  (new — Resend/SignalWire/ElevenLabs/Tavily/Stripe/Google/A2P)
5. A2P 10DLC (SMS Compliance)         (new)
6. Employees / Technicians
7. Booking Rules                       (new)
8. Industry-Specific Intake            (new)
9. Smart Website Inputs                (new)
10. Goals & Notes
11. Document & Image Uploads checklist (new — mirrors UPLOAD_SECTIONS)
12. Terms, Plan Selection & Signature  (new — Core/Boost/Pro/Elite + onboarding fees + invoice email + signature block)
Appendix: Legacy AI Opportunity Audit  (keep the 30-question audit as an optional appendix so we don't lose it)
```

Each section page mirrors the field labels, placeholders/examples, and helper copy already shown in `PublicOnboardingIntake.tsx`. The carrier-forwarding page consumes the shared `carrierForwarding.ts` dataset so the live form and the printable PDF can never drift again.

The Terms page lists the canonical 4-tier pricing (Core $497, Boost $697, Pro $1,197, Elite $2,197 — monthly = onboarding fee) and includes checkboxes for the same TOS/Privacy/Authorization acknowledgements, plus invoice email + signature lines.

No changes to `ExportDocumentation.tsx` other than refreshing the "Document includes" bullet list to reflect the new sections.

---

## Technical notes
- Shared dataset lives at `src/lib/carrierForwarding.ts` and is consumed by both the Vite app (React) and `@react-pdf/renderer` (the PDF doc) — pure data, no JSX, safe to import from either runtime.
- No database/edge-function changes. No new dependencies.
- Submitted JSON gains `data.contact_routing.carrier`; existing `get-onboarding-invite` / PDF download already serialize the whole `form_data` blob, so the carrier choice will appear in the admin "View" dialog and the per-submission PDF without further changes.
- All copy uses semantic Tailwind tokens, no hardcoded colors.

## Out of scope
- No new edge functions, no schema migrations, no auth changes.
- Not touching the 30-question audit content itself — only relocating it to an appendix in the printable PDF.
- Not adding international carriers (UK/CA/AU). Can follow up if requested.
