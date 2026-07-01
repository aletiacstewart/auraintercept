Update the SignUp page CTA button so the selected tier label displays the canonical plan names instead of the internal tier ID.

Scope: `src/pages/SignUp.tsx` only.

Current behavior:
- When a company user selects a tier, the submit button reads: `Subscribe to Starter`, `Subscribe to Connect`, `Subscribe to Performance`, or `Subscribe to Command`.

Desired behavior:
- Use the canonical customer-facing labels: `Subscribe to Aura Core`, `Subscribe to Aura Boost`, `Subscribe to Aura Pro`, `Subscribe to Aura Elite`.
- When no tier is selected, keep the fallback text: `Start 60-Day Live Trial`.

Implementation:
1. Read the existing `SignUp.tsx` tier data array (lines ~925-928) to confirm the label mapping.
2. Replace the dynamic button text at line ~1471 so it maps `starter` → `Aura Core`, `connect` → `Aura Boost`, `performance` → `Aura Pro`, `command` → `Aura Elite`.
3. Prefer deriving the label from the same tier array already rendered above the button to avoid a second hardcoded map.

Verification:
- Build the project and run any relevant unit/type checks.
- Optionally take a preview screenshot of `/signup?mode=company&tier=command&industry=roofing` to confirm the button now reads `Subscribe to Aura Elite`.