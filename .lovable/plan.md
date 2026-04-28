## Goal

Make `/for-business` always start on the generic **Aura Intercept** default content. Only switch to industry-specific content when the user explicitly picks an industry from the "I am a:" dropdown (or arrives with `?industry=` in the URL).

## Problem

Today `src/pages/ForBusiness.tsx` resolves the initial industry like this:

```ts
const initial = searchParams.get('industry') || localStorage.getItem(STORAGE_KEY) || 'default';
```

…and an effect writes the current industry back into both `localStorage` and the URL on every render. So once a visitor picks (or even passively lands on) any industry, every subsequent visit auto-restores it and the page never shows the generic Aura Intercept default — exactly what the screenshot shows (`?industry=auto_care` rendering Auto Care content on first load).

## Fix

Edit `src/pages/ForBusiness.tsx`:

1. **Initial state — URL only, no localStorage read.**
   ```ts
   const initial = searchParams.get('industry') || 'default';
   ```
   Visiting `/for-business` with no query param always shows the Aura Intercept default.

2. **URL/localStorage sync — only when user actively picks a real industry.**
   Replace the existing effect so it:
   - Does **not** write `default` to the URL or localStorage.
   - Only updates the URL `?industry=` when `industry !== 'default'`.
   - Only writes to localStorage when `industry !== 'default'` (optional convenience for analytics/return visits — but never used to override the default on load).
   - When `industry === 'default'`, strips any stale `industry` param from the URL.

3. **Dropdown change handler stays the same** — selecting an option from `IndustryDropdownPicker` calls `setIndustry(...)` which triggers the effect to push the new value into the URL.

4. **No content changes.** The `default` entry in `src/lib/industryMarketingContent.ts` already provides the correct generic Aura Intercept hero, value props, sample calls, etc., so nothing to add there.

## Result

- Fresh visit to `/for-business` → generic **Aura Intercept** hero ("Smart agents. Automated service.") and value props, with the dropdown showing the placeholder.
- User picks "Auto Care" → URL becomes `/for-business?industry=auto_care`, page swaps to Auto Care content.
- User clears the dropdown / navigates back to `/for-business` → default Aura Intercept content again, no sticky industry from a prior session.
- Direct links like `/for-business?industry=hvac` still deep-link straight into that vertical (so marketing/email links keep working).

## Files touched

- `src/pages/ForBusiness.tsx` (initial state + sync effect only)
