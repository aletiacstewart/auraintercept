# Continue Inline Form Tabs Rollout

Phase 1 (Customers) shipped the shared `InlineFormProvider` + `FormShell` primitive. This plan covers the remaining consoles.

## Pattern (per console)

For every page that hosts create/edit forms today via `<Dialog>` / `<Sheet>`:

1. Wrap page content in `<InlineFormProvider>`.
2. Mount `<InlineFormHost className="mt-4" />` directly under the page header (above the existing `<Tabs>`).
3. Replace the form component's `<Dialog>` wrapper with `<FormShell id="…" title="…" open onOpenChange>`. Keep `open` / `onOpenChange` API unchanged.
4. Leave confirmation dialogs, date pickers, command palettes, AI/Aura modals, and onboarding wizards as real dialogs.

## Phases

**Phase 2 — CRM core consoles**
- Leads: `AddLeadForm`, `EditLeadDialog` → `src/pages/Leads.tsx` (or `src/components/leads/*`)
- Quotes: `QuotesManager` new/edit quote dialogs → `src/pages/Quotes.tsx`
- Invoices: `InvoicesManager` new/edit invoice dialogs → `src/pages/Invoices.tsx`
- Appointments: new/edit appointment dialog → `src/pages/operations/AppointmentConsole.tsx` and `src/components/appointments/*`
- Inventory: `InventoryReportForm`, `InventoryUploadDialog` → `src/pages/Inventory.tsx`

**Phase 3 — Field Ops + Dispatch**
- New/Edit Job, Assign Technician, Dispatch notes → `src/pages/FieldOperations.tsx`, `src/components/fieldops/*`, `DispatchFieldOpsApp`
- Keep mobile technician PWA dialogs as-is on small viewports (host still works inline).

**Phase 4 — Business Mgt + Employees**
- Add/Edit Employee, Roles, Availability → `src/pages/Employees.tsx`, `src/pages/EmployeeDetail.tsx`, `src/components/employee/*`
- Payroll, Business Ops forms → `BusinessOpsAgentConsole`, `src/components/businessops/*`, `src/components/billing/forms/*`

**Phase 5 — Marketing, Social, Content**
- Campaigns: new campaign → `src/pages/Campaigns.tsx`, `src/components/marketing/*`
- Social: new post / template → `src/pages/ai-consoles/SocialMediaConsole.tsx`, `src/components/social/*`
- Content Engine: new content → `ContentEngineConsole`, `ContentEngineDashboard`
- Blog: new/edit post → `src/pages/BlogManagement.tsx`, `src/components/blog/*`

**Phase 6 — Communication / SMS / Voice / Knowledge**
- SMS keywords: `KeywordForm` inside `SMSKeywordsSection` → `src/pages/SMSLogs.tsx` host
- Outbound call form: `OutboundCallDialog` (keep as small modal — action trigger, not a record form) — verify and document exception
- Knowledge base entry forms → `src/components/knowledge/*`, `src/pages/KnowledgeBase.tsx`

**Phase 7 — Settings + Integrations + Cleanup**
- Settings sub-forms → `src/pages/Settings.tsx`, `src/components/settings/*`
- Integration setup forms (Calendar, Email, SMS, Tavily, Voice) under `src/pages/integrations/*`
- Final audit: `rg -n "<Dialog" src` and `rg -n "<Sheet" src` to confirm only allowed exceptions remain.
- Add a memory rule documenting the inline-form standard + exceptions.

## Out of scope (stay as dialogs)

- Confirmation / destructive-action dialogs
- Date / time / emoji pickers, command palettes
- AI/Aura command modals, voice overlays, switching overlays
- Onboarding wizards, tutorials, PWA install prompts
- Public marketing pages, landing chat widget
- Customer-portal lightweight action sheets

## Acceptance per phase

- Each form opens as a tab in the parent console (not a centered modal).
- Tab is closable via the × on the tab and via successful submit/cancel.
- No regressions in submit handlers, validation, or Supabase mutations.
- `rg "<Dialog" <files-touched>` returns no remaining create/edit forms.

## Execution

Phases land sequentially in separate messages so you can sanity-check UX between each (same primitive, same code shape). I'll start Phase 2 (Leads → Quotes → Invoices → Appointments → Inventory) on approval.
