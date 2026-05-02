---
name: Industry forms, reports, and notifications
description: Per-industry copy across Add forms, Aura ⌘K suggestions, analytics export PDF, and job notifications
type: feature
---
Phase 7 wires the industry pack into the four remaining surfaces:

1. **Add* forms** — `src/lib/industryFieldLabels.ts` exports `useIndustryFieldLabel(surface)` and `getIndustryFieldLabel(surface, field, pack)`. Used by `AddAppointmentForm` (service_type, service_address, customer_name) and `AddCustomerForm` (customer_name → "Client/Guest/Member", service_address). Resolution: industry_id → cluster → generic.
2. **Aura ⌘K suggestion chips** — `src/lib/industryAuraSuggestions.ts` → `getIndustryAuraSuggestions(pack)`. Wired into `AuraCommandModal`. Header quick-create + dashboard hero already use `getIndustryQuickActions` from `industryQuickActions.ts`.
3. **Analytics export PDF** — `src/lib/industryReportTemplates.ts` exports `getIndustryReportTemplate(pack)` and `getSectionLabel(pack, id)`. Wired into `ExportReportForm` for both the report type checklist labels and the generated PDF title + section headings.
4. **Job notifications** — `supabase/functions/send-job-notification/index.ts` resolves `terminology.job` via the `get_company_industry_pack` RPC and substitutes "Job" → "Showing/Reservation/Repair Order/etc." in employee SMS, email subject, and email body across `assigned`, `accepted`, and `completed` notification types. `serviceType` already came from the appointment so customer messages were vertical-correct.

Acceptance: switching `industry_id` on a company row visibly changes form labels (Add Customer, Add Appointment), ⌘K suggestion chips, exported PDF report title/sections, and outbound staff notification subject/body — without any further code changes.

Out of scope: search-result empties, marketing site, public booking widget (already pack-aware).
