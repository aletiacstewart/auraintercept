
# Design Preview Page — See the New Aesthetic Before Committing

## What This Does

Creates a single new route `/design-preview` that renders a **standalone visual demo** of the new dark-tech aesthetic. Nothing on the live site is changed. You visit the preview page, approve or request tweaks, then we roll the approved style out platform-wide.

## Current State (from screenshot)

The landing page currently has:
- Light/white background with flat layout
- Royal blue flat title text
- Standard navy button styles
- No atmospheric depth or ambient effects

## What the Preview Page Will Show

The preview page renders 5 demo sections, each showing the new style applied to real components from the platform:

### Section 1: Hero Demo
- Deep dark animated mesh gradient background
- "AURA INTERCEPT" title in cyan-to-blue gradient sweep
- Glowing subtitle text
- Two CTA buttons — one with animated gradient border sweep, one glass style
- Subtle tech grid overlay on background

### Section 2: Console Cards Demo
- 4 console cards (Customer Portal, Field Ops, Business Ops, Analytics)
- Each card: dark glass panel with translucent background + blur effect
- Console-specific neon border color on hover (blue, green, purple, cyan)
- Neon glow shadow on hover
- Icons and text visible and readable

### Section 3: Dashboard Stat Cards Demo
- 4 metric cards matching what the dashboard shows
- Dark glass surface with subtle gradient border
- Numbers in gradient text (feature color)
- Labels in properly contrasted muted text

### Section 4: Form Input Demo
- A sample form (name, email, phone, dropdown)
- Dark glass input fields with proper light text
- Visible placeholder text at correct opacity
- Focused state shows a neon-blue ring
- Submit button with border-shine animation

### Section 5: Side-by-Side Comparison
- Left column: current design (recreated using existing classes)
- Right column: new design (using new dark-tech classes)
- Labeled clearly so you can compare both at once

## Files Created

| File | Purpose |
|---|---|
| `src/pages/DesignPreview.tsx` | The entire preview page — self-contained, no impact on live site |

## Files Modified

| File | Change |
|---|---|
| `src/App.tsx` | Add one route: `<Route path="/design-preview" element={<DesignPreview />} />` |

**Total: 1 new file, 1 small route addition. Zero changes to any existing pages.**

## How to Access It

After implementation, navigate to `/design-preview` in the preview window. The page will be fully self-contained with all new CSS written inline/as Tailwind classes — so it doesn't affect anything else.

## After You Approve the Preview

Once you like what you see on the preview page, I proceed with the full 4-file platform refresh (`index.html`, `index.css`, `tailwind.config.ts`, `Index.tsx`) that applies the approved aesthetic everywhere.

If you want tweaks (different colors, less glow, different gradient direction), I update the preview page first until it's exactly right — then propagate.
