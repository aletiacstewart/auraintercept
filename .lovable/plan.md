## Goal
Remove the forced Elite lock during the 60-Day Live Demo signup. Every company picks their own plan (Core, Boost, Pro, or Elite) at signup — the trial simply runs on whatever tier they choose, with all features unlocked for 60 days.

## Changes (all in `src/pages/SignUp.tsx`)

1. **Stop forcing Elite in the Live Demo flow**
   - In the tier-preselect `useEffect` (lines 127–139), drop the `if (isLiveDemoFlow) setSelectedTier('command')` branch. Honor `tierParam` for both regular and Live Demo flows; keep the existing default (Core) when no tier is provided.

2. **Make every plan card selectable in the picker**
   - Remove the read-only/locked behavior on the tier picker for `isLiveDemoFlow`.
   - Move the amber "YOUR TRIAL" badge to render on the currently selected tier (not hard-coded to Elite), or drop it in favor of the existing "Selected: …" summary row.
   - Remove the "Switch after day 60" chips on the non-Elite rows (no longer meaningful now that any tier is a valid starting plan).

3. **Update Live Demo banner copy**
   - Line 918–921 banner: change to something like "🚀 Your 60-Day Live Demo runs on the plan you pick — every agent, console, and integration is unlocked for the full 60 days. Switch tiers or cancel anytime before day 60."
   - Line 865 helper text (in the Live Demo intro block): mirror the same message — no more "runs on Aura Elite by default … or your card is charged at the Elite rate."

4. **Trial persistence stays as-is**
   - `tierToPersist` already honors `selectedTier`, so once #1 is fixed the DB write, Stripe metadata, and dashboard tier-gating all follow the user's pick automatically. No schema or edge-function changes needed.
   - Onboarding-fee copy already lists all four tiers, so it stays.

## Out of scope
- No changes to pricing, Stripe products, onboarding-fee logic, or the 60-day trial length.
- No changes to `/for-business` or the industry picker.
