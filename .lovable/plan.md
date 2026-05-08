## Phase 3 — Field Ops + Dispatch inline-form rollout

Apply the same `InlineFormProvider` + `FormShell` pattern from Phases 1–2 to the Field Operations and Dispatch consoles.

### Scope (in)
- **`src/pages/FieldOperations.tsx`** — wrap page content in `<InlineFormProvider>` and mount `<InlineFormHost className="mt-4" />` above the existing tabs / manager.
- **`src/pages/DispatchFieldOpsApp.tsx`** — wrap the dispatch console body in the provider/host (login screen left untouched; `ForgotPasswordDialog` stays modal).
- **`src/components/fieldops/FieldOpsManager.tsx`** — convert the two inline form-style dialogs:
  - **Notify Customer** dialog → `<FormShell id="fieldops-notify" title="Notify Customer" …>`
  - **Cancel Appointment** dialog → `<FormShell id="fieldops-cancel" title="Cancel Appointment" …>` (kept as a form because it collects a reason; if you'd rather keep it as a confirm modal, say so and I'll leave it.)
- **`src/components/appointments/TechnicianAssignmentDialog.tsx`** — swap `Dialog` for `FormShell id="assign-technician"` so it opens as an inline tab inside whichever console hosts it (FieldOps, Appointments, Dispatch).

### Scope (out — stay as real modals)
- `TechnicianCheckIn` photo-upload dialog (transient capture flow, not a form).
- `ForgotPasswordDialog` on the dispatch login screen.
- Any confirmation-only dialogs without form fields.

### Pattern (per console)
```text
<InlineFormProvider>
  <PageHeader … />
  <InlineFormHost className="mt-4" />
  <ExistingTabsOrManager />
</InlineFormProvider>
```

### Pattern (per dialog)
- Replace `<Dialog open … onOpenChange …><DialogContent>…</DialogContent></Dialog>` with
  `<FormShell id="…" title="…" description="…" open={…} onOpenChange={…} className="…">…</FormShell>`.
- Keep existing `DialogFooter` action buttons; render them inside the FormShell body (footer becomes a flex row of buttons).
- Triggers stay as plain `<Button onClick={() => setOpen(true)}>` (no `DialogTrigger`).

### Verification
- Open `/dashboard/field-ops` → click **Assign Technician**, **Notify Customer**, **Cancel** on a row → each opens as an inline tab with × close, not a centered modal.
- Open `/dispatch` (Dispatch console) → same actions render inline.
- Tab × button closes form and clears state; submit success closes the tab.
- Modal fallback still works on routes without a provider (sanity check by mounting `TechnicianAssignmentDialog` from a non-wrapped page).

### Out of scope for this phase
Phase 4+ (Employees, Marketing, Communication, Settings) follows after Phase 3 is verified.
