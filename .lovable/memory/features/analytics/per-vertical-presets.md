---
name: Per-Vertical Analytics Presets
description: Industry-specific intake analytics shortcuts (HVAC system age, Real Estate pre-approval funnel, etc.) defined in industryAnalyticsPresets.ts and rendered as chips at the top of the Intake tab.
type: feature
---

`src/lib/industryAnalyticsPresets.ts` defines per-`industry_id` preset arrays.
Each preset = `{ id, label, source, field?, view, description? }` mapping
directly to `IntakeAnalytics.tsx` URL params (`?source=&field=&view=`).

Rules:
- Presets are STATIC (curated), not DB-driven, so non-engineer pack edits in
  the admin UI cannot break the starter dashboard.
- `getAnalyticsPresetsForPack(pack, fields)` filters out any preset whose
  `field` isn't present in the active pack's `form_schemas` — never offer a
  broken shortcut.
- `UNIVERSAL_TAIL` (appointment + lead completeness) is appended to every
  vertical so admins always have a one-click "what's getting skipped" view.
- On initial mount, if no `?field=` is in the URL, `pickInitialPreset(...)`
  auto-applies the first non-completeness preset's source/field/view.

When adding a new industry pack, also add a matching entry to
`PRESETS_BY_INDUSTRY` using the field names declared in the pack's
`form_schemas`.