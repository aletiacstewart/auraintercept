# Fix Live Demo Industry Dropdown

Two bugs, both in the industry picker on `/for-business`.

## Bug 1 — Highlighted row text is invisible

Cause: main-category rows in `IndustryDropdownPicker` use `text-primary` (cyan). When Radix highlights a row on hover/focus, the row background becomes cyan too, so the label disappears against it.

Fix in `src/components/marketing/IndustryDropdownPicker.tsx`:
- Replace the always-cyan label with a class that flips to a dark/readable color when the item is highlighted or selected:
  `text-primary data-[highlighted]:text-primary-foreground data-[state=checked]:text-primary-foreground`
- Apply the same `data-[highlighted]:text-primary-foreground` treatment to the leading `<Icon />` so it stays visible.
- Also darken the chevron/checkmark contrast the same way.

## Bug 2 — Selecting a different main category doesn't change the demo page

Cause: `MAIN_INDUSTRY_CATEGORIES` has 25 entries but only ~15 unique `demoPack` ids (e.g. Cleaning & Restoration, Moving & Junk Removal, Specialty Trades, Delivery all map to `handyman`; Plumbing + Utility & Infrastructure both map to `plumbing`; Real Estate + Insurance both to `real_estate`; Health & Wellness + Event both to `beauty_wellness`; Senior & Lifestyle to `home_health`; Personal Assistants + In-Home Personal Services both to `personal_assistant`; B2B Pro Services to `real_estate`).

Because `ForBusiness.tsx` keys off `demoPack`, picking any of those siblings produces the same page — matching what the user is seeing.

Fix by giving every main category a unique pack id:

1. **Add new packs to `src/lib/industryMarketingContent.ts`** (using the existing `make(...)` helper) for the categories that currently double up:
   - `cleaning_restoration` (Cleaning & Restoration)
   - `moving_junk` (Moving & Junk Removal)
   - `specialty_trades` (Specialty Trades)
   - `delivery_logistics` (Delivery & On-Site Logistics)
   - `utility_infrastructure` (Utility & Infrastructure)
   - `insurance_assessment` (Insurance & Assessment)
   - `senior_lifestyle` (Senior & Lifestyle)
   - `event_temporary` (Event & Temporary)
   - `in_home_personal` (In-Home Personal Services — separate from `personal_assistant`)
   - `b2b_pro_services` (B2B Pro Services)
   - `home_inspection` (Home Inspection & Safety — currently reuses `security_systems`)
   - `pet_services` (Pet & Animal Services — currently reuses `veterinary`)
   - `health_wellness_inhome` (Health & Wellness — currently reuses `beauty_wellness`)

   Each new entry gets a distinct label, emoji, hero copy, KPIs, sample leads, and colors so the Dynamic Demo page visibly changes. Content will be adapted from the closest existing pack.

2. **Update `src/lib/mainIndustryCategories.ts`** so every main category points to its own unique `demoPack` (the new ids above; leave uniquely-mapped ones untouched).

3. **Sanity-check consumers** that key off `demoPack`:
   - `ForBusiness.tsx` (`getPackIdForBusinessType`) — pure lookup; already unique-safe.
   - `SignUp.tsx` industry dropdown — writes `industry_vertical`; new ids will be persisted as-is (backend column is free-text, no schema change).
   - `useIndustryPack` / `industryPacks` — falls back to `default` for unknown ids; no crash. Add lightweight alias mapping in `useIndustryPack` so the new marketing-only packs still resolve to a sensible operational template (e.g. `cleaning_restoration → handyman`, `utility_infrastructure → plumbing`, `insurance_assessment → real_estate`, etc.) until dedicated packs exist. This keeps dashboards/consoles working without expanding scope.

4. **No changes** to sub-type behavior (still read-only) or to the trigger label logic — `findMainCategoryByPack` will now always resolve correctly since every pack id is unique.

## Verification

- Load `/for-business`, open the picker, hover each main row → label stays readable (light text on cyan bg).
- Select Plumbing → Utility & Infrastructure → Cleaning & Restoration → Moving & Junk Removal in sequence. Confirm hero headline, emoji, KPI cards, and sample-lead list all change each time.
- Confirm `?industry=` URL param updates with the new pack id and survives reload.
- Confirm SignUp dropdown still submits (industry_vertical accepts the new strings).
