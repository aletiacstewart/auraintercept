## Industry-Awareness Rollout — Phase B → A → E

Three sequential workstreams, executed in this order so downstream surfaces have richer data to render.

---

### B. Salon / Fitness / Professional pack deep-fill

Bring the lighter packs up to parity with trades/healthcare. Single migration that updates `industry_template_packs` rows for these `industry_id`s:

- `beauty_wellness` (salon/spa/barber)
- `fitness` (gym/studio/personal training)
- `professional_services` (consulting/legal/accounting/marketing agencies)

For each, populate / expand:
- **`agent_prompt_deltas`** — keys: `voice`, `sms`, `chat`, `booking`, `billing`, `lead`, `outreach`. 2–4 sentences each, vertical-specific (e.g. salon: "Always confirm stylist preference and service duration. Mention add-ons like deep conditioning or color gloss.").
- **`terminology`** — full map: jobs→appointments/sessions/engagements, customers→clients/members, technician→stylist/trainer/consultant, quote→proposal/treatment plan/SOW, invoice→statement/membership invoice.
- **`quick_actions`** — 6–8 vertical actions (Salon: "Book Color Service", "Add to Stylist Waitlist"; Fitness: "Book Class", "Renew Membership"; Pro Services: "Schedule Discovery Call", "Send SOW").
- **`kpi_labels`** — relabel the standard 6 KPIs (e.g. salon: "Chair Utilization", "Avg Ticket", "Rebook Rate"; fitness: "Active Members", "Class Fill Rate", "Churn"; pro services: "Billable Hours", "Utilization", "Pipeline Value").
- **`empty_states`** — vertical copy for leads/quotes/invoices/customers/jobs.
- **`marketing_playbooks`** — 2–3 starter campaigns each (salon: "Color Refresh Reminder"; fitness: "30-Day Comeback"; pro: "Quarterly Check-in").

---

### A. List-view terminology pass

Wire `useIndustryPack` into the manager/list pages so titles, table headers, empty states, and primary CTAs read from `pack.terminology`:

- `src/pages/Quotes.tsx` + `src/components/quotes/QuotesManager.tsx`
- `src/pages/Invoices.tsx` + `src/components/invoices/InvoicesManager.tsx`
- `src/pages/Leads.tsx`
- `src/pages/Inventory.tsx` (relabel "Inventory" → "Products" / "Retail" for salon, or hide entirely for pro services where `pack.has_inventory === false`)
- `src/pages/EmployeeAppointments.tsx` (relabel "Jobs" → "Appointments" / "Sessions" / "Engagements")
- `src/pages/Employees.tsx` (relabel role pickers via terminology)

Use existing `IndustryEmptyState` for the empty body. No data-shape changes.

---

### E. Notification & email/SMS template terminology

Wire pack terminology into outbound message copy. Each function loads the pack via the existing shared helper and substitutes nouns into subjects/bodies:

- `supabase/functions/send-appointment-email/index.ts` — subject: "Your {appointment} with {company}" → "Your visit with Dr. Smith" / "Your training session at FitClub"
- `supabase/functions/send-appointment-sms/index.ts` — same noun swap, keep <160 char budget
- `supabase/functions/send-job-notification/index.ts` — staff alerts: "New job assigned" → "New appointment assigned" / "New client engagement"
- `supabase/functions/appointment-reminders/index.ts` — reminder copy
- `supabase/functions/lead-follow-up-reminders/index.ts` — "lead" → terminology.lead (e.g. "prospect" / "inquiry")
- `supabase/functions/monthly-digest/index.ts` + `weekly-digest/index.ts` + `quarterly-digest/index.ts` — section headers via terminology
- `supabase/functions/send-review-request/index.ts` — "Rate your service" → "Rate your visit" / "Rate your session"

Pattern: small `applyTerminology(template, pack)` helper added to `_shared/industry-pack.ts` that does string substitution on a known set of placeholders (`{appointment}`, `{job}`, `{customer}`, `{technician}`, `{quote}`, `{invoice}`, `{lead}`).

---

### Out of Scope (later phases C/D/F/G)

- Customer-facing portal terminology (Phase C)
- Analytics KPI label rewiring (Phase D — partly enabled by B's `kpi_labels`)
- Vertical-specific Fast Start questions (Phase F)
- KB seed expansion beyond what's already in `kb_seed_documents` (Phase G)

### Files (expected)

- `supabase/migrations/2026050319xxxx_deepen_salon_fitness_pro_packs.sql` (new)
- `src/pages/Quotes.tsx`, `Invoices.tsx`, `Leads.tsx`, `Inventory.tsx`, `EmployeeAppointments.tsx`, `Employees.tsx`
- `src/components/quotes/QuotesManager.tsx`, `src/components/invoices/InvoicesManager.tsx`
- `supabase/functions/_shared/industry-pack.ts` (add `applyTerminology` helper)
- 9 notification edge functions listed above
- Memory note: extend `mem://architecture/industry-prompt-injection-standard` with terminology placeholder convention

Reply **go** to execute B → A → E in sequence, or pick a single letter to scope to one workstream.

---

## Phase C — Customer-facing surfaces (in progress)

- ✅ `BookingForm` — header, pending notice, and submit CTA now use `pack.terminology.appointment`
- ✅ `CustomerAIChat` — greeting fallback + quick-action labels/prompts use industry noun
- Remaining: portal welcome subtitle deeper wiring, embed widget script copy, public booking confirmation already done
