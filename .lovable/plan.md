# Simplify Industry Selection to Main Categories Only

Both the SignUp form and the Live Demo picker currently expose 185 sub-types under blue category headers. You want users to pick from **only the main categories** — and that list must match the updated homepage Industries grid (which now has 25 categories after splitting "Beauty, Restaurants & Pro Services" into Beauty & Salons, Restaurants & Food Delivery, Personal Assistants, and B2B Pro Services).

## Single source of truth
- Extract the homepage's `MARKETING_INDUSTRY_CATEGORIES` array (currently inline in `src/pages/Index.tsx`) into a shared module — `src/lib/mainIndustryCategories.ts` — exporting the 25 entries with `{ name, icon, description, demoPack }`.
- Update `src/pages/Index.tsx` to import from this module so the homepage grid keeps rendering the same cards.

## Changes

### 1. Live Demo picker (`src/components/marketing/IndustryDropdownPicker.tsx`)
- Remove the "Search 185+ business types" field and per-category sub-type rows.
- Render the 25 main categories from `mainIndustryCategories.ts` (icon + name + short description).
- Selecting a category routes to `/for-business?industry=<demoPack>` — same behavior as the homepage cards.

### 2. SignUp form (`src/pages/SignUp.tsx`)
- Replace the 185-type business-type dropdown with a 25-option dropdown of the main categories from `mainIndustryCategories.ts`.
- Persist the chosen category's `demoPack` (e.g. `hvac`, `plumbing`, `restaurants`, `beauty_wellness`, `personal_assistant`) as the company's `business_type` / `industry` so existing pack resolution, console context, and onboarding flow keep working.
- `?industry=<pack>` pre-fill still works since we persist the same pack IDs the homepage cards link to.

### 3. Homepage Industries grid
- Refactored only to import the shared list — visual output unchanged (still the 25 cards we just finished).

## Out of scope
- The internal 185-type registry stays in `businessTypeRegistry.ts` for backend marketing-matrix lookups; we just stop exposing it in the two user-facing selectors.
- No pricing, console, or PDF copy changes.
