## Goal

1. Live Demo dropdown (`IndustryDropdownPicker`) and SignUp industry dropdown should show all 185 sub-industries grouped under their 25 main categories — so users can find their exact business type.
2. Selecting a sub-industry resolves to its parent main-category `demoPack`, so the dynamic demo page (`/for-business?industry=<pack>`) is still driven by the 25 main categories — sub-types don't get their own demo URL.
3. Homepage Industries grid keeps linking only the 25 main categories (already correct).

## Changes

### 1. `src/lib/mainIndustryCategories.ts`
Add a helper that returns sub-business-types per main category, sourced from `BUSINESS_TYPE_CATEGORY` in `src/lib/businessTypeRegistry.ts`:

```ts
export function getSubTypesForMainCategory(categoryName: string): string[]
```

Also add a reverse lookup `findMainCategoryByName(name)` so we can resolve a sub-type → parent demoPack.

### 2. `src/components/marketing/IndustryDropdownPicker.tsx`
Replace the flat list with a grouped `<SelectGroup>` structure:

```
[Main Category Name]  ← non-selectable label, also a selectable "All <category>" row that uses demoPack
  ↳ sub-type 1        ← value = parent's demoPack (so demo page = main category demo)
  ↳ sub-type 2
  …
```

- Group header uses `SelectLabel` with the category icon.
- Each sub-type `SelectItem` has `value={parent.demoPack}` — selecting any sub-type loads the same main-category demo page. Use a composite `key` (`demoPack + subType`) since multiple items share the same value.
- Trigger label shows the selected sub-type label when one is chosen, else the main category name. Store the chosen sub-type in component state (separate from `value`) so the trigger can show it; emit only `demoPack` to the parent.

### 3. `src/pages/SignUp.tsx`
Mirror the same grouped dropdown so signup users can pick their exact business type. Persist:
- `industry_vertical` = parent demoPack (current canonical behavior, unchanged downstream)
- New `business_type` field on the company insert payload = the selected raw sub-type string (already supported by `businessTypeProfileMap`; falls back to category default if not set).

This keeps consoles/agents working off the canonical pack while preserving the user's specific business type for analytics and profile resolution.

### 4. Homepage Industries grid (`src/pages/Index.tsx`)
No structural change — already links only the 25 main categories to `/for-business?industry=<demoPack>`. Verify each main category has a working `demoPack` that resolves in `INDUSTRY_CONTENT`; for the ~6 categories that currently share a pack (Cleaning/Moving/Specialty Trades/Delivery → `handyman`; Event → `beauty_wellness`; B2B Pro → `real_estate`), leave the shared mapping as-is since no dedicated packs exist for those yet — but ensure the demo page hero copy uses the main-category name (passed via query param or category lookup) so different categories don't look identical.

### 5. `src/pages/ForBusiness.tsx`
When loaded with `?industry=<pack>`, also accept an optional `?cat=<categoryName>` so the hero/title can show the actual main category name (e.g. "Moving & Junk Removal") even when several categories share one pack. Falls back to `INDUSTRY_CONTENT[pack].label` when absent.

Update the Index grid to append `&cat=<encoded name>` for clarity.

### Out of scope
- No new INDUSTRY_CONTENT packs are authored in this pass.
- No changes to backend RLS, edge functions, or pricing.
- Sub-types are display/selection only; they do not create new demo URLs.

## Verification
- Open `/for-business`, open the picker — see 25 grouped headers with 185 sub-items underneath.
- Pick "Septic system service" under Plumbing → URL becomes `/for-business?industry=plumbing&cat=Plumbing`, demo loads Plumbing pack, trigger reads "Septic system service".
- Homepage Industries grid: clicking "Moving & Junk Removal" loads `/for-business?industry=handyman&cat=Moving%20%26%20Junk%20Removal` and the hero shows "Moving & Junk Removal".
- Signup: same grouped dropdown; submitting persists `industry_vertical=plumbing`, `business_type='septic system service'`.
