
## Root Cause — Why Nothing Has Worked

Every fix attempt failed for the same reason: **`glass-card` = `rgba(255,255,255,0.03)`** — that is 3% white opacity on a near-black background. It is invisible. Same issue with `bg-muted/30` in dark mode where `--muted` resolves to `hsl(210 35% 14%)` which is a very dark navy.

The page uses `PageContainer variant="transparent"` so cards sit directly on the deep-space `hsl(210 40% 4%)` background. Every "fix" just kept applying near-invisible colours.

## The Real Fix — 3 files

### 1. `src/index.css` — Fix `glass-card` utility
`glass-card` currently = `rgba(255,255,255,0.03)` = 3% white = invisible.
Change to `rgba(255,255,255,0.08)` with a visible border.

```css
.glass-card {
  background: rgba(255,255,255,0.08);   /* was 0.03 */
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.12);
}
```

### 2. `src/components/ui/tabs.tsx` — Fix default `TabsList` base style
`TabsList` base = `bg-muted/30` which in dark mode is ~`hsl(210 35% 14% / 0.3)` ≈ near-black.
Change base default to use `bg-white/[0.08]` with a visible border so tabs are always readable on dark surfaces.

```tsx
// Change base TabsList from:
"inline-flex items-center justify-center gap-0.5 rounded-lg bg-muted/30 p-1 flex-wrap"
// To:
"inline-flex items-center justify-center gap-0.5 rounded-lg bg-white/[0.08] border border-white/[0.12] p-1 flex-wrap"

// Change base TabsTrigger active state from:
"data-[state=active]:bg-background data-[state=active]:text-foreground"
// To:
"data-[state=active]:bg-white/[0.15] data-[state=active]:text-foreground"
```

### 3. `src/pages/VideoPromptsPage.tsx` — Use `glass-card` class (now properly visible)
After fixing `glass-card` to 8% white opacity, use it consistently.

- `ClipCard` at line 370: `glass-card` (now visible with 8% white bg)
- Assembly Guide card at line 459: `glass-card`
- Stat boxes at lines 474-489: keep `bg-white/10 border border-white/20` (already correct, valid Tailwind)
- TabsList overrides in ClipCard at line 389: can be removed since base tabs.tsx is now fixed
- TabsTrigger overrides: can be simplified

## Why This Actually Fixes It
- `glass-card` goes from 3% → 8% white overlay = clearly visible card surface on deep-space black
- `TabsList` global default fixed so ALL tabs across the app are visible on dark backgrounds  
- Card backgrounds show a clear distinction from the pure-black page background

## Files to Edit
1. `src/index.css` — line ~498: fix `.glass-card` background from `0.03` to `0.08`
2. `src/components/ui/tabs.tsx` — lines 15 and 32: fix `bg-muted/30` → `bg-white/[0.08]` with border; fix active state
3. `src/pages/VideoPromptsPage.tsx` — lines 370 and 459: use `glass-card` class cleanly
