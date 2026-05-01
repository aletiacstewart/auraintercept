## Pricing Comparison Table — Specialist Operatives + Cleanup

Update `src/components/landing/PricingComparisonTable.tsx` to (a) surface the 4 new industry specialist operatives shipped in Phase 2, and (b) remove the White-Label Branding row.

### What changes

**1. Remove White-Label Branding row** (line 139)
- Delete the row from the "Platform Limits & Features" section.
- Sweep other surfaces that still mention it on the pricing/landing pages so we don't show conflicting info:
  - `src/pages/Subscription.tsx`
  - `src/pages/Index.tsx`
  - `src/components/smartwebsite/VisitorLimitModal.tsx`
  - `src/lib/documentationConfig.ts`, `src/lib/helpContentConfig.ts`
  - PDF generators (`PlatformDocumentPDF`, `SalesPitchDataPDF`, `WebsiteCopyPDF`)
- `useSubscription.ts` flag stays (internal capability), but no UI surfaces will advertise it.

**2. Add new "Specialist Operatives (Industry-Specific)" section**
Inserted after the existing "Smart AI Agents" section. These are auto-activated only when a company picks a matching industry vertical at signup. Tier minimum is **Pro** (per Phase 2 gating).

| Specialist | Core | Boost | Pro | Elite | Industries that unlock it |
|---|---|---|---|---|---|
| Diagnostic Agent | x | x | check | check | Appliance Repair, Auto Care, Pool/Spa, Solar |
| Permit & Code Agent | x | x | check | check | Electrical, Roofing, Solar, Construction, Security, Fencing |
| Site Survey & Quote Agent | x | x | check | check | Roofing, Solar, Landscape, Construction, Security, Fencing |
| Insurance Claim Agent | x | x | check | check | Roofing, Auto Care |

Section will include a one-line intro under the title:
> "Auto-activated based on the industry you select at signup. Available on Pro and Elite plans."

### Technical details

- Append a new `FeatureSection` to the `sections` array in `PricingComparisonTable.tsx` between the existing "Smart AI Agents" and "Control Centers" entries.
- Update the section title `'Smart AI Agents (8 / 12 / 16 / 24)'` is unchanged — specialists are *additive* on top of the base 8/12/16/24 and only count when the industry uses them, so totals stay accurate.
- For the intro line, render it as a small muted-text row beneath the section header (extend the section renderer with an optional `subtitle` field, or hardcode a row with `name` styled as helper text). Lean toward adding `subtitle?: string` to `FeatureSection` for cleanliness.
- Remove the white-label row only — keep the rest of "Platform Limits & Features" intact.
- For the doc/PDF/help-config sweeps, replace the white-label bullet with nothing (just remove); do not substitute language.

### Out of scope

- No DB or edge-function changes (Phase 2 already shipped specialist gating + prompts).
- No tier-pricing or agent-count changes.
- `useSubscription` capability flag remains untouched.
