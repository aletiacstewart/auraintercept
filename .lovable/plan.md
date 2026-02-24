
# Port Cinematic Dark-Tech Design to Homepage

The homepage (`src/pages/Index.tsx`) currently uses the old light-mode two-column layout with a video embed and plain blue text. It has NOT been updated with the cinematic hero, dark mesh background, neon glows, or glassmorphic cards developed in the Design Preview.

## What needs to change

### 1. Hero Section — Full replacement
The current hero is a split 2-column grid with a video on the left and text on the right, sitting on a plain background. It will be replaced with:
- Full-width cinematic hero using the `hero-agents.jpeg` background image (same as Design Preview)
- `brightness(1.0) saturate(1.2)` image filter so the robots show fully
- Bottom gradient darkening overlay: `linear-gradient(180deg, rgba(4,10,20,0.05) 0%, rgba(4,10,20,0.3) 45%, rgba(4,10,20,0.82) 100%)`
- Cyan scan-line texture overlay
- Centered content: circular logo badge with cyan glow, eyebrow pill, gradient "AURA INTERCEPT" title, subtitle, CTA buttons, trust bar stats
- Animated cycling subtitle (already exists in state, just repositioned)

### 2. Page Background — Deep-space mesh gradient
Replace `bg-background` wrapper with the cinematic radial mesh:
```
radial-gradient(ellipse 120% 80% at 50% 0%, hsl(200,60%,6%) 0%, hsl(210,40%,4%) 50%, hsl(220,30%,3%) 100%)
```

### 3. Agent Consoles Grid — White halo + neon hover
The console cards (`agentConsoles`) will adopt the glassmorphic card style from Design Preview Section 2:
- Default: `boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 0 18px rgba(255,255,255,0.06)"`
- Hover: colored neon shadow per console (cyan, green, orange, purple, indigo, pink, teal)
- `translateY(-6px) scale(1.02)` lift on hover
- `backdropFilter: blur(24px)` glass background

### 4. Agent Category Tabs — Dark glassmorphic treatment
Active tab gets neon cyan border + glow; inactive tabs get subtle white halo border.

### 5. Feature Highlights Grid — White halo + cyan hover
The `platformFeatures` grid will match Design Preview Section 6: white halo by default, cyan neon shadow on hover.

### 6. Stats Bar — Gradient values
The `heroStats` (24 AI Operatives, 24/7, etc.) get the neon gradient number treatment from the stat cards in Design Preview Section 4.

### 7. Section Headings — Gradient text
All major `<h2>` headings get the `linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)` clip treatment with `WebkitTextFillColor: transparent`.

### 8. CTA Buttons — Animated gradient
Primary buttons get the `linear-gradient(135deg, #00E5FF, #214ebb, #00B8D4, #00E5FF)` with `backgroundSize: 300% 300%` and the `border-shine` keyframe animation from Design Preview.

### 9. PublicHeader — Styled to match dark nav
The `PublicHeader` component already has `bg-sidebar` dark styling — it will remain as-is since it already matches the dark aesthetic.

## Files to modify
- `src/pages/Index.tsx` — Main homepage, hero + all sections updated
- No new files needed (assets already exist: `hero-agents.jpeg`, `hero-logo.jpeg`)

## Technical notes
- The `hero-agents.jpeg` and `hero-logo.jpeg` assets are already imported in `DesignPreview.tsx`, they just need to be imported in `Index.tsx` too
- The `border-shine` keyframe will be added inline via a `<style>` tag in the component (same approach as DesignPreview)
- Existing content (agent lists, pricing, industries, FAQ) will be preserved — only the visual styling changes
- The hover state tracking (`hoveredCard`, `hoveredConsole`, etc.) will use `useState` hooks already present in the component
