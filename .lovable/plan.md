

# Add Icon-Colored Borders to All Grid Boxes on Homepage

## Summary
Change every grid box's default border from the current dim white (`rgba(255,255,255,0.08)`) to the color of its icon, making the page feel more vibrant. The hover glow stays as-is.

## Changes — all in `src/pages/Index.tsx`

### 1. Console Cards (7 cards, line ~558-564)
Already have per-card neon colors via `consoleNeons[i]`. Change the **default** (non-hover) border from `rgba(255,255,255,0.08)` to a subtle version of each console's neon color:
- Default border: `1px solid ${neon.color}44` (hex alpha ~27% opacity)
- Hover border stays as-is (`neon.border` at 55%)

### 2. Agent Cards (24 cards, lines ~610-612)
Each category already has `neonRgb`. Change default border and boxShadow:
- Default border: `1px solid rgba(${category.neonRgb},0.25)`
- Default boxShadow: `0 0 0 1px rgba(${category.neonRgb},0.15), 0 0 12px rgba(${category.neonRgb},0.06)`
- `onMouseLeave` resets to these same values
- Hover glow unchanged

### 3. Communication Channel Cards (4 cards, lines ~646-648)
Each channel has `neonRgb`. Change default border and boxShadow:
- Default border: `1px solid rgba(${channel.neonRgb},0.25)`
- Default boxShadow: `0 0 0 1px rgba(${channel.neonRgb},0.18), 0 0 18px rgba(${channel.neonRgb},0.08)`
- `onMouseLeave` resets to match
- Hover glow unchanged

### 4. Platform Feature Cards (12 cards, lines ~675-677)
All icons are cyan `#00E5FF`. Change default border and boxShadow:
- Default border: `1px solid rgba(0,229,255,0.2)`
- Default boxShadow: `0 0 0 1px rgba(0,229,255,0.15), 0 0 18px rgba(0,229,255,0.06)`
- `onMouseLeave` resets to match
- Hover glow unchanged

### 5. Industry Cards (lines ~706-708)
All icons are cyan. Same treatment as platform features:
- Default border: `1px solid rgba(0,229,255,0.2)`
- Default boxShadow: `0 0 0 1px rgba(0,229,255,0.12), 0 0 12px rgba(0,229,255,0.05)`
- `onMouseLeave` resets to match

### 6. How It Works Cards (lines ~741-743)
Icons use the cyan gradient. Same treatment:
- Default border: `1px solid rgba(0,229,255,0.2)`
- Default boxShadow: `0 0 0 1px rgba(0,229,255,0.15), 0 0 18px rgba(0,229,255,0.06)`
- `onMouseLeave` resets to match

## What stays the same
- All hover glow effects remain identical
- All hover transforms (translateY, scale) remain identical
- Card backgrounds, text colors, and content unchanged

## Result
Every grid box will have a subtle colored border matching its icon at rest, making the dark page feel more alive. On hover, the existing brighter glow takes over.

