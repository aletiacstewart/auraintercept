# Plan: Console Mobile + Industry Workflow Fixes

Five connected issues from the screenshots:

1. The console tab bar (Home / Aura Live / Quote / Invoice / Lead / Appts / Inventory…) gets cut off on the right edge with no visual cue that more tabs exist.
2. The embedded forms (Create Invoice, Create Quote, Create Lead) overflow the mobile viewport — fields and buttons clip off the right side.
3. Aura Intercept (industry `saas_platform`) is showing real‑estate workflow cards (Listing → Marketing → Open House, Commission Follow‑Up). Same bug exists for every other booking‑cluster industry that isn't real estate: salon, beauty, fitness, professional services, personal assistant.
4. The top marketing/site header on mobile collides — the logo text, "Sign In", and "90‑Day Live Trial" overlap each other. The header needs to collapse into a single dropdown (hamburger) menu on mobile that contains every nav link and CTA.
5. Per‑industry dashboards, consoles, and sidebars need to be audited end‑to‑end so each industry only sees content/labels/widgets that belong to it.

Root cause for #3 — `src/lib/industryWorkflows.ts` `CLUSTER_WORKFLOWS.booking` is hard‑coded to real‑estate copy and only `restaurants` has an `INDUSTRY_WORKFLOWS` override. Every other booking industry inherits the real‑estate cards.

## 1. Industry workflows — correct per‑vertical content

Edit `src/lib/industryWorkflows.ts`:

- Replace the real‑estate‑flavored `CLUSTER_WORKFLOWS.booking` default with a generic Lead → Appointment → Close / Reminder / Follow‑Up set (uses `{{appointment}}` terminology so it reads "Booking", "Showing", "Class", "Session", etc.).
- Move the existing real‑estate cards into `INDUSTRY_WORKFLOWS.real_estate` so they only show for real‑estate companies.
- Add explicit `INDUSTRY_WORKFLOWS` entries for `saas_platform`, `salon`, `beauty_wellness`, `fitness`, `professional`, `personal_assistant`.

Verify by loading Aura Intercept (saas_platform) and a salon demo account — neither should see "Listing → Marketing → Open House" or "Commission Follow‑Up".

## 2. Mobile console tab nav — visible "more tabs" affordance

Edit `src/components/ai/chat/MobileTabNav.tsx`:

- Wrap the scroller in a relative container, add a right‑edge gradient fade and a small chevron indicator that hides itself once scrolled to the end (track `scroll` + `scrollWidth`).
- Add `snap-x snap-mandatory` to the scroller and `snap-start` to each tab.
- Auto‑scroll the active tab into view via `scrollIntoView({ inline: 'center' })` on `activeTab` change.
- Keep existing tab content, sizing, and animations untouched.

## 3. Embedded forms — kill mobile overflow

Cause: `grid-cols-2` with no mobile fallback plus inputs that don't shrink.

- In `src/components/billing/forms/InvoiceForm.tsx`, `BusinessQuoteForm.tsx`, sibling forms under `src/components/billing/forms/`, and the lead form(s) under `src/components/leads/`: change every field‑row `grid grid-cols-2 gap-*` to `grid grid-cols-1 sm:grid-cols-2 gap-*`. Add `min-w-0 w-full` to inputs. Action button rows become `flex flex-wrap gap-2`.
- In `BusinessOpsAgentConsole.tsx`, the embedded manager wrappers (`<div className="rounded-lg p-4">` around `<QuotesManager/>`, `<InvoicesManager/>`, etc.) get `min-w-0 overflow-x-hidden`.
- Inner table rows in `QuotesManager` / `InvoicesManager` summary header keep breakpoints; children get `min-w-0`.

## 4. Top page header — single mobile dropdown menu

Convert the marketing/site header (and any console page header that exposes multiple buttons) into a single dropdown on small screens.

- Target component(s): the public site header used by `Index.tsx`, `ForBusiness.tsx`, `Contact.tsx`, `Help.tsx`, `PlatformGuides.tsx`, `Auth.tsx`, and any other public pages — locate by searching for "Sign In" + "90‑Day Live Trial".
- Below `md`: collapse logo into icon only, then render a single hamburger `Button` that opens a shadcn `DropdownMenu` (or `Sheet`) containing every nav link, "Sign In", and "Start 90‑Day Live Trial" CTA.
- ≥ `md`: keep the current horizontal layout untouched.
- Apply the same rule to console `PageHeader` `action` slots that render 2+ buttons (HowToUse + InstallOnPhone + Manage Agents, etc.) — wrap them in a shared `<HeaderActions />` helper that renders inline on `md+` and collapses into a `DropdownMenu` triangle/kebab below `md`.

## 5. Per‑industry dashboards / consoles / sidebars audit

Sweep every console under `src/pages/ai-consoles/*` and `src/components/billing/*Console.tsx` plus the dashboard sidebar groups in `src/components/dashboard/AppSidebar.tsx`:

- Confirm every list of workflow chains, quick actions, KPI cards, empty‑state copy, and side‑nav items is sourced from `useIndustryPack()` (or `getBusinessWorkflows`, `getIndustryEmptyState`, etc.) — never hard‑coded.
- Where a console renders a sub‑surface that doesn't apply to the active industry (e.g. `Inventory` for `personal_assistant`, `Dispatch Map` for `saas_platform`), gate it through `pack.console_visibility` and `usesQuotes/usesLeads/usesInventory/usesCompaniesB2B/usesAppointments`. Already partially wired in `BusinessOpsAgentConsole` — extend the same gating to: Field Ops Console, Customer Console, Marketing/Outreach Console, Analytics tabs, and the dashboard sidebar (hide groups whose only routes are turned off for the pack).
- Sidebar labels and icons that today say "Jobs / Quotes / Invoices" should use `pack.terminology.job / appointment / customer` (already done in some places — confirm parity across all groups).
- Add a single helper `getIndustryNavGroups(pack)` if needed to centralize sidebar filtering.

Verify by switching between Aura Intercept (saas_platform), Demo Restaurants, a real‑estate demo, and a trades demo — each should display a meaningfully different sidebar, console workflow set, and form labels.

## Technical notes

- `useIndustryPack()` already resolves the company's pack; #1, #4 (console action collapsing only), and the #5 sweep all lean on it.
- Aura Intercept is `industry_vertical = 'saas_platform'`, with a published `industry_template_packs` row (cluster `booking`). No DB migration needed.
- Tab nav, dropdown header, and form grid changes are presentation only; no new dependencies — `DropdownMenu` and `Sheet` already exist in `components/ui`.

## Out of scope

- No new console tabs, no console reorganization.
- No desktop layout changes.
- No edits to Stripe, pricing, or the Launch Pricing work.
