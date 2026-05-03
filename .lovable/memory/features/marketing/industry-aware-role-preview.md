---
name: Industry-Aware RolePreviewRow
description: /for-business "Try every view" 3-card demo row must resolve via getRolePreviewCopy(industryId) — never hardcode Technician/Customer/pay invoices
type: feature
---
- `src/components/marketing/RolePreviewRow.tsx` accepts `industryId` and pulls all card copy from `getRolePreviewCopy()` in `src/lib/industryRolePreview.ts`.
- Resolution: industry override → cluster default (`trades | outdoor | repair | booking | healthcare | realestate | hospitality`) → trades fallback.
- `src/pages/ForBusiness.tsx` passes the live `industry` state so the section re-renders with the dropdown / `?industry=` query param.
- Healthcare verticals (dental, medical_office, chiropractic, physical_therapy, optometry, veterinary), real_estate, restaurants, beauty_wellness, personal_assistant have explicit overrides — never let them fall through to "Technician App / pay invoices / Customer Portal" trades copy.
- Bottom CTA subtext format: "admin, ${role} & ${customer}" (e.g. "broker, agent & buyer/seller").