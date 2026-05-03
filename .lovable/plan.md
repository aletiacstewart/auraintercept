# Healthcare Vertical Pack — Final Plan (Scoped)

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

This narrows agent actions to: `book_appointment`, `reschedule`, `cancel`, `confirm_appointment`, `send_recall`, `verify_insurance` (email only), `triage_emergency` (route to staff/911), `answer_faq`.

## What gets built

### 1. Migration

- 6 rows in `industry_blueprints` (slugs: `dental`, `chiropractic`, `medical_office`, `veterinary`, `physical_therapy`, `optometry`). All use `operating_model='appointment_booking'` → reuses `AppointmentConsole`.
- `companies.healthcare_compliance boolean default false`.
- Extend `trg_sync_company_workspace` to auto-set the flag for healthcare slugs.
- New table `insurance_verification_requests` (company_id, customer_id, carrier, member_id, group_number, policyholder_name, policyholder_dob, photo_url nullable, status, requested_at, completed_at, notes). Standard RLS by company.
- `customers.pets jsonb default '[]'::jsonb` and `appointments.pet_id text` (nullable, vet-only).

### 2. Compliance overlay

- `aura-unified` `buildIndustrySystemPrompt` prepends a HIPAA guardrail block when `healthcare_compliance=true`:
  - AI must self-identify on first turn (vertical-aware).
  - No diagnosis, no clinical advice, no symptom interpretation.
  - No medication / refill discussion — route to staff.
  - No medical records discussion — route to staff.
  - Verify identity before sharing any patient info.
  - Required disclaimer line on any health-adjacent reply.
- Voice agent intro forced per-vertical: *"Hi, I'm Aura, an AI receptionist for [Practice]. I'm not a licensed dentist/doctor/chiropractor/therapist/optometrist/vet. I can help with appointments and insurance — for clinical questions I'll connect you with the team."*
- SMS/email composer shows a "Contains PHI — minimum-necessary rule" banner for healthcare tenants.

### 3. Insurance verification action — email-only

- New edge function `verify-insurance` (`verify_jwt=false`, internal):
  - Input: `{ company_id, customer_id, carrier, member_id, group_number, policyholder_name, policyholder_dob, photo_url? }` (Zod-validated).
  - Inserts row in `insurance_verification_requests` with status `pending`.
  - Sends email to `companies.notification_email` via existing `send-staff-notification` flow, body lists all collected fields and a "Mark verified" deep link to the customer record.
  - Also creates an in-app task assigned to staff so it shows in the dashboard task list.
- Surfaced as:
  - A `verify_insurance` agent action available to the customer-journey AI when caller asks about coverage.
  - A "Verify Insurance" Quick Action button on the patient record.

### 4. Terminology + UX overlays (existing files only)

Extend:
- `src/lib/agentStyles.ts` → `INDUSTRY_AGENT_LABELS` for 6 verticals.
- `src/lib/industryFieldLabels.ts` → Customers→Patients (vet: Pet Owners), Jobs→Visits / Adjustments / Sessions / Exams, Invoices→Statements, Follow-ups→Recalls / Rechecks / Progress Checks.
- `src/lib/industryNavLabels.ts`, `industryEmptyStates.ts`, `industryQuickActions.ts` → matching copy + CTAs (Book, Send intake, Verify insurance, Send recall).
- `src/lib/industryKpiLabels.ts` + `industryAnalyticsPresets.ts` → 5–8 KPIs per vertical (Today's Production, Schedule Fill, No-Show Rate, Case Acceptance, Hygiene Production, Collections Ratio, Pre-Appointment %).
- `src/lib/industryFormSchemas.ts` → simple new-patient intake (demographics, insurance, chief complaint, consents). **No medical/dental/spinal/vision history fields** — out of scope. Vet schema includes pets array (`name, species, breed, dob, sex, weight, notes`).
- `src/lib/industryAuraFraming.ts` + `industryAuraSuggestions.ts` → vertical scripts (emergency triage routing, insurance ask, reschedule, recall) per the supplied blueprints, scrubbed of refill/records language.

### 5. Onboarding

- Add the 6 healthcare options as first-class chips in `CustomIndustryWizard.tsx`.
- HIPAA acknowledgement modal on selection: "Aura is used as an AI receptionist for appointments and insurance intake only. It does not handle medical records, prescriptions, or clinical advice. Interactions are logged for compliance."

### 6. Demo seeder

- Add 6 demo practices (one per vertical) to `seed-demo-accounts-v2`, distributed across all 4 tiers so every combo is previewable.

### 7. Memory

- New: `mem://features/industry/healthcare-vertical-pack` capturing scope (appointments + insurance email only), HIPAA guardrails, vet pets-as-JSON model, and the explicit OUT-OF-SCOPE list so future changes don't accidentally add medical-record features.

## Files touched (summary)

- 1 migration (blueprints, flag, trigger extension, insurance table, pets/pet_id columns)
- 1 new edge function: `verify-insurance`
- Edits to: `aura-unified`, `agentStyles`, `industryFieldLabels`, `industryNavLabels`, `industryEmptyStates`, `industryKpiLabels`, `industryAnalyticsPresets`, `industryQuickActions`, `industryFormSchemas`, `industryAuraFraming`, `industryAuraSuggestions`, `CustomIndustryWizard`, `seed-demo-accounts-v2`

Ready to build on approval.
