# Phase 5: Breaking Up the Four Biggest Screens

Four screens have grown into single very large files. This phase splits each into a small wrapper plus focused pieces, and adds three shared building blocks so future screens stay tidy. Voice is left alone — I tested Talk to Aura and it returns a valid session, so nothing there is broken.

## What changes for you

Nothing disappears. Same screens, same buttons, same data. Light polish only where a split makes spacing or card styling naturally more consistent.

## The four screens

**1. Field Operations console** (technician job console, ~1,470 lines)
Splits into: the console wrapper, the job board with its filters, the chat/conversation panel, the job-action dialogs (ETA, reschedule, complete, quote, invoice), and the status/metrics strip. Note: this console has no map view today — it is chat-and-job-list driven — so no map component is created.

**2. AI Agent console** (~1,315 lines)
Splits into: wrapper, chat panel, quick actions and agent switching, the in-chat forms (booking, quote, tracking, billing, review, feedback), and the voice test panel.

**3. Company onboarding form** (~1,340 lines)
Splits into one file per section it already has — company profile, business operations, services and FAQs, team, integrations — with the wrapper keeping the step navigation, progress bar and submit.

**4. Appointment calendar** (~1,140 lines)
Splits into: wrapper, calendar grid, appointment details panel, and the action dialogs (cancel, decline, reschedule, assign).

## Shared building blocks

- `FormSection` — consistent title/description/content wrapper for form groups.
- `StatusCard` — title, value, trend, icon; used by the metrics strips.
- `ConfigPanel` — settings panel with a save action.

Each new piece is applied in at least one of the four screens rather than created and left unused.

## Technical notes

- Extraction only: no logic rewrites, no data-layer or query changes, no route changes. Shared state stays in the wrapper and flows down via props; state used by a single piece moves into that piece.
- Per screen: shared types go to `src/types/<domain>.ts`; multi-step state and handlers that travel together go to a hook (`useFieldOpsState.ts`, `useAppointmentActions.ts`, `useOnboardingFormState.ts`).
- New files live under `src/components/fieldops/console/`, `src/components/ai/console/`, `src/components/onboarding/steps/`, `src/components/employee/calendar/`, and `src/components/shared/`.
- Exported component names and import paths used elsewhere stay the same, so callers do not change.
- Verification per screen: typecheck, build, then load the screen signed in as a matching demo account via the super switcher and compare against current behavior (job actions, agent chat send, onboarding step navigation and submit validation, calendar day select and dialogs).
- Target is roughly 300 lines per file, treated as a guide — a coherent panel slightly over is preferred to an artificial split.
- Out of scope: the other oversized files (services manager, sign-up page, smart website manager, PDF documents) and any voice/provider change.
