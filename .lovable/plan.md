## Goal
Tighten every grid section on `/for-business` so the page is denser and less scrolling is required — without losing readability.

## Changes

**1. `IndustryValueProps.tsx` — "What Aura does for…" benefits + sample calls**
- Section padding: `py-16` → `py-10`
- Header margin: `mb-12` → `mb-6`; heading from `text-3xl md:text-4xl` → `text-2xl md:text-3xl`
- Cards grid: `gap-6 mb-16` → `gap-3 mb-8`
- Card inner padding: `p-6` → `p-4`; icon size `w-10 h-10` → `w-8 h-8`; title `mb-2` tightened
- Sample calls block: padding `p-6 md:p-8` → `p-4 md:p-5`; row spacing `space-y-3` → `space-y-2`; row `p-3` → `p-2.5`

**2. `RolePreviewRow.tsx` — Owner / Tech / Customer cards**
- Section: `py-16` → `py-10`
- Header `mb-12` → `mb-6`; heading downsized one step
- Inner card padding: `p-6 md:p-8` → `p-4 md:p-6`
- Inner grid gap: `gap-6 md:gap-8 mb-6` → `gap-4 mb-4`
- Role icon: `w-12 h-12 mb-4` → `w-10 h-10 mb-3`; title `text-lg mb-2` → `text-base mb-1`; description `mb-4` → `mb-3`
- Footer divider section: `pt-6` → `pt-4`

**3. `IntegrationStatusPanel.tsx` — Live vs Mock grid**
- Section: `py-16` → `py-10`
- Header `mb-10` → `mb-6`; heading downsized one step
- Grid: `gap-3` kept, but card `p-4` → `p-3`; icon box `w-9 h-9` → `w-8 h-8`
- Footer disclaimer `mt-6` → `mt-4`

**4. `ForBusiness.tsx` — Pricing snapshot + Final CTA**
- Pricing section: `py-16` → `py-10`; header `mb-10` → `mb-6`; heading downsized
- Final CTA section: `py-16` → `py-10`; heading downsized; `mb-6` → `mb-4`

## Out of scope
- IndustryHero (separate component, not a grid)
- No copy/content changes
- No color or design-token changes (still uses theme tokens only)

## Files touched
- `src/components/marketing/IndustryValueProps.tsx`
- `src/components/marketing/RolePreviewRow.tsx`
- `src/components/marketing/IntegrationStatusPanel.tsx`
- `src/pages/ForBusiness.tsx`
