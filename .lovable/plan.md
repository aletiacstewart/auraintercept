## Continue Industry-Awareness Rollout

Two parallel workstreams remain. Tackle both in this batch.

### 1. Seed Quote & Invoice Templates into Industry Packs

Populate `quote_template` and `invoice_template` JSONB on `industry_template_packs` rows so the recently-wired forms actually pre-fill. One migration, all 18 verticals.

Per-vertical line-item starters (examples):
- **Dental** — Comprehensive Exam, Cleaning, Bitewing X-Rays, Fluoride
- **Veterinary** — Wellness Exam, Vaccinations (DHPP/Rabies), Heartworm Test
- **Chiropractic** — Initial Consultation, Adjustment, Therapeutic Modalities
- **Medical Office / PT / Optometry** — vertical-appropriate visit + procedure codes
- **Salon / Beauty** — Service charge, Product, Gratuity line
- **Fitness** — Session/Class pack, Membership, Assessment
- **Professional Services** — Consultation hours, Deliverable, Retainer
- **Trades (HVAC/Plumbing/Electrical/Roofing/Landscaping/Pest/Cleaning/Auto)** — Diagnostic, Labor, Materials, Trip charge
- **Restaurants / Real Estate** — minimal (catering deposit / commission line) since billing is rarely used

Each template carries: `line_items: [{description, quantity, unit_price, taxable}]`, `default_tax_rate`, `default_terms`, `footer_note`.

### 2. Field Ops Console — In-Office Vertical Refinement

Use `hasFieldTechnicians(pack)` (already exists in `src/lib/industryCapabilities.ts`) to gate dispatch UI.

Surfaces to update:
- `src/pages/FieldOperations.tsx` and `src/pages/ai-consoles/FieldOpsConsole.tsx` — when `hasFieldTechnicians === false`, swap "Dispatch Board / Map / Travel Time" for an "In-Office Schedule" view (today's chair/room/provider list).
- `src/components/fieldops/*` — hide route-map, ETA, and "On The Way" status chips for in-office verticals; replace with "Ready / In Room / Checked Out".
- `src/pages/technician/TechnicianDashboard.tsx` and `TechnicianJobs.tsx` — relabel "Jobs" → pack terminology (`appointments` for dental/medical, `clients` for salon/fitness/professional). Hide "Navigate" / address map button when `address_required === false`.
- `useFieldOpsWorkflow.ts` — short-circuit travel-time and geolocation hooks for in-office packs.

### 3. Memory Update

Add a memory note documenting:
- `quote_template` / `invoice_template` JSONB shape on `industry_template_packs`
- `hasFieldTechnicians()` as the canonical gate for dispatch-vs-in-office UI

### Files (expected)

- `supabase/migrations/2026050318xxxx_seed_quote_invoice_templates.sql` (new)
- `src/pages/FieldOperations.tsx`, `src/pages/ai-consoles/FieldOpsConsole.tsx`
- `src/components/fieldops/*` (status chips, dispatch board)
- `src/pages/technician/TechnicianDashboard.tsx`, `TechnicianJobs.tsx`
- `src/hooks/useFieldOpsWorkflow.ts`
- `mem://architecture/industry-billing-templates.md` (new)

### Out of Scope (future loop)
- AI prompt audit across operative edge functions
- Salon/Fitness/Professional pack data deep-fill beyond billing templates
- Quotes/Invoices managers list-view terminology (forms only this round)

Reply **go** to proceed, or pick **1** (templates only) or **2** (field-ops only).
