---
name: Assign Technician Field Visibility
description: The "Assign Technician" select renders only when the active industry pack actually dispatches field staff
type: feature
---
The "Assign {teamMemberNoun} (optional)" field in `AddAppointmentForm` (and any future intake form) must be hidden for industries that do not dispatch field workers.

**Helper:** `hasFieldTechnicians(pack)` in `src/lib/industryCapabilities.ts`.

**Returns false** for booking-cluster verticals and explicitly: `restaurants`, `real_estate`, `beauty_wellness`, `salon`, `fitness`, `professional`, `personal_assistant`, and all 6 healthcare verticals (`dental`, `chiropractic`, `medical_office`, `physical_therapy`, `optometry`, `veterinary`).

**Returns true** for trades/outdoor/repair clusters (and unknown packs as a safe default).

When shown, label uses `getNavLabels(pack).teamMemberNoun` (e.g., "Assign Technician", "Assign Crew Member", "Assign Mechanic").
