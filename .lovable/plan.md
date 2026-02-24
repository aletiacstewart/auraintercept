

# Make the Robots More Visible in the Hero

## The Problem

The hero background image (`hero-agents.jpeg`) is too dark because of two layers stacking on top of it:
1. **Brightness filter** on the image itself: `brightness(0.35)` -- this alone dims it to 35% brightness
2. **Gradient overlay** on top: a dark gradient going from 50% opacity at the top to 85% at the bottom

Combined, the robots are barely visible.

## The Fix

Three small changes to `src/pages/DesignPreview.tsx`:

### 1. Raise the image brightness
- **Line 86**: Change `filter: "brightness(0.35) saturate(1.4)"` to `filter: "brightness(0.55) saturate(1.3)"`
- This lets significantly more of the robot detail through

### 2. Lighten the gradient overlay
- **Line 92**: Change the overlay gradient from `rgba(4,10,20,0.5)...0.3...0.85` to `rgba(4,10,20,0.25)...0.1...0.75`
- The top and middle become much more transparent so the robots show clearly
- The bottom stays slightly dark so the text below the hero still has contrast

### 3. Reduce the scan line opacity slightly
- **Line 98**: Change scan line color from `rgba(0,229,255,0.015)` to `rgba(0,229,255,0.01)` -- just a hair less interference on the image

**Result:** Robots will be clearly visible with good detail while still maintaining the cinematic dark mood and ensuring all text remains readable against the image.

**Only 1 file modified: `src/pages/DesignPreview.tsx` (3 line changes)**

