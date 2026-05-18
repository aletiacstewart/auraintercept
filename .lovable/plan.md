## Goal
Turn the single-flow Free AI Opportunity Audit at `/audit` into an industry-aware audit. User picks their industry first, then the audit asks a mix of universal + industry-specific questions and produces an industry-specific recommendation and PDF.

## UX Flow

```
/audit  →  [Industry Picker Step]  →  [Audit Questions]  →  [Results + PDF]
                ↑ change industry chip persists in header during the flow
```

1. **Step 0 — Industry Picker** (new). Full-page card with a dropdown (or grid) listing all 28 packs grouped by cluster (Essential Trades, Property & Estate, Wellness & Personal, Healthcare, etc.) using `INDUSTRY_LIST` / `INDUSTRY_GROUPS` from `src/lib/industryMarketingContent.ts`. "Not sure / Other" option falls back to the current generic flow.
2. **Steps 1..N — Questions.** Renders `[…universalQuestions, …industryQuestions[selectedIndustry]]`. Section badge + progress bar already handle variable lengths.
3. **Change-industry chip** in the audit header lets the user switch industries mid-flow (clears industry-specific answers, keeps universal ones).
4. **Results page** shows the recommended tier + industry name + industry-tinted hero, and the PDF filename + intro include the industry label.

## Question Model Changes (`src/components/audit/types.ts`)

- Keep existing `QUESTIONS` array but split it:
  - `UNIVERSAL_QUESTIONS` — the 11 questions that apply to everyone (employee_count, after_hours_calls, lead_volume, ai_interaction_mode, missed_calls, booking_process, review_collection, appointment_reminders, social_media_activity, website_status, launch_timeline).
  - Remove `industry_type` (replaced by the picker step).
  - Remove `service_location`, `dispatch_routing`, `customer_eta`, `quoting_process`, `inventory_tracking`, `marketing_automation`, `existing_integrations`, `phone_setup` from universal — they become industry-conditional.
- New `INDUSTRY_QUESTIONS: Record<string, AuditQuestion[]>` keyed by canonical industry id from `industry-id-canonical-standard`. Each pack gets 4–6 industry-specific questions reusing the existing `TierScores` shape so the tier-fit math is unchanged.

### Industry question buckets (examples — full set in new file)

- **hvac / plumbing / electrical / roofing / appliance_repair / handyman / fencing / pool_spa / pest_control / landscape / solar / construction / auto_care / security_systems** (field trades): dispatch_routing, customer_eta, quoting_process, inventory_tracking, phone_setup, emergency_after_hours.
- **real_estate**: listing_volume, open_house_followup, commission_pipeline, lead_source_mix, showing_scheduling, crm_integration.
- **restaurants**: reservation_volume, takeout_delivery_mix, online_ordering, review_volume, waitlist_management, menu_update_cadence.
- **beauty_wellness**: booking_density, rebooking_rate, package_sales, no_show_rate, retail_inventory, intake_forms.
- **personal_assistant**: client_count, retainer_vs_hourly, task_channel_mix, calendar_integration.
- **home_health / physical_therapy / occupational_therapy / hospice**: visit_volume, payer_mix, intake_documentation, scheduling_complexity, compliance_followup. (No quoting/inventory in healthcare bucket — replaced by intake + compliance.)

Each bucket lives in a new file `src/lib/auditIndustryQuestions.ts` exporting `INDUSTRY_QUESTIONS` plus a small `INDUSTRY_SECTION_ORDER` map so `SECTION_ORDER` rebuilds dynamically per industry.

## Files to add / change

**New**
- `src/lib/auditIndustryQuestions.ts` — `INDUSTRY_QUESTIONS` map (all 28 ids + `other` fallback) and `getQuestionsForIndustry(id)`.
- `src/components/audit/AuditIndustryPicker.tsx` — first-step picker UI (dropdown grouped by cluster, with emoji + label, "Not sure" option).

**Edit**
- `src/components/audit/types.ts` — split into `UNIVERSAL_QUESTIONS`; keep `TIER_RECOMMENDATIONS` and `SECTION_ORDER` types; export a helper `buildSectionOrder(industryId)`.
- `src/components/audit/AgentOpportunityAudit.tsx`
  - New state: `selectedIndustry: string | null` (persisted in the same `localStorage` blob).
  - Render `<AuditIndustryPicker>` when `selectedIndustry === null`.
  - Compose `questions = useMemo(() => [...UNIVERSAL_QUESTIONS, ...getQuestionsForIndustry(selectedIndustry)], [selectedIndustry])`.
  - Re-derive `progress`, `currentSection`, `sectionIndex` from this dynamic list.
  - Header now shows an "Industry: {emoji} {label} — change" chip.
- `src/components/audit/AuditResults.tsx` — accept `industryId`, show industry label + emoji in hero, pass through to PDF.
- `src/components/audit/AuditChecklistPDF.tsx` — accept `industryId`, include industry name in title page + tailor the "What's included" intro line using `getIndustryContent(id)`.
- `src/pages/OpportunityAudit.tsx` — SEO title remains generic; no other changes.

## Scoring & tier math

Unchanged. Industry-specific questions use the same `TierScores` shape, so the average-based `tierPercentages` calculation in `AgentOpportunityAudit.tsx` keeps working with a variable question count.

## Persistence

Extend `SavedProgress` with `selectedIndustry`. Same 24-hour expiry. `handleRestart` clears industry too.

## Out of scope

- No backend / DB changes — the audit remains fully client-side, anonymous, no signup.
- No changes to `auditFindings.ts` (internal QA doc).
- No marketing page / pricing changes.
- Tier recommendation copy stays generic; only the framing + PDF intro mention the chosen industry.
