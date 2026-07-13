## Goal
On `/for-business`, reduce first-visit decision load by showing a single "Start on Aura Elite" CTA where the 4-tier pricing grid is today. Engaged visitors can expand the full comparison. Leave `Index.tsx` unchanged.

## Changes

### 1. `src/pages/ForBusiness.tsx` — rework the "Simple, transparent pricing" section
- Replace the current always-visible `PRICING_TIERS.map(...)` grid with:
  - **Primary CTA card** (wider, gradient/border-primary, not styled like a tier card):
    - Heading: "Start your 60-day Live Demo on Aura Elite"
    - Subtext: "No setup fee during beta. Cancel anytime."
    - Fine print: "You'll get every feature during the demo. Downgrade to any tier before day 60."
    - Button: "Start 60-day Live Demo" → existing `startLiveDemo()`
  - **Toggle button** below (ghost, chevron flips on open):
    - Closed label: "Compare all 4 plans"
    - Open label: "Hide plan comparison"
  - **`Collapsible` / `CollapsibleContent`** wrapping the existing 4-tier grid, verbatim (no restructuring of cards, prices, or links).
- Use the same `Collapsible` primitive pattern already used in `Index.tsx` (`showPlanComparison`).
- Add local state `const [showComparison, setShowComparison] = useState(false)`.

### 2. Lightweight analytics (best-effort, no fabrication)
- On first open of the comparison per session, fire:
  ```ts
  supabase.functions.invoke('log-site-event', {
    body: {
      interaction_type: 'pricing_expanded',
      visitor_fingerprint: <stored fingerprint if any>,
      website_id: undefined,
    },
  });
  ```
- Only fire when a visitor fingerprint already exists (read from the same localStorage key `LandingAIChat` / floating widget uses, if present). If no fingerprint is available, skip the log silently — do not invent one.
- Guard with a `useRef` so it fires at most once per page load.

### 3. Out of scope for this pass
- `src/pages/Index.tsx` pricing section — unchanged.
- `PricingComparisonTable.tsx`, `DiyCostBreakdown.tsx` — unchanged.
- No copy changes to individual tier cards, prices, or Stripe wiring.
- No new backend routes, no schema changes.

## Files touched
- `src/pages/ForBusiness.tsx` (only file edited)

## Verification
- Typecheck.
- Playwright screenshot of `/for-business` confirming:
  - Only the single Elite CTA card is visible initially.
  - Clicking "Compare all 4 plans" reveals the existing 4-tier grid.
  - Toggle label flips and chevron rotates.
