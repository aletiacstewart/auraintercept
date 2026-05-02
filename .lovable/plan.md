
# Industry-Specific Widgets, Consoles & Agents — Audit + Recommendations

## What's already industry-aware (working today)

| Surface | Mechanism | Status |
|---|---|---|
| Dashboard widget grid (`IndustryWidgetGrid`) | `pack.dashboard_widgets[]` → `WIDGET_REGISTRY` | Live, all 18 packs have 5 widgets each |
| KPI tile labels | `industryKpiLabels.ts` | Live, per-cluster + per-industry overrides |
| Quick actions on Aura command center | `industryQuickActions.ts` | Live (cluster + 2 overrides) |
| Business Mgmt workflow chains | `industryWorkflows.ts` | Live, per-cluster |
| Field Ops workflow chains | `industryFieldOpsWorkflows.ts` | Live, all 18 overrides |
| Intake form schemas + booking fields | `pack.form_schemas` | Live |
| Voice/SMS/chat agent prompts | `agent_prompt_deltas` + terminology block | Live |
| Specialist operatives shown | `pack.extra_operatives[]` | Live (4 specialists across packs) |
| Analytics presets | `industryAnalyticsPresets.ts` | Live |

## The actual gaps (features that don't fit every industry)

After auditing the 18 packs and the 14 consoles, these mismatches exist:

### Gap 1 — Universal consoles show irrelevant tabs/widgets
- **Field Ops Console**: shows "Dispatch Map" and "Truck Stock" for **Real Estate, Salon, Personal Assistant, Restaurants** — none of these dispatch trucks. They need a Booking-First console variant (no map, no truck stock; instead: today's bookings, no-show recovery, walk-in queue).
- **Customer Portal Console**: same template for everyone. Real Estate clients want "My showings + offer status"; Salons want "My next appointment + loyalty"; Restaurants want "My reservation + party size"; Trades want "My job + technician ETA + invoice".
- **Marketing/Sales Console**: "Quote Pipeline" doesn't exist for Salon/Restaurant; should become "Booking Funnel" (visit → repeat → review).
- **Business Management Console**: shows "Invoice / Receivables" prominently for Salons & Restaurants where transactions settle at the chair/table — they need "Daily Cash Reconciliation" instead.

### Gap 2 — Widget registry has 5 widgets per pack but only 3 surfaces show them
Widgets currently render only on the main admin dashboard. They should also appear (filtered/contextually) inside:
- Field Ops Console (route map, dispatch map, emergency queue, weather alerts, bay scheduler — these belong here, not on the main dashboard)
- Marketing Console (lead scoring, quote pipeline, smart link clicks, review pulse)
- Customer Portal Console (client portal, calendar sync)

### Gap 3 — Specialist operatives are under-mapped
Only 4 specialists exist (`diagnostic`, `permit_code`, `site_survey`, `insurance_claim`). These are missing:
- **Real Estate** → `listing_writer`, `offer_drafter`, `comp_analyst` (none assigned)
- **Salon / Beauty** → `style_consultant`, `loyalty_coach` (none assigned)
- **Restaurants** → `menu_writer`, `reservation_optimizer`, `review_responder` (none assigned)
- **Personal Assistant** → `task_triager`, `calendar_optimizer` (none assigned)
- **Pest / Pool / Landscape** → `chemistry_advisor`, `route_optimizer` (none assigned)
- **Auto Care** → `vin_decoder`, `recall_lookup` (none assigned beyond diagnostic)
- **Construction** → `bid_assembler`, `subcontractor_coordinator` (none assigned)

### Gap 4 — Console headers, empty states, terminology
"Today's Jobs" header is hardcoded in several consoles even though terminology says "Showings" or "Reservations" or "Sessions".

## Recommended cluster groupings (which industries share UI)

```text
CLUSTER A — Field Service (trades + repair-with-trucks)
  hvac, plumbing, electrical, appliance_repair, handyman, security_systems, auto_care, construction
  Shared UI: Dispatch Map, Truck/Bay Inventory, Emergency Queue, Tech Utilization,
             Permit Tracker, Job Photos, Diagnostic specialist
  Console set: Field Ops + Business Mgmt + Marketing + Specialists

CLUSTER B — Outdoor Recurring Routes (subset of A but route-centric)
  landscape, pest_control, pool_spa
  Shared UI: Recurring Route Map, Seasonal Calendar, Weather Alerts, Chemistry/Treatment Log,
             Equipment Tracker, Crew Scheduler
  Console set: Field Ops (route-mode) + Business Mgmt + Marketing
  Drop: Emergency Queue, Permit Tracker (mostly N/A)

CLUSTER C — Project / Estimate-Heavy (outdoor install + large repair)
  roofing, solar, fencing, construction
  Shared UI: Site Survey Queue, Material Calculator, Quote Pipeline, Permit Tracker,
             Insurance Claim Tracker (roofing/solar), Multi-Phase Tracker (construction)
  Console set: Field Ops + Business Mgmt + Marketing + Specialists (site_survey, permit_code, insurance_claim)
  Drop: 24/7 Emergency Queue, Truck Stock prominence

CLUSTER D — Booking-First (in-person, no field dispatch)
  beauty_wellness, restaurants, real_estate, personal_assistant
  Shared UI: Today's Bookings, No-Show Recovery, Review Pulse, Smart Link Clicks,
             Receptionist Queue, Hours Status, Upsell/Repeat Tracker
  Console set: NEW Booking Operations Console (replaces Field Ops) +
               Business Mgmt (cash reconciliation flavor) + Marketing + Customer Portal
  Drop entirely: Dispatch Map, Truck Stock, Permit Tracker, Material Calculator,
                 Emergency Queue, Insurance Claim, Site Survey
```

## Concrete implementation plan

### Phase 1 — Console-level industry filtering (highest impact, lowest effort)

1. **Add `console_visibility` to `IndustryPack`** (DB column + Zod schema):
   ```ts
   console_visibility: {
     field_ops: 'full' | 'route_mode' | 'booking_mode' | 'hidden',
     dispatch_map: boolean,
     truck_inventory: boolean,
     emergency_queue: boolean,
     permit_tracker: boolean,
     site_survey: boolean,
     bay_scheduler: boolean,
     route_map: boolean,
     receptionist: boolean,
     reservation_table: boolean,  // restaurants
     showings_calendar: boolean,  // real estate
     chair_grid: boolean,         // beauty
   }
   ```
   Seed sensible defaults per cluster (script in migration).

2. **Refactor `FieldOpsConsole.tsx`** to render one of three layouts based on `console_visibility.field_ops`:
   - `full` (Cluster A): current dispatch + map + emergency
   - `route_mode` (Cluster B): recurring route map + seasonal calendar + weather
   - `booking_mode` (Cluster D): today's bookings grid + no-show queue + walk-in (no map)

3. **Rename Field Ops Console** dynamically per cluster:
   - Cluster A → "Field Operations"
   - Cluster B → "Route Operations"
   - Cluster C → "Project Operations"
   - Cluster D → "Booking Operations"

### Phase 2 — Customer Portal Console variants

4. **Create `customerPortalLayouts.ts`** mapping cluster → layout config:
   - Trades/Repair: Job status + Tech ETA + Invoice + Quote approval
   - Outdoor: Next visit + Service history + Treatment log
   - Booking-First: My next appointment + Loyalty + Rebook + Review prompt
   - Real Estate (override): My showings + Offers in flight + Doc room

5. Update `CustomerPortalConsole.tsx` to switch sections based on layout.

### Phase 3 — Expand the specialist operative roster (12 new roles)

6. **Add to `IndustrySpecialistOperative` enum**:
   ```ts
   'diagnostic' | 'permit_code' | 'site_survey' | 'insurance_claim'  // existing
   | 'listing_writer' | 'offer_drafter' | 'comp_analyst'             // real_estate
   | 'style_consultant' | 'loyalty_coach'                            // beauty
   | 'menu_writer' | 'reservation_optimizer' | 'review_responder'    // restaurants
   | 'task_triager' | 'calendar_optimizer'                           // personal_assistant
   | 'route_optimizer' | 'chemistry_advisor'                         // outdoor recurring
   | 'vin_decoder' | 'recall_lookup'                                 // auto_care
   | 'bid_assembler' | 'subcontractor_coordinator'                   // construction
   ```

7. **Backfill `extra_operatives`** in DB for the 4 booking-first packs + missing assignments (migration).

8. **Add prompt deltas** for each new specialist in `subscriptionAgentConfig.ts` + edge function `_shared/industry-pack.ts`.

### Phase 4 — Widget surfacing in non-dashboard consoles

9. Add an optional `surface` filter to `IndustryWidgetGrid`:
   ```tsx
   <IndustryWidgetGrid surface="field_ops" />   // shows only route/dispatch/emergency widgets
   <IndustryWidgetGrid surface="marketing" />   // shows lead_scoring, smart_link_clicks, review_pulse
   <IndustryWidgetGrid surface="portal" />      // shows client_portal, calendar_sync
   ```
10. Tag each widget in `WIDGET_REGISTRY` with a `surfaces: string[]` array.
11. Embed the grid inside Field Ops, Marketing, and Customer Portal consoles.

### Phase 5 — Terminology cleanup in console chrome

12. Replace hardcoded "Jobs / Appointments / Customers" strings in console headers with `pack.terminology` lookups (touches ~12 files).

## Technical details (for engineering)

- **DB migration**: add `console_visibility jsonb DEFAULT '{}'::jsonb` to `industry_template_packs`; backfill per cluster.
- **Pack schema**: extend `packEditableSchema` in `src/lib/industryPackSchema.ts`.
- **Hook**: `useIndustryPack` already returns the full row — no signature change needed.
- **Edge functions**: only the specialist prompt deltas need to be added in `_shared/industry-pack.ts`. No verify_jwt changes.
- **Authoring UI**: extend `IndustryPacksAdmin.tsx` editor with a Console Visibility tab + Specialist picker.
- **No frontend tier-gating changes** — `tierAllowsSpecialists()` continues to gate all specialists at Pro/Elite.

## Suggested rollout order

```text
Week 1:  Phase 1 (console visibility + Field Ops 3 modes)         ← biggest UX win
Week 2:  Phase 2 (Customer Portal variants)
Week 3:  Phase 3 (12 new specialist operatives + prompts)
Week 4:  Phase 4 (widget surface filtering)
Week 5:  Phase 5 (terminology cleanup) + authoring UI updates
```

## What I recommend doing first

If you want one focused next step instead of all five phases, do **Phase 1 + the booking-first specialist roster (subset of Phase 3)**. That alone removes the biggest "feature doesn't fit my industry" complaints because:
- Salons / Real Estate / Restaurants stop seeing dispatch maps and truck inventory
- They get specialists that actually match their workflow (review_responder, listing_writer, etc.)
- Trades industries are unchanged

Approve and I'll execute the rollout in the order above, or tell me to start with just Phase 1 + booking specialists.
