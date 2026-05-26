## Goal

Re-use the existing carrier call-forwarding reference (already built for the public onboarding intake) inside the 3rd-Party Integrations area, so company admins and platform admins can look up `*72 / *73 / *92 / *90` style codes per carrier from the dashboards (not just during onboarding).

## What's already in place

- `src/lib/carrierForwarding.ts` — dataset of major US carriers + MVNOs with immediate / no-answer / busy / unreachable / cancel codes and `fillTokens()` helper.
- `CarrierForwardingGuide` component lives inline inside `PublicOnboardingIntake.tsx` (not exported).

## Changes

### 1. Extract the guide into a shared component
- New `src/components/integrations/CarrierForwardingGuide.tsx`
  - Props: `auraNumber?: string`, `defaultCarrier?: string`, `compact?: boolean`.
  - Carrier `<Select>` + 5-row table (Immediate / No Answer / Busy / Unreachable / Cancel All) with on/off codes, copy-to-clipboard buttons, verify (`*#21#`) tip, and per-carrier notes.
  - Pure presentation, semantic Tailwind tokens only — no business logic, no DB calls.
- Update `PublicOnboardingIntake.tsx` to import the shared component and delete the local copy (behavior unchanged).

### 2. Voice integration page (company dashboard)
- `src/pages/integrations/VoiceIntegration.tsx` — add a new `Card` below the existing SignalWire/ElevenLabs setup:
  - Title: "Carrier Call-Forwarding Cheat Sheet"
  - Subtitle explaining: use these codes on the business line you want to forward to your Aura number (immediate, after-hours/no-answer, busy, unreachable).
  - Renders `<CarrierForwardingGuide auraNumber={signalwire_phone_number} />` so the codes pre-fill with the connected Aura number.

### 3. SMS integration page (same surface)
- `src/pages/integrations/SMSIntegration.tsx` — add the same card (smaller note clarifying SMS doesn't forward, codes are for the paired voice line).

### 4. Admin dashboard
- Add the guide to the admin-side third-party integrations view. Two options, default to **A** unless code reveals otherwise during build:
  - **A.** `src/pages/Integrations.tsx` (admin index of 3rd-party integrations) — append a collapsible "Carrier Forwarding Reference" `Accordion` at the bottom using the same shared component (no `auraNumber` prefilled; admin picks a carrier to read codes).
  - **B.** If `Integrations.tsx` is company-scoped only, also mount the same card on the platform admin integrations console.

### 5. Onboarding intake link-out
- Leave the existing in-flow guide as-is; no copy changes.

## Out of scope
- No new edge functions, migrations, RLS, or schema changes.
- No new carriers (use existing dataset). International carriers remain out of scope.
- No changes to `CompanyOnboardingPDF.tsx` (already updated previously).

## Technical notes
- Component path: `src/components/integrations/CarrierForwardingGuide.tsx`.
- Reuse `CARRIERS`, `FORWARDING_RULES`, `fillTokens` from `@/lib/carrierForwarding`.
- Copy buttons use `navigator.clipboard.writeText` + `toast.success`.
- All colors via design tokens (`bg-card`, `text-muted-foreground`, `border-border`, etc.) — no hex.
