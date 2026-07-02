Add business-type sub-lists to the Live Demo industry dropdown for the four currently empty main categories: Beauty & Salons, Restaurants & Food Delivery, Personal Assistants, and B2B Pro Services.

Current state
- The dropdown (`IndustryDropdownPicker`) already renders sub-types under a main category via `getSubTypesForMainCategory()`.
- Those four categories intentionally have `subTypeCategory` undefined and `count: 0`, so no sub-types appear beneath them in `/for-business` or `/signup`.
- Sub-types are read-only labels; selecting any still routes to the parent category's demo pack (the user-confirmed behavior).

Plan

1. Register the new business types
   In `src/lib/businessTypeProfileMap.ts`, add normalized keys for each business type and map them to a sensible profile:
   - Beauty & Salons → PROFILE_D (Solo / Appointment-Only)
     - hair salon, barbershop, nail salon, day spa, medical spa, lash and brow studio, waxing studio, tanning salon, massage therapy studio, skincare clinic, esthetician clinic, tattoo studio, piercing studio, makeup artistry studio
   - Restaurants & Food Delivery → mixed PROFILE_D / PROFILE_F
     - quick service restaurant, full service restaurant, cafe, coffee shop, food truck, ghost kitchen, virtual restaurant, catering company, meal prep delivery service, bakery, pizza delivery, bar, brewery with food service
   - Personal Assistants → PROFILE_D
     - virtual assistant service, concierge service, personal shopping service, household management service, family management service, errand running service, executive assistant service, senior care coordination service, companion service, travel planning assistant, personal organizing service
   - B2B Pro Services → PROFILE_D / PROFILE_E
     - accounting firm, bookkeeping firm, law firm, legal service, marketing agency, advertising agency, it managed service provider, msp, business consulting firm, management consulting firm, hr agency, staffing agency, commercial insurance agency, financial advisory firm, wealth management firm, commercial cleaning service, janitorial service, payroll administration firm, benefits administration firm

2. Categorize them in the registry
   In `src/lib/businessTypeRegistry.ts`:
   - Add each key to `BUSINESS_TYPE_CATEGORY` under new category names:
     - `Beauty & Salons`
     - `Restaurants & Food Delivery`
     - `Personal Assistants`
     - `B2B Pro Services`
   - Add those four categories to `CATEGORY_ORDER`.
   - Add emoji entries to `CATEGORY_EMOJI` (e.g., `Beauty & Salons: '✂️'`, `Restaurants & Food Delivery: '🍽️'`, `Personal Assistants: '🤝'`, `B2B Pro Services: '💼'`).
   - Add default pack entries to `CATEGORY_DEFAULT_PACK` so any unmapped type still falls back to the parent demo pack (`beauty_wellness`, `restaurants`, `personal_assistant`, `b2b_pro_services`).

3. Wire the main categories to their sub-type lists
   In `src/lib/mainIndustryCategories.ts`:
   - Add `subTypeCategory` to each of the four categories pointing to the new category names.
   - Update `count` from `0` to the number of business types per category.

4. Verify dropdown behavior
   - Open `/for-business` and confirm the four categories now show their sub-type lists in the dropdown.
   - Confirm selecting a sub-type still selects the parent category and updates the demo page correctly.
   - Check that `/signup` (which also uses `IndustryDropdownPicker`) shows the same lists consistently.

5. Validation
   - Run TypeScript check / build to catch any key/profile mismatch.
   - Run relevant tests if any assert on business-type count or category order.