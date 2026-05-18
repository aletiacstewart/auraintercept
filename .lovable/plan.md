## Goal
Restaurants vertical must not expose an in-app reservation system. Today the company-admin sidebar still shows a "Reservations" entry (the relabeled `/dashboard/appointments` page) with an "Add Appointment" form. Per the existing memory rule (`restaurants-smart-link-only`), restaurants only get voice + chat + Smart Links to their external booking page / menu / hours / catering form.

## Changes (frontend only, presentation/routing)

1. **Hide the Schedule/Reservations nav entry for restaurants**
   - File: `src/components/dashboard/DashboardLayout.tsx`
   - In the `.filter(item => …)` block inside `filteredNavGroups`, add: if `industryPack?.slug === 'restaurants'` (and not `platform_admin`), drop the item whose `href === '/dashboard/appointments'` for `company_admin`. Keep employee `My Schedule` hidden too for restaurant employees (servers don't manage reservations in-app either).

2. **Guard the page itself**
   - File: `src/pages/EmployeeAppointments.tsx` (the route behind `/dashboard/appointments`)
   - Read industry from `useIndustryPack()`. If slug is `restaurants` and user is not `platform_admin`, render a Smart-Link-only empty state (icon + headline "Reservations are handled via Smart Links" + body "Aura texts guests a link to your booking page, menu, hours, or catering form. Configure these links in Customer Portal → Smart Links.") with a button that routes to `/dashboard/ai-consoles/customer-portal`. No Add Appointment button, no form.

3. **Dashboard quick-stats / quick-actions sanity check**
   - File: `src/components/dashboard/CompanyAdminDashboard.tsx` — confirm no "Add Reservation" / "Today's Reservations" CTA is rendered for restaurants. If present, hide it the same way (industry slug check). No data fetch changes.

4. **Memory update**
   - Append to `.lovable/memory/features/industry/restaurants-smart-link-only.md`: add `src/components/dashboard/DashboardLayout.tsx` and `src/pages/EmployeeAppointments.tsx` to the "Affected files" list with the rule "restaurants hide `/dashboard/appointments` and show Smart-Link-only state".

## Out of scope (intentionally)
- No database / RLS / edge-function changes.
- Leads page ("Reservation Inquiries") stays — restaurants still capture private-event / catering inquiry leads, which is consistent with the existing memory rule.
- Voice greetings, SMS templates, Aura suggestions, specialists list are already correctly scoped per memory; not touching them.
- Other industries unaffected — gating is keyed strictly on `industryPack.slug === 'restaurants'`.

## Verification
- Switch into a restaurant demo company (e.g. `restaurantsadmin@demo.com`) → sidebar shows no "Reservations" entry; visiting `/dashboard/appointments` directly shows the Smart-Link empty state.
- Switch into a non-restaurant industry → "Schedule"/"Appointments"/"Bookings" entry and Add Appointment form still work unchanged.
- Platform admin in any company still sees the full page (so QA isn't blocked).