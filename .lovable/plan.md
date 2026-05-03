# Industry-aware RolePreviewRow on /for-business

## Problem
On `/for-business?industry=...` the "TRY EVERY VIEW, ALL IN ONE DEMO" section (`src/components/marketing/RolePreviewRow.tsx`) is hardcoded with trades/HVAC copy:
- "Owner Dashboard" / "Technician App" / "Customer Portal"
- "Mobile-first PWA your techs use…", "Routes, jobs, photos, invoices"
- "book service, see ETAs… pay invoices"
- Bullets: "Live call & lead feed", "Today's jobs", "Self-service booking", etc.

It does not change when the user picks Dental, Real Estate, Restaurant, Salon, etc. We already have all the resolution primitives (`useIndustryPack`, `getNavLabels`, `getPortalCopy`, terminology) — they just aren't wired into this section.

## Plan

1. **Refactor `RolePreviewRow.tsx`** to accept an `industryId: string` prop and resolve copy from existing libs:
   - Resolve pack via `getPackByIndustryId(industryId)` (same helper `ForBusiness.tsx` content layer uses) so it works without a logged-in tenant.
   - Use `getNavLabels(pack)` for `techView` / `dispatchView` / `teamMemberNoun` / `jobNoun`.
   - Use `getPortalCopy(pack)` for `customerNoun` / `requestNoun` / portal welcome line.
   - Use `pack.terminology` for `customer`, `appointment`, etc.

2. **Build the 3 cards dynamically** from the pack (no static `ROLES` array):
   - **Card 1 — Owner Dashboard**: title stays "Owner Dashboard"; description and bullets swap nouns:
     - e.g. dental → "Live call & new-patient feed", "Production analytics", "Aura command center"
     - real estate → "Live lead & showing feed", "Commission analytics", …
   - **Card 2 — Field/Team app**: title becomes `${nav.techView}` (e.g. "Stylist App", "Agent App", "Server App", "Provider App", "Technician App"). Description and bullets use `nav.jobNoun` / `terminology.appointment` (e.g. dental → "Mobile app your providers use chairside. Schedule, charts notes, photos — all in one." with bullets "Today's appointments", "One-tap patient lookup", "Photo & note capture").
   - **Card 3 — Customer/Client/Patient/Guest Portal**: title from `portalCopy.portalHeaderLabel`. Description uses `portalCopy.welcomeSubtitle` + `requestNoun`. Bullets adapt: "Self-service booking" stays for booking cluster; for trades stays "Self-service booking"; healthcare → "Self-service appointment booking", "Live appointment reminders", "24/7 AI chat"; real estate → "Self-service tour booking", "Live showing status", "24/7 AI chat".
   - Bottom CTA copy "all 3 logins — admin, employee & customer" → "admin, ${teamMemberNoun.toLowerCase()} & ${customerNoun.toLowerCase()}".

3. **Resolution helper** `getRolePreviewCopy(industryId)` placed in a new small lib `src/lib/industryRolePreview.ts`:
   - Cluster-level defaults for `trades | outdoor | repair | booking` (covers contractors, salons, restaurants, fitness, etc.).
   - Industry overrides for the 6 healthcare verticals (dental, medical_office, chiropractic, physical_therapy, optometry, veterinary), `real_estate`, `restaurant`, `salon`, `fitness`, `legal`, `accounting`, `cleaning`, `auto_repair` to ensure premium verticals never fall through to "AC repair / technician / pay invoices" copy.
   - Returns `{ ownerCard, fieldCard, customerCard, ctaSubtext }` consumed by the component.

4. **Wire from `ForBusiness.tsx`**: pass `industry` into `<RolePreviewRow industryId={industry} onTryDemo={…} />`. Re-renders automatically when the dropdown / `?industry=` query param changes (already handled via `useState` + URL sync).

5. **Memory update**: extend the existing `mem://features/help/industry-aware-content-standard.md` (or add a sibling `mem://features/marketing/industry-aware-role-preview.md`) noting that `RolePreviewRow` must resolve via `getRolePreviewCopy` and never hardcode "Technician" / "Customer" / "pay invoices".

## Files

- `src/lib/industryRolePreview.ts` (new)
- `src/components/marketing/RolePreviewRow.tsx` (refactor)
- `src/pages/ForBusiness.tsx` (pass `industryId`)
- `mem://features/marketing/industry-aware-role-preview.md` (new memory)

## Out of scope
- Other marketing sections on `/for-business` already wired through `getIndustryContent` are untouched.
- No DB / edge-function changes.

Reply "go" to execute.