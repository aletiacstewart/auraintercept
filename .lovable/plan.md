
## Problem
The Video Prompts page has invisible text on dark backgrounds because:
1. **Assembly Guide stat boxes** use `bg-muted/20 border border-border/30` — on the deep-space dark bg this renders nearly black-on-black
2. **ClipCard background** uses `bg-card/60` — too dark, content disappears
3. **TabsList** uses `bg-muted/30 border border-border/40` — the tab bar is almost invisible
4. **Inactive TabsTrigger** uses `text-muted-foreground` — near-invisible mid-grey on dark card
5. **Prompt text** uses `text-foreground/80` — unnecessarily dimmed
6. **Section badge** uses `bg-muted/50 text-muted-foreground` for the "8s" badge
7. **Legend icons** at the bottom use `text-foreground/70` — barely visible

PlatformGuides uses `glass-card`, `bg-white/5`, `text-foreground`, `border-border/30` — the correct pattern for this dark theme.

## Fix — single file: `src/pages/VideoPromptsPage.tsx`

### 1. Assembly Guide card (line 459)
- Change `bg-card/60 backdrop-blur-sm` → `glass-card` (matches PlatformGuides card style)

### 2. Stat boxes (lines 474–489, all 4 boxes)
- Change `bg-muted/20 border border-border/30` → `bg-white/8 border border-white/15`
- `text-muted-foreground` labels → `text-foreground/70`

### 3. "8s" duration badge (line 380)
- Change `bg-muted/50 text-muted-foreground border border-border/50` → `bg-white/10 text-foreground border border-white/20`

### 4. ClipCard card background (line 370)
- Change `bg-card/60 backdrop-blur-sm` → `glass-card` to match PlatformGuides

### 5. TabsList (line 389)
- Change `bg-muted/30 border border-border/40` → `bg-white/8 border border-white/15`

### 6. Inactive TabsTrigger (lines 390, 394, 398) 
- Change `text-muted-foreground` → `text-foreground/65` — clearly readable
- Active state: change `data-[state=active]:bg-card` → `data-[state=active]:bg-white/15`

### 7. Prompt text (lines 405, 413, 421)
- Change `text-foreground/80` → `text-foreground` — full brightness

### 8. Legend row (lines 506-508)
- Change `text-foreground/70` → `text-foreground/85`

### 9. Copy All button (line 466)
- Change `text-foreground hover:text-foreground hover:bg-muted/30` → `text-foreground hover:bg-white/10`

### Files to edit
- `src/pages/VideoPromptsPage.tsx` only — targeted color/opacity fixes to match PlatformGuides pattern
