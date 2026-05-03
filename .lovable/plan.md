# Healthcare Vertical Pack — Final Plan (Scoped + Integrations)

Adds 6 healthcare verticals (Dental, Chiropractic, General Medical, Veterinary, Physical Therapy, Optometry) to the existing platform. Scope is intentionally narrow: **appointments + insurance verification emails to front desk only**. No medications, no medical/dental records, no clinical charting, no e-prescribing, no EDI claims, no lab orders.

## Decisions locked in

1. **Pricing**: Available on **all 4 tiers** (Core / Boost / Pro / Elite). HIPAA guardrails apply on every tier.
2. **Insurance verification**: Wired as `verify_insurance` agent action → emails the front desk with the captured info + creates a task. No verification logic, no payer API, no eligibility checks.
3. **Vet data model**: Pets stored as **JSON array on the customer record** (`customers.pets`). Appointments reference `pet_id` from the array. Reuses existing customers + appointments consoles with zero new tables.

## Explicitly OUT of scope

- No prescription / medication management
- No medical, dental, spinal, or vision records / charting / SOAP notes
- No e-prescribing, refill request handling, or pharmacy integration
- No lab orders, results, or imaging
- No EDI / clearinghouse / payer integration
- No CDT/CPT code library
- No PHI document storage (intake forms collect basic info only — no x-rays, no charts)

Agent actions limited to: `book_appointment`, `reschedule`, `cancel`, `confirm_appointment`, `send_recall`, `verify_insurance` (email only), `triage_emergency` (route to staff/911), `answer_faq`.

## What gets built

### 1. Migration

- 6 rows in `industry_blueprints` (slugs: `dental`, `chiropractic`, `medical_office`, `veterinary`, `physical_therapy`, `optometry`). All use `operating_model='appointment_booking'`.
- `companies.healthcare_compliance boolean default false`. Trigger `trg_sync_company_workspace` extended to auto-set the flag for healthcare slugs.
- `insurance_verification_requests` table (company_id, customer_id, carrier, member_id, group_number, policyholder_name, policyholder_dob, photo_url nullable, status, requested_at, completed_at, notes). RLS by company.
- `customers.pets jsonb default '[]'` and `appointments.pet_id text` (nullable, vet-only).

### 2. Compliance overlay

- `aura-unified` prepends a HIPAA guardrail block when `healthcare_compliance=true`: AI self-identifies, no diagnosis/clinical advice, no medication discussion, no medical-records discussion, identity verification before sharing patient info, mandatory disclaimer on health-adjacent replies.
- Voice intro forced per-vertical: *"Hi, I'm Aura, an AI receptionist for [Practice]. I'm not a licensed [dentist/doctor/chiro/therapist/optometrist/vet]…"*
- SMS/email composer shows a "Contains PHI — minimum-necessary rule" banner for healthcare tenants.

### 3. Insurance verification — email-only

- New edge function `verify-insurance` (`verify_jwt=false`, internal, Zod-validated):
  - Inserts `insurance_verification_requests` row with status `pending`.
  - Sends staff email via existing notification flow listing all collected fields + a "Mark verified" deep link.
  - Creates an in-app task assigned to staff.
- Surfaced as `verify_insurance` agent action and a "Verify Insurance" Quick Action on the patient record.

### 4. Terminology + UX overlays (existing files only)

Extend `agentStyles`, `industryFieldLabels`, `industryNavLabels`, `industryEmptyStates`, `industryQuickActions`, `industryKpiLabels`, `industryAnalyticsPresets`, `industryFormSchemas`, `industryAuraFraming`, `industryAuraSuggestions` to map: Customers→Patients (vet: Pet Owners), Jobs→Visits/Adjustments/Sessions/Exams, Invoices→Statements, Follow-ups→Recalls. KPIs per vertical (Today's Production, Schedule Fill, No-Show Rate, Case Acceptance, Hygiene Production, Recall Effectiveness, Pre-Appointment %). Intake schemas have demographics + insurance + chief complaint + consents only (vet adds pets array).

### 5. Onboarding

- 6 healthcare options as first-class chips in `CustomIndustryWizard.tsx`.
- HIPAA acknowledgement modal: "Aura is used as an AI receptionist for appointments and insurance intake only. It does not handle medical records, prescriptions, or clinical advice."

### 6. **NEW — Healthcare 3rd-Party Integrations Setup**

A dedicated **"Integrations"** tab is added to the healthcare onboarding flow and to Settings → Integrations (filtered to healthcare tenants). Strictly scoped to **scheduling + front-desk notifications** — no PMS/EHR/clearinghouse/pharmacy connectors.

**Architecture:**
- New table `company_integrations` (company_id, provider_key, status, config jsonb, connected_at, last_synced_at, last_error). Standard RLS by company.
- New `IntegrationsConsole` page rendered from the existing settings shell — each card shows status pill (Not connected / Connected / Action needed), a Connect/Configure button, and a short "what this does" line.
- Each provider has a thin adapter file in `src/lib/integrations/healthcare/` exporting `{ key, label, scope, connect(), test(), disconnect() }`. Adapters that need real OAuth defer to existing edge functions where one already exists; otherwise they collect API key + webhook URL via a modal and store config in `company_integrations.config` (secrets in Vault).

**Providers shipped in v1 (all optional, all free to add):**

| Provider | Purpose | Method |
|---|---|---|
| **Google Calendar** | Two-way sync of Aura-booked appointments to the practice's clinical calendar | Reuses existing Google OAuth flow |
| **Microsoft 365 / Outlook Calendar** | Same, for practices on M365 | OAuth (new edge function `ms-calendar-oauth`) |
| **Apple/iCloud Calendar (CalDAV)** | One-way push for solo practitioners | App-specific password + CalDAV URL |
| **Twilio (BYO)** | For practices that want to use their own SMS number instead of bundled SignalWire | Account SID + Auth Token + From number |
| **Front-desk webhook** | Generic POST endpoint for insurance-verification + new-appointment events (lets practices wire to Slack, Teams, Zapier, Make, n8n, or their own PMS inbox) | URL + optional shared secret |
| **Slack** | Direct Slack channel notifications for new appointments + insurance requests | Slack incoming-webhook URL |
| **Microsoft Teams** | Same, via incoming webhook | Teams webhook URL |
| **Mailchimp / Constant Contact (recall lists only)** | One-way export of opted-in patients for recall campaigns — **no PHI fields**, only name + email + last-visit-date | API key |

**Out-of-scope integrations (explicitly refused if asked):** Dentrix / Eaglesoft / Open Dental / Epic / athenahealth / DrChrono / Practice Fusion / NEA / DentalXChange / Surescripts / any PMS / EHR / pharmacy / lab / clearinghouse. We surface a "Not supported — out of scope" tile so users know not to ask.

**Event routing:** When `verify-insurance` runs or an appointment is booked/changed, a small `dispatch-integrations` edge function fans the event out to every connected provider for that company (calendar push, Slack/Teams ping, webhook POST). Failures are logged in `company_integrations.last_error` and surfaced as a yellow "Action needed" pill on the card.

### 7. Demo seeder

- 6 demo practices (one per vertical), distributed across all 4 tiers, each pre-wired with at least one mock integration so the Integrations console isn't empty in demos.

### 8. Memory

- `mem://features/industry/healthcare-vertical-pack` — scope, HIPAA guardrails, vet pets-as-JSON model, OUT-OF-SCOPE list.
- `mem://features/integrations/healthcare-integrations-scope` — the 8 supported providers + the explicit blocklist of PMS/EHR/clearinghouse/pharmacy systems so future requests are auto-refused.

## Files touched

- 1 migration (blueprints, flag, trigger, insurance table, pets/pet_id columns, `company_integrations` table)
- 2 new edge functions: `verify-insurance`, `dispatch-integrations` (+ `ms-calendar-oauth` if user wants Outlook in v1)
- New: `src/pages/IntegrationsConsole.tsx`, `src/lib/integrations/healthcare/` (one file per provider), `src/components/integrations/IntegrationCard.tsx`
- Edits to: `aura-unified`, `agentStyles`, `industryFieldLabels`, `industryNavLabels`, `industryEmptyStates`, `industryKpiLabels`, `industryAnalyticsPresets`, `industryQuickActions`, `industryFormSchemas`, `industryAuraFraming`, `industryAuraSuggestions`, `CustomIndustryWizard`, `seed-demo-accounts-v2`, settings nav

Ready to build on approval.
