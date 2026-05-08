# Plan: Replace pop-up forms with inline console tabs

## Goal
Across every dashboard console/page, convert `<Dialog>` / `<Sheet>` create+edit forms into **inline tabs** opened in the same console. No more modal pop-ups for forms.

## Tab behavior (default — confirm if different)
- A console keeps its existing tab bar.
- Clicking a `+ Add / New / Edit` button opens a **dynamic tab** ("New Customer", "Edit Lead #123", etc.) with a close (×).
- Submit/Cancel closes the dynamic tab and returns to the list tab. Multiple edits can stack as separate tabs.
- Confirm-only dialogs (Delete?, "Are you sure?") and pickers (date picker, command menu) **stay** as small modals — only **forms with input fields** are converted.

## Shared primitive
Create one reusable component used everywhere:

`src/components/ui/inline-form-tabs.tsx`
- `<InlineFormTabsProvider>` wraps a console.
- `useInlineForms()` hook exposes `openForm({ id, title, render })` and `closeForm(id)`.
- `<InlineFormTabsHost>` renders a Tabs UI with the console's static tabs plus any open dynamic form tabs.
- A small `<OpenFormButton form={...}>` replaces today's `<Button onClick={() => setOpen(true)}>`.

This lets each manager swap `<Dialog>{form}</Dialog>` → `openForm({ render: () => form })` with minimal code change.

## Phased rollout (one PR per phase, same shared primitive)
1. **Foundation** — build `InlineFormTabs` primitive, polish styling against Cyber-Sentry tokens, write one example (Customers).
2. **Customer / CRM consoles** — Customers, Leads, Quotes, Invoices, Appointments, Jobs.
3. **Field Ops + Dispatch** — New Job, Edit Job, Assign Tech forms in `dispatch-field-ops`, `field-ops` consoles.
4. **Business Mgt + Employees** — Add/Edit Employee, Roles, Payroll, Inventory.
5. **Marketing + Social** — New Campaign, New Post, New Template.
6. **Configuration / Integrations / Settings** — any remaining `<Dialog>` form (auth-gated settings, integrations setup wizards stay as their existing flows; only inline-form-shaped dialogs convert).
7. **Cleanup pass** — `rg "<Dialog"` audit; anything left is a confirm/picker. Document the rule in memory: *"All entity create/edit UI uses InlineFormTabs, never `<Dialog>`."*

## Out of scope
- AI/Aura command modals (chat overlays).
- Confirmations (`AlertDialog`), date pickers, command palettes, install-on-phone QR popovers.
- Onboarding wizards that intentionally take over the whole screen.
- Public/marketing pages (no console context).

## Technical notes
- Each console already uses `<Tabs>` from `components/ui/tabs.tsx`; the primitive will mount alongside, not replace it.
- Form submission keeps existing react-hook-form + Supabase mutation logic; only the wrapper changes.
- Dynamic tab labels come from the form spec (`title: "New Customer"`).
- On mobile (<640px), the dynamic tab full-screens within the console area instead of sitting next to other tabs.

## Verification
For each phase: open the console, click `+ Add`, confirm the form opens as a tab (not a modal), submit successfully, tab closes, list refreshes. Confirm `rg "<Dialog"` count trends to zero in converted files.
