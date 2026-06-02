## Scope SMS/Email Campaigns to the Campaign's Company (Customers + Leads)

### Problem
Campaign sends should only go to people who actually belong to the company that owns the campaign. Today `send-campaign`:
- Pulls only from `customer_profiles` filtered by `company_id` (good, but no `leads` table).
- Has no "Leads" segment option in the UI.
- Trusts duplicate/junk profiles. After the recent merge that's cleaner, but there's no guardrail against a profile slipping in with a different `company_id`.

### Changes

**1. Add a `Leads` segment (and `Leads + Customers`) to the Campaigns UI**
- File: `src/pages/Campaigns.tsx`
- Add `<SelectItem value="leads">Leads only</SelectItem>` and `<SelectItem value="leads_and_customers">Leads + Customers</SelectItem>` to the Target Segment select.

**2. Update `send-campaign` edge function to honor the new segments and stay company-scoped**
- File: `supabase/functions/send-campaign/index.ts`
- Keep the existing `customer_profiles` query with `.eq('company_id', companyId)`.
- When `segment === 'leads'`, query `leads` with `.eq('company_id', companyId)` and use those rows as recipients (map `email`, `phone`, treat missing opt-out as opt-in).
- When `segment === 'leads_and_customers'`, query both tables (both filtered by `company_id`) and concat, deduping by lowercased email and digits-only phone so the same person doesn't get hit twice.
- Defense-in-depth: right before send, re-assert `recipient.company_id === campaign.company_id` and drop any row that doesn't match (logs a `skipped: 'company_mismatch'` row in `campaign_sends`).
- Skip leads/customers where `email_opt_out` / `sms_opt_out` is true (leads don't have these columns — treat as opt-in for now; noted as a follow-up).

**3. Tag campaign_sends rows with `recipient_type`**
- Add `recipient_type: 'customer' | 'lead'` to the `logs` insert payload so the UI can show which list each send came from. This uses the existing `intake_data`/extra columns on `campaign_sends` if available; otherwise stored in the existing `customer_id` field with a separate `lead_id` only when the column exists. (Will inspect `campaign_sends` schema during implementation and add a migration only if needed.)

### Out of scope
- Adding `sms_opt_out` / `email_opt_out` columns to `leads` (separate follow-up).
- The previously-planned voice-intake hardening (Step 2) and duplicate-merge UI (Step 3) — still pending separately.
- Any change to how phone numbers are verified with SignalWire.
