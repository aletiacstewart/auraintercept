## Problem

The homepage (`src/pages/Index.tsx`) Industries section uses a hardcoded `industryCategories` array (lines 306–408) with only 18 industries across 7 categories. The canonical source `INDUSTRY_GROUPS` in `src/lib/industryMarketingContent.ts` now includes a **Healthcare** cluster (home_health, physical_therapy, occupational_therapy, hospice, veterinary, medical_practice) and may grow further. The homepage never updated because it wasn't reading from the registry.

`/for-business` and signup already pull from `INDUSTRY_LIST` / `INDUSTRY_GROUPS`, which is why those surfaces look correct while the homepage lags.

## Fix

Refactor the homepage Industries section to render from `INDUSTRY_GROUPS` + `INDUSTRY_CONTENT`:

1. **Delete** the hardcoded `industryCategories` constant in `src/pages/Index.tsx` (lines 306–408).
2. **Import** `INDUSTRY_GROUPS`, `INDUSTRY_CONTENT` from `@/lib/industryMarketingContent`.
3. **Add a small icon map** (in the same file) that maps industry `id` → existing lucide icon already imported (HVAC→Flame, plumbing→Droplet, electrical→Zap, solar→Sun, roofing→Home, fencing→Fence, landscape→TreeDeciduous, pool_spa→Waves, pest_control→Bug, appliance_repair→Refrigerator, handyman→Hammer, construction→HardHat, auto_care→Car, security_systems→Camera, real_estate→Building2, beauty_wellness→Scissors, restaurants→UtensilsCrossed, personal_assistant→Bot, home_health→Stethoscope, physical_therapy→Activity, occupational_therapy→HandHeart, hospice→Heart, veterinary→PawPrint, medical_practice→Stethoscope). Import any missing icons from `lucide-react`. Fallback icon = `Sparkles`.
4. **Update the render block** (around line 824) to iterate `INDUSTRY_GROUPS.flatMap(g => g.ids)` and resolve `INDUSTRY_CONTENT[id]` for `label` + short description (use `content.tagline` or first sentence of `content.summary`; keep current card markup/styling unchanged).
5. Optional: also surface group headers from `INDUSTRY_GROUPS` (keeps section organized as it grows). If user wants flat grid as today, skip this — just keep flat.

## Verification

- `vitest run` (must stay 69 passing)
- Visual: load `/`, scroll to Industries section, confirm Healthcare cluster (6 cards) now appears and all icons render.

## Out of scope

- Changing the section's visual design / Cyber-Sentry styling
- Touching `/for-business`, signup, or marketing copy (already correct)
- Adding new industries to the registry
