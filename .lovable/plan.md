# Add Save to Carrier Call-Forwarding Cheat Sheet

## Goal
The Carrier Forwarding section currently has no Save button. Add one that:
1. Persists the selected carrier + Aura number on the company record.
2. Marks "Call forwarding configured" as a completed setup step (status badge + setup-progress signal).
3. Pre-fills the carrier dropdown and number the next time the user opens the section.

## Where it shows up
`CarrierForwardingGuide` is used in 4 places — Save behavior will apply in the dashboard surfaces only (Voice + SMS integrations, main Integrations page). The public onboarding intake stays as a reference-only view (no Save) since there's no authenticated company yet.

## Changes

### 1. Database (migration)
Add two nullable columns to `public.companies`:
- `call_forwarding_carrier text`
- `call_forwarding_target_number text`
- `call_forwarding_configured_at timestamptz`

No new GRANTs needed (companies table already configured). RLS already restricts updates to the company's admins.

### 2. `CarrierForwardingGuide.tsx`
- Add an optional `companyId` prop. When present, render a **Save** button below the inputs.
- On mount, load saved `call_forwarding_carrier` + `call_forwarding_target_number` and pre-fill the fields.
- On Save: update the company row, toast success, show a green "✅ Forwarding configured for {Carrier} → {number}" status chip, and dispatch `triggerSetupProgressRefresh()` so the dashboard setup bar updates.
- If `companyId` is not provided (public intake), keep existing reference-only behavior.

### 3. Setup progress
In the setup-progress edge function / hook that calculates completion steps, add `call_forwarding_configured_at IS NOT NULL` as one of the "Voice setup" sub-checks so configuring forwarding contributes to the bar.

### 4. Call sites
Pass `companyId` into `<CarrierForwardingGuide />` from:
- `src/pages/integrations/SMSIntegration.tsx`
- `src/pages/integrations/VoiceIntegration.tsx`
- `src/pages/Integrations.tsx`

Public intake (`PublicOnboardingIntake.tsx`) stays unchanged.

## Notes
- This does not actually program the carrier — Aura still can't dial `*72` from the user's phone. The Save reflects "user has acknowledged + recorded the forwarding setup" so support/dispatch can see which carrier was used and the setup-progress bar reflects completion.
