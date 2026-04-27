## Plan: SMS Opt-In / Opt-Out for Aura Intercept (Company + Employee Signup)

### Goal
Add a clear, A2P 10DLC-compliant SMS opt-in/opt-out checkbox to the company signup flow and employee onboarding/registration, plus a way to change the choice later from settings. Consent is stored per user/company and respected by all platform-originated SMS (announcements, product updates, billing alerts, onboarding nudges) sent from Aura Intercept itself — separate from per-customer transactional SMS.

### Scope (what counts as "SMS from Aura Intercept")
- Platform announcements, product updates, onboarding tips, billing/usage alerts, system status alerts sent to the **company admin / employee phone number** by Aura Intercept (the platform), not by their own business.
- This is distinct from `customer_profiles.sms_opt_out` (their customers) and `staff_notification_preferences.sms_alerts_enabled` (job/booking alerts from their own company).

### Database changes (one migration)

Add platform-SMS consent columns:

- `public.profiles`
  - `aura_sms_opt_in boolean not null default false`
  - `aura_sms_consent_at timestamptz null`
  - `aura_sms_consent_ip text null`
- `public.companies`
  - `aura_sms_opt_in boolean not null default false` (company-level marketing/billing SMS to primary contact)
  - `aura_sms_consent_at timestamptz null`
  - `aura_sms_consent_ip text null`

Default `false` (explicit opt-in required, per 10DLC/TCPA). Consent timestamp + IP captured for audit.

### UI changes

1. **Company signup — `src/pages/Auth.tsx`** (company tab)
   - Below the existing 10DLC compliance acknowledgement and Terms checkbox, add an **unchecked-by-default** `Checkbox`:
     > "Send me SMS from Aura Intercept at {{companyPhone}} — product updates, billing alerts, and onboarding tips. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help. Consent not required to purchase."
   - Disabled until `companyPhone` is filled. State: `auraSmsOptIn`. Persisted to `companies.aura_sms_opt_in` + timestamp on company creation.

2. **Employee signup — `src/pages/Auth.tsx`** (employee tab) and **`src/components/onboarding/CompanyOnboardingForm.tsx`** (per-employee row)
   - Add the same opt-in checkbox tied to the employee's phone. Stored on `profiles.aura_sms_opt_in`.
   - For the multi-employee table in `CompanyOnboardingForm`, add a small "SMS OK" checkbox column per row.

3. **Reusable component — `src/components/auth/SmsOptInCheckbox.tsx`** (new)
   - Self-contained: takes `phone`, `checked`, `onCheckedChange`, optional `recipientLabel`. Renders the full TCPA-compliant disclosure. Used in all 3 places above.

4. **Settings — change later**
   - `src/components/settings/` → add a small "Aura Intercept SMS" toggle in the existing notification settings panel for the logged-in user (and a company-level one for company admins). Toggling off writes `aura_sms_opt_in = false` and clears consent timestamp.

### Backend / sending logic

- Any future edge function that sends platform-originated SMS (e.g. `trial-reminders`, `cost-alerts`, future `aura-platform-sms`) must check `aura_sms_opt_in = true` on the recipient's profile/company before sending. Add a shared helper note in the new migration's comment so it's discoverable; no existing function currently sends platform SMS to admins, so no immediate edits needed beyond gating future ones.
- Inbound `STOP` keyword handling: extend `supabase/functions/sms-handler/index.ts` so that an inbound `STOP` from a number matching a `profiles.phone` or `companies.phone` flips `aura_sms_opt_in = false` and replies with the standard confirmation. `START`/`UNSTOP` re-enables.

### Files touched

- **New**: `src/components/auth/SmsOptInCheckbox.tsx`
- **New**: `supabase/migrations/<timestamp>_add_aura_sms_consent.sql`
- **Edit**: `src/pages/Auth.tsx` (company + employee signup tabs)
- **Edit**: `src/components/onboarding/CompanyOnboardingForm.tsx` (add per-employee checkbox)
- **Edit**: `src/components/company/AlertsSettings.tsx` (or notification settings page) — add toggle
- **Edit**: `supabase/functions/sms-handler/index.ts` — STOP/START handling for platform consent
- **Edit**: `supabase/functions/create-company-admin/index.ts` — persist `aura_sms_opt_in` + consent metadata when creating company/admin

### Compliance notes
- Disclosure language follows CTIA / 10DLC best practices: identifies sender (Aura Intercept), purpose, frequency, rates, STOP/HELP, and "consent not required to purchase".
- Default = unchecked (express written consent).
- Consent record (timestamp + IP) stored for audit.
- Honored across all platform SMS via the gating check + STOP keyword.

### Verification
- New company signup with checkbox unchecked → `companies.aura_sms_opt_in = false`.
- Checked → `true` with timestamp populated.
- Texting STOP from the saved phone → flips to `false` and confirmation reply sent.
- Settings toggle round-trips correctly.