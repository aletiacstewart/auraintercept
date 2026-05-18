## What the "Custom Workspace" card means

It's the **fallback** the Operations console shows when the system can't determine what kind of business you are. It only appears for the Salon demo because **there is no `salon` row in the `industry_blueprints` table**.

### Root cause

The Operations link (`/dashboard/dispatch-field-ops`) routes through `OperationsRouter`, which picks a console based on `workspace.operatingModel`:

- `field_dispatch` → live truck map (HVAC, plumbing, etc.)
- `appointment_booking` → bookings/chairs/no-shows console (what Salon should see)
- `pipeline_sales` → real estate / solar pipeline
- `receptionist_only` → restaurant front-of-house
- `custom` → the gray placeholder you saw

`resolveCompanyWorkspace` looks the model up from `industry_blueprints` by slug. The DB has 25 blueprint rows but is missing **7 verticals that exist as industry packs**:

| Missing slug | Should be |
|---|---|
| salon | appointment_booking |
| fitness | appointment_booking |
| professional | appointment_booking |
| home_health | field_dispatch |
| occupational_therapy | appointment_booking |
| hospice | field_dispatch |
| saas_platform | pipeline_sales |

For any of these, the resolver falls through to `'custom'`, so the Operations page shows the placeholder instead of the proper console.

## Fix

One data-insert into `industry_blueprints` adding those 7 rows with:

- the correct `operating_model` (above)
- sensible `default_consoles` (booking-cluster gets customer_portal + business_mgmt + marketing_sales; field_dispatch ones add field_operations; saas gets analytics)
- cluster-appropriate `primary_records` and `default_kpis` (e.g. `appointments_today`, `revenue_mtd`, `pipeline_value`)
- empty `agent_actions`, `prompt_overrides`, `restrictions` (the industry pack already supplies these)

## Verification

1. Salon demo → `/dashboard/dispatch-field-ops` renders the **appointment console** (Today / This Week / No-shows KPIs).
2. Home Health & Hospice demos → render the field-dispatch map.
3. SaaS demo → renders the pipeline console.
4. HVAC, dental, real-estate, restaurants → unchanged (their rows already exist).

## Out of scope

- No code changes — pure data insert.
- Sidebar label ("SALON FLOOR → Operations") stays as-is.
- The "Custom Workspace" fallback stays for the genuinely-custom `other` slug.
