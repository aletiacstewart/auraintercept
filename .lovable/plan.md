## Goal
Replace free-text "Industry/Business Type" and "Job Title" inputs on the onboarding page (and matching PDF fields) with structured dropdowns that work for every supported industry.

## Scope
- `src/components/onboarding/CompanyOnboardingForm.tsx` — the live web form on `/onboarding`.
- `src/components/documentation/CompanyOnboardingPDF.tsx` — the printable intake PDF.
- New shared data file: `src/lib/industryJobTitles.ts`.

## 1. Industry dropdown
Replace the `<Input placeholder="HVAC, Plumbing, Salon, etc.">` with the existing canonical industry list rendered as a grouped `<Select>` (same pattern as `src/components/marketing/IndustryDropdownPicker.tsx`):

- Source: `INDUSTRY_GROUPS` + `INDUSTRY_CONTENT` from `src/lib/industryMarketingContent.ts` (already filtered to 24 canonical IDs, grouped into Core Trades / Outdoor & Property / Repair & Service / Booking-First / Healthcare).
- Store the canonical industry ID in `formData.industryType` (still required).
- Include the "Other" option for catch-all.
- Show emoji + label per option, group headers per cluster.

## 2. Job Title dropdown (industry-aware, categorized)
Replace the `<Input placeholder="Owner, Manager, etc.">` with a grouped `<Select>` whose contents adapt to the selected industry.

New file `src/lib/industryJobTitles.ts` exports:

```ts
export const UNIVERSAL_TITLES = [
  'Owner', 'Co-Owner', 'CEO', 'President',
  'General Manager', 'Operations Manager', 'Office Manager',
  'Admin / Receptionist', 'Sales Manager', 'Sales Rep',
  'Marketing Manager', 'Customer Service Lead', 'Bookkeeper / Accountant',
];

export const INDUSTRY_TITLES: Record<string, string[]> = {
  hvac: ['Service Manager', 'Lead Technician', 'HVAC Technician', 'Install Crew Lead', 'Dispatcher'],
  plumbing: ['Master Plumber', 'Journeyman Plumber', 'Apprentice', 'Service Manager', 'Dispatcher'],
  electrical: ['Master Electrician', 'Journeyman Electrician', 'Apprentice', 'Estimator', 'Dispatcher'],
  roofing: ['Project Manager', 'Estimator', 'Crew Lead', 'Roofer', 'Insurance Claims Specialist'],
  solar: ['Solar Consultant', 'Designer', 'Installer Lead', 'Site Surveyor', 'Permitting Coordinator'],
  landscape: ['Crew Lead', 'Landscaper', 'Arborist', 'Irrigation Tech', 'Designer'],
  pool_spa: ['Service Tech', 'Route Manager', 'Equipment Specialist'],
  pest_control: ['Lead Technician', 'Termite Specialist', 'Route Manager'],
  appliance_repair: ['Lead Technician', 'Appliance Tech', 'Parts Manager'],
  handyman: ['Lead Handyman', 'Handyman', 'Cleaner', 'Crew Lead'],
  construction: ['Project Manager', 'Estimator', 'Foreman', 'Carpenter', 'Painter'],
  auto_care: ['Service Advisor', 'Master Tech', 'Mechanic', 'Service Manager'],
  security_systems: ['Install Tech', 'Monitoring Specialist', 'Sales Consultant'],
  real_estate: ['Broker', 'Realtor / Agent', 'Listing Coordinator', 'Transaction Coordinator'],
  beauty_wellness: ['Salon Owner', 'Stylist', 'Colorist', 'Nail Technician', 'Esthetician', 'Massage Therapist'],
  restaurants: ['Owner', 'General Manager', 'Chef / Kitchen Manager', 'Front of House Manager', 'Host'],
  personal_assistant: ['Executive Assistant', 'Personal Assistant', 'Concierge'],
  fencing: ['Project Manager', 'Estimator', 'Install Crew Lead', 'Installer'],
  home_health: ['Director of Nursing', 'RN Case Manager', 'LPN', 'Home Health Aide', 'Scheduler'],
  physical_therapy: ['Clinic Director', 'Physical Therapist (PT)', 'PT Assistant (PTA)', 'Front Desk'],
  occupational_therapy: ['Clinic Director', 'Occupational Therapist (OT)', 'OT Assistant (COTA)', 'Front Desk'],
  hospice: ['Hospice Director', 'RN Case Manager', 'Chaplain', 'Social Worker', 'Aide'],
  veterinary: ['Veterinarian (DVM)', 'Vet Tech', 'Practice Manager', 'Front Desk'],
  medical_practice: ['Physician (MD/DO)', 'Nurse Practitioner', 'Medical Assistant', 'Practice Manager', 'Front Desk'],
};

export function getTitlesForIndustry(id?: string) {
  return {
    universal: UNIVERSAL_TITLES,
    industry: (id && INDUSTRY_TITLES[id]) || [],
  };
}
```

Dropdown UI:
- Group 1 header: "Leadership & Operations" → `UNIVERSAL_TITLES`.
- Group 2 header: `${INDUSTRY_CONTENT[id].label} Roles` (only shown when an industry is selected and has entries).
- Group 3: single "Other (type below)" item that reveals a small inline text input to capture a custom title (stored in same `contactTitle` field).
- If no industry selected yet, only show the Leadership group + Other.

## 3. PDF updates (`CompanyOnboardingPDF.tsx`)
The PDF currently renders both fields as blank lines/labels for users to fill in by hand. To keep it usable as a printable intake while reflecting the new dropdowns:

- Under "Industry/Business Type:" replace the blank line with a checkbox-style list grouped by cluster (Core Trades / Outdoor & Property / Repair & Service / Booking-First / Healthcare / Other) using the same source data, rendered with the existing `formCheckbox` style (see how other multi-option intake pages already render).
- Under "Job Title:" render the `UNIVERSAL_TITLES` list as checkboxes plus a "Industry-specific role: ______" write-in line (we can't show all 24 industry role lists without bloating the PDF).
- Pull industry options from `INDUSTRY_GROUPS` so the PDF and form stay in sync automatically.

## 4. Out of scope
- No changes to backend storage, RLS, or how `companies.industry_vertical` is normalized (existing `toCanonicalIndustryId` already covers it — we'll already be writing canonical IDs from the dropdown).
- No changes to Auth signup, Fast Start wizard, or any other intake surface.
- No copy/pricing edits.

## Verification
- Manually open `/onboarding`: industry dropdown shows grouped list, selecting an industry repopulates the job-title dropdown's second group, "Other" reveals a custom-text field.
- Export the PDF from `/onboarding` and confirm both fields render the new structured option lists without overflowing the page.
- `rg "placeholder=\"HVAC, Plumbing, Salon" src/` and `rg "placeholder=\"Owner, Manager" src/` return no results.
