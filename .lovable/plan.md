## Goal

Add an ROI calculator section to the live demo page (`/for-business`) that updates its defaults based on the selected industry, matching the screenshot's design (technicians, avg job value, calls/day, tier → monthly/annual gain + breakdown).

## Approach

The live demo page is a single industry-switching page (`ForBusiness.tsx`), not 18 separate pages. The ROI block will react to the currently selected industry via the existing `industry` state — no per-page duplication needed.

## Changes

1. **New file: `src/lib/industryRoiDefaults.ts`**
   - Map of `industryId → { technicians, avgJobValue, callsPerDay, technicianLabel, jobLabel }`.
   - Covers all 28 industry pack IDs (plumbing/HVAC ≈ $450 job, landscape ≈ $180, restaurants → "seats" + lower job value, salon ≈ $85, legal ≈ $350, etc.).
   - Default fallback for `default` / unknown.

2. **New component: `src/components/marketing/IndustryROICalculator.tsx`**
   - Matches the screenshot layout: 4 input cards (technicians slider, avg job value slider/input, calls/day slider, tier dropdown with the 4 canonical tiers — Core $497, Boost $697, Pro $1,197, Elite $2,197).
   - 4 result cards: Monthly ROI value, Net monthly gain, Annual value, ROI multiple.
   - Breakdown rows: Recovered missed call revenue, After-hours lead capture, No-show reduction savings, Admin time savings.
   - Formula uses the same benchmarks as the existing ROI calc footnote (62% missed call rate, 38% AI recovery, 55% after-hours loss, 40% no-show reduction, $22/hr admin savings).
   - Industry-aware labels: "# of technicians" becomes "# of stylists" (salon), "# of staff" (restaurants), etc., pulled from the defaults map.
   - Footnote with benchmark sources.
   - Uses Cyber-Sentry theme tokens only (no hex/rgba) per project memory.

3. **Edit `src/pages/ForBusiness.tsx`**
   - Insert `<IndustryROICalculator industryId={industry} />` as a new section between `RolePreviewRow` and the pricing snapshot.
   - Section wrapper with heading: "What Aura is worth to your {industry}" (uses `content.label`).

## Technical Details

- Selecting a tier updates the subtracted plan cost (`net = gross − tierPrice`) and ROI multiple (`gross / tierPrice`).
- Tier dropdown reuses tier prices from existing canonical pricing memory; no new pricing source.
- When `industryId` changes, the calculator resets to that industry's defaults via a `useEffect` keyed on `industryId`.
- No backend, no schema, no edge function changes.

## Out of Scope

- No changes to the existing standalone `/calculators` page ROI tool.
- No new routes; the live demo remains a single dynamic page.
