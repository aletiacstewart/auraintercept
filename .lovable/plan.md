## Remove Duplicate Pricing from Beta Sign-Up Notice

### Problem
The `BetaSignupNotice` component displays a full 4-tier pricing list (Core/Boost/Pro/Elite with monthly and onboarding fees) above the main pricing section on the homepage. This duplicates the detailed pricing already shown in the plans section below.

### Change
Remove only the pricing `<ul>` block (lines 42–75) from `src/components/billing/BetaSignupNotice.tsx`.

### What stays
- BETA badge and "BETA Sign-Up — Limited Time" heading
- 60-Day Live Trial description text
- 3rd-party usage disclaimer
- Onboarding fee coverage explanation

### No other files affected
The component is consumed by `src/pages/Index.tsx` (line 734) and the signup form. Both will automatically show the trimmed version.