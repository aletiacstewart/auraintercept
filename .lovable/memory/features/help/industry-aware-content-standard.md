---
name: Industry-Aware Help & Install Content
description: Help page (Help.tsx) + all 5 PWA install pages must resolve console title/description/features/tabs and team/customer nouns from useIndustryPack + getNavLabels; helpContentConfig.ts is the trades-default fallback only
type: feature
---
- `src/pages/Help.tsx` reads `useIndustryPack()` and `getNavLabels(pack)`, then layers `getIndustryConsoleConfig()` (description + tabs + features) and `getIndustryUseCases()` (example prompts) over the generic config in `helpContentConfig.ts`.
- The 6 healthcare verticals (`dental`, `chiropractic`, `medical_office`, `physical_therapy`, `optometry`, `veterinary`) get explicit overrides for every console — never let healthcare fall through to "AC repair" / "HVAC" copy.
- All 5 install pages (`FieldOpsInstall`, `DispatchFieldOpsInstall`, `BusinessMgtOpsInstall`, `CustomerPortalAppInstall`, `technician/TechnicianInstall`) MUST localize header titles, descriptions, and body labels via `useIndustryPack` + `nav.techView` / `nav.dispatchView` / `nav.teamMemberNoun` / `pack.terminology.customer`. No hardcoded "Technician" / "Dispatch" / "Customer" strings in headers.
- Generic copy in `helpContentConfig.ts` must stay industry-neutral (no "AC repair", "HVAC", "water heater", "air filters"). Industry-specific examples live in `industryHelpPrompts.ts` + `industryHelpContent.ts`.
