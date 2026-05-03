
# Platform-Wide Industry Awareness + Plan/Channel Matrix Refresh

Two parallel workstreams. Both ship together because they touch the same pack data + plan-comparison surfaces.

---

## Workstream A — Make every surface industry-aware

### A1. Audit pass (find every "generic" leak)

I'll grep the codebase and inventory every form, console, dashboard, and AI prompt that still hardcodes copy or fields. Fix list, by area:

**Forms & data entry**
- `ServicesManager` (Add/Edit/View/Import Service) — placeholders, service types, suggested catalog
- `AddAppointmentForm` — title, time grid, durations, reminders, address visibility
- `AddCustomerForm` — "Customer" noun, address optionality (Patient/Guest/Member/Client)
- `AddLead`, `QuoteForm`, `InvoiceForm` — line-item placeholders, scope-of-work copy
- `InventoryReportForm`, `InventoryUploadDialog` — "Truck Inventory" vs "Supply Closet" vs "Retail Stock" vs "Pet Pharmacy"
- `IntakeSummary`, `DynamicIntakeFields` — already pack-driven, verify all surfaces use it
- `CommunicationPreferencesCheckboxes` — filter channels by `appointment_rules.reminder_channels`
- `KeywordForm` (SMS) — example keywords from pack
- `EmployeeDetail` / `Employees` / `EmployeeAvailability` — role label (Stylist, Trainer, Agent, Crew, Tech, Provider, Server)
- `KnowledgeBaseWizard`, `DocumentsManager`, `FAQsManager` — seed FAQs/docs from pack `kb_seed_documents`
- `OnboardingForm`, `OnboardingChecklist`, `GoLiveTimeline` — vertical-specific go-live steps
- `SmartWebsiteServicesEditor`, `SmartWebsiteManager` — pack-driven default service blocks + page sections
- `BlogManagement` topic suggestions — vertical-specific
- `ServiceLocationSearch` — hidden when `appointment_rules.allow_address === false`

**Consoles / dashboards**
- `CompanyAdminDashboard`, `Dashboard`, `EmployeeDashboard`, `TechnicianDashboard` — KPI labels (already partial via `industryKpiLabels`); audit for stragglers
- `FieldOpsConsole` / `DispatchFieldOpsApp` — already gated by `console_visibility.field_ops`; verify all booking-cluster verticals hide the dispatch map
- `AppointmentConsole`, `ReceptionistConsole`, `PipelineConsole`, `CustomConsole` — terminology + empty-state CTAs
- `BusinessManagementConsole`, `MarketingSalesConsole`, `CustomerPortalConsole`, `SocialMediaConsole`, `AnalyticsConsole`, `ContentEngineConsole`, `SpecialistOperativesConsole` — header copy, agent cards, suggestions
- `Inventory`, `Invoices`, `Quotes`, `Leads`, `Campaigns`, `Referrals`, `Messages`, `CallHistory`, `SMSLogs`, `EmailLogs`, `Analytics`, `BusinessOperations` — page titles, empty states, default filters
- `CustomerCompanyPortal`, `CustomerPortalHome`, `PortalQuickActions` — already pack-driven; audit
- Technician suite (`TechnicianJobs/Calendar/History/Profile/Settings/AIConsole`) — role noun, job vs visit vs appointment
- Public marketing: `PublicBooking`, `Widget`, `Index` industry showcase strip

**AI agents / prompts**
- All edge functions in `supabase/functions/` that build prompts must call `applyIndustryPackToPrompt` (the helper exists). Audit which are missing it: `voice-call`, `sms-reply`, `chat-stream`, `customer-chat`, `aura-*`, `lead-*`, `booking-*`, `content-engine-*`. Add the call where missing.
- `helpContentConfig`, `howToUseContent`, `industryHelpContent`, `industryHelpPrompts`, `industryAuraSuggestions`, `industryAuraFraming`, `industryQuickActions` — fill gaps for the verticals currently missing entries (healthcare 6 + salon/fitness/professional).
- Tutorial steps (`tutorialSteps.ts`) — vertical-specific hello copy.
- Marketing playbooks (`industryMarketingPlaybooks.ts`) — fill missing verticals.
- Report templates (`industryReportTemplates.ts`) — fill missing verticals.
- Form labels / nav labels (`industryFieldLabels`, `industryNavLabels`, `industryPortalCopy`, `industryFormSchemas`) — fill missing verticals.

### A2. Extend the Industry Pack data model

Single migration adds JSON columns to `industry_template_packs` (additive, default `[]`/`{}`):

| Column | Drives |
|---|---|
| `service_catalog` | Add Service starter list + placeholders |
| `service_type_options` | Service Type dropdown override per vertical |
| `appointment_rules` (extend) | `business_hours`, `default_durations`, `reminder_channels`, `allow_address`, `allow_appointments`, `default_service_type` |
| `customer_intake_schema` | Optional extra fields on Add Customer (e.g. species/breed for vet, insurance for healthcare, member tier for fitness) |
| `inventory_taxonomy` | Categories + units shown in Inventory console |
| `kb_seed_documents` (already exists) | Auto-seeded FAQs and docs per vertical on first login |
| `quote_template`, `invoice_template` | Default line-item templates |

Add column to `services`: `intake_schema_overrides jsonb null` for per-service extra questions.

Public RPC `get_public_industry_pack` extended to expose: `service_catalog`, `service_type_options`, safe parts of `appointment_rules` (no prompts).

### A3. Seed missing/empty packs (one migration, idempotent UPSERT)

- **Healthcare (6, currently empty)**: `dental, chiropractic, medical_office, physical_therapy, optometry, veterinary` — full data per HIPAA-scoped scope (no EHR/records/meds).
- **Booking gaps**: insert `salon, fitness, professional` packs (currently missing — companies fall back to generic).
- **Restaurants**: set `appointment_rules.allow_appointments = false`, lock to smart-link voice/SMS/chat. Hide Add Appointment button entirely for this vertical.
- **Existing trades/outdoor/repair** packs: backfill `service_catalog`, `service_type_options`, `appointment_rules.business_hours/reminder_channels/default_durations` so Add Service/Appointment are also pack-aware for them (they already have `job_templates` + `form_schemas`).

### A4. New-company inheritance

`SECURITY DEFINER` function `seed_company_starter_data(p_company_id)`:
- Copies `service_catalog` → `services` (inactive drafts).
- Copies `kb_seed_documents` → `knowledge_documents` + FAQs.
- Copies `inventory_taxonomy` defaults → `inventory_categories`.
- Idempotent: skips if target tables already have rows.

Triggered:
- Right after company creation (signup edge function).
- On first company-admin dashboard load if tables are empty (defensive).

### A5. Frontend changes

- Extend `useIndustryPack`/`IndustryPack` type with new fields.
- New helpers in `industryFormSchemas.ts`: `resolveServiceCatalog`, `getAppointmentRules`, `getServiceTypeOptions`, `getCustomerIntakeSchema`.
- Wire into the form/console list above. Each surface reads `useIndustryPack()` and substitutes labels/options/empty-state CTAs.
- Reusable `<IndustryAware>` HOC isn't needed — direct hook usage keeps it explicit.

---

## Workstream B — Plan & Documentation matrix refresh

Now that **specialist operatives are active on all plans** and **all plans include voice/SMS/email/chat**, the comparison tables and 3rd-party-integration matrix are stale. The screenshots show:

- "Specialist Operatives (Industry-Specific)" still gated to Pro/Elite (X/X/✓/✓)
- "Talk to Aura (Voice)" + "SMS Reminders" still X on Core
- "Field Operations Console", "Social Media Console", "Business Management Console", "Analytics & Reports Console" still gated by tier
- "SignalWire" + "ElevenLabs" marked **Limited** on Core
- "A2P 10DLC Compliance" marked Optional on Core

### B1. New canonical matrix (applied everywhere)

| Row | Core | Boost | Pro | Elite |
|---|---|---|---|---|
| Diagnostic / Permit / Survey / Insurance Claim Agent (specialist) | ✓ | ✓ | ✓ | ✓ |
| Talk to Aura (Voice) | ✓ | ✓ | ✓ | ✓ |
| Message Aura (Text) | ✓ | ✓ | ✓ | ✓ |
| Email Reminders | ✓ | ✓ | ✓ | ✓ |
| SMS Reminders | ✓ | ✓ | ✓ | ✓ |
| Customer Portal Console | ✓ | ✓ | ✓ | ✓ |
| Outreach & Sales Ops Console | ✓ | ✓ | ✓ | ✓ |
| Creative & Web Presence Console | ✓ | ✓ | ✓ | ✓ |
| Social Media Console | ✓ | ✓ | ✓ | ✓ |
| Field Operations Console | ✓ (vertical-conditional) | ✓ | ✓ | ✓ |
| Analytics & Reports Console | ✓ (basic) | ✓ | ✓ | ✓ |
| Business Management Console | — | — | ✓ | ✓ |
| SignalWire / ElevenLabs / Resend / Tavily | Bundled | Bundled | Bundled | Bundled |
| A2P 10DLC Compliance | Required | Required | Required | Required |
| Calendar Sync, Stripe, Social Accounts | per existing matrix |

(Field Ops still hides itself for booking-cluster verticals via `console_visibility` — that's industry-driven, not tier-driven.)

### B2. Files to update

- `src/lib/subscriptionAgentConfig.ts` — set all four tiers' `agents` lists to include the specialist operatives + all 4 comms channels; promote previously gated consoles to all tiers per matrix above.
- `src/lib/documentationConfig.ts` + `helpContentConfig.ts` — update "Channels included" + "Specialist Operatives" highlights for Core & Boost.
- `src/pages/Index.tsx` (landing pricing cards) — update bullet lists.
- `src/pages/Subscription.tsx` (in-app picker) — update `highlights` arrays.
- `src/pages/Calculators.tsx` and the comparison table component — flip the X→✓ cells per the matrix.
- `src/components/documentation/PricingSummaryPDF.tsx`, `SalesPitchDataPDF.tsx`, `WebsiteCopyPDF.tsx`, `ComprehensiveGuidesPDF.tsx`, `OutreachToolkit*` — regenerate with new matrix copy.
- `src/lib/accessControl.ts` — drop tier gates that are now universal; keep only Business Management Console (Pro+) gated.
- "See more details" / "What's included" modals across plan cards.
- 3rd-party integrations matrix: replace "Limited" cells with "Bundled" wording on Core; drop carrier-fee disclaimer language (already covered by [3rd-Party Usage Bundled] memory).

### B3. Memory + scanner

- Update `mem://marketing/pricing/canonical-four-tier-model` and `mem://features/ai-operatives/specialists-all-plans` to be canonical references for the new matrix.
- Add `mem://features/billing/pricing-and-billing-logic` note: "Specialist operatives + all 4 comms channels are universal across tiers; Business Management Console remains the only Pro+ console."

---

## Technical Details

```text
DB migration (single)
├─ ALTER industry_template_packs
│    ADD service_catalog jsonb DEFAULT '[]'
│    ADD service_type_options jsonb DEFAULT '[]'
│    ADD customer_intake_schema jsonb DEFAULT '{}'
│    ADD inventory_taxonomy jsonb DEFAULT '{}'
│    ADD quote_template jsonb DEFAULT '{}'
│    ADD invoice_template jsonb DEFAULT '{}'
├─ ALTER services ADD intake_schema_overrides jsonb NULL
├─ UPSERT packs:
│    healthcare (6) — full data
│    salon, fitness, professional — new packs
│    backfill 16 existing packs with new columns
├─ ALTER appointment_rules per pack with new keys (UPDATE)
├─ CREATE OR REPLACE FUNCTION get_public_industry_pack(...)
│    return new safe columns
└─ CREATE FUNCTION seed_company_starter_data(uuid)
     SECURITY DEFINER, idempotent

Frontend (~25 files)
├─ src/hooks/useIndustryPack.ts                — extend type
├─ src/lib/industryFormSchemas.ts              — new resolvers
├─ src/lib/industryCapabilities.ts             — add hasAppointments, hasInventory
├─ src/components/knowledge/ServicesManager.tsx
├─ src/components/appointments/AddAppointmentForm.tsx
├─ src/components/customers/AddCustomerForm.tsx
├─ src/components/leads/* + quotes/* + invoices/*
├─ src/components/inventory/*
├─ src/components/customer/CommunicationPreferencesCheckboxes.tsx
├─ src/components/sms/KeywordForm.tsx
├─ src/components/knowledge/{KnowledgeBaseWizard,FAQsManager,DocumentsManager}.tsx
├─ src/components/onboarding/* + smartwebsite/*
├─ src/pages/ai-consoles/* (header copy + agent cards)
├─ src/pages/technician/*  (role noun)
└─ src/lib/{industryHelpContent,industryHelpPrompts,industryAuraSuggestions,
            industryQuickActions,industryMarketingPlaybooks,industryReportTemplates,
            industryNavLabels,industryPortalCopy,industryKpiLabels,
            tutorialSteps}.ts                  — fill missing verticals

Edge functions (~10)
└─ supabase/functions/{voice-call,sms-reply,chat-stream,customer-chat,
                       aura-*,lead-*,booking-*,content-engine-*}/index.ts
   wrap base prompts with applyIndustryPackToPrompt(...)

Plan / matrix files (~12)
├─ src/lib/subscriptionAgentConfig.ts
├─ src/lib/documentationConfig.ts
├─ src/lib/helpContentConfig.ts
├─ src/lib/accessControl.ts
├─ src/pages/Index.tsx
├─ src/pages/Subscription.tsx
├─ src/pages/Calculators.tsx
├─ src/components/documentation/{PricingSummaryPDF,SalesPitchDataPDF,
                                  WebsiteCopyPDF,ComprehensiveGuidesPDF}.tsx
└─ comparison-table & "See more details" components

Memory
├─ update mem://marketing/pricing/canonical-four-tier-model
├─ update mem://features/ai-operatives/specialists-all-plans
└─ new   mem://architecture/industry-pack-data-model-v2
```

## Out of Scope

- No EHR/PMS/pharmacy integrations (healthcare scope locked).
- No multi-location split.
- Restaurants stays smart-link only (no reservation table).
- Stripe price/product changes — not needed; all current price IDs remain.

## Validation

- Snapshot Add Service + Add Appointment + Knowledge Base wizard for one demo account in each cluster (HVAC trades, Landscape outdoor, Auto repair, Salon booking, Dental healthcare, Restaurant) and verify copy + fields.
- Visual diff of pricing page + Subscription picker + PDF exports against the new matrix.
- Run existing `useIndustryPack.test`, extend with new fields.

## Suggested split

This is large. Recommend implementing in two passes so each is reviewable:

1. **Pass 1** (Workstream B + DB schema additions only, no frontend audit yet) — flip the plan/matrix everywhere, update PDFs, drop tier gates, update memory. Pure copy + access-control changes.
2. **Pass 2** (Workstream A) — seed the missing packs and wire every form/console/agent prompt to the pack data.

Confirm whether you want both passes in one go, or pass 1 first.
