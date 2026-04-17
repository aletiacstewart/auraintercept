

## Fix Audit Results — Invisible Text on Light Cards (Dark Mode)

### Root cause
`AuditResults.tsx` mixes hardcoded **light** Tailwind backgrounds (`bg-white`, `bg-blue-50`, `bg-violet-50`, `bg-emerald-50`, `bg-white/80`) with **theme-token text colors** (`text-foreground`, `text-muted-foreground`). The platform runs the Cyber-Sentry dark theme by default, so `text-foreground` resolves to near-white — white text on white/pale-blue cards = invisible (exact match for the screenshot).

This violates the project's core rule: *"Theme CSS vars ONLY (no hex/rgba)"* and the equivalent for hardcoded color classes.

`AuditQuestion.tsx` has the same problem (`bg-white`, `text-gray-700`, `border-gray-200`) but is less obvious because selected options fill with bright accent colors.

### Fix — swap hardcoded colors for theme tokens

**`src/components/audit/AuditResults.tsx`**
- Replace `bg-white` / `bg-white/80` panels → `bg-card` (with `text-card-foreground` where needed).
- Replace tier accent backgrounds (`TIER_BG_COLORS`: `bg-blue-50`, `bg-violet-50`, `bg-emerald-50`) → theme-aware tints: `bg-primary/5 border-primary/30`, `bg-accent/10 border-accent/30`, `bg-emerald-500/10 border-emerald-500/30`, `bg-primary/10 border-primary/40` — all readable in dark mode.
- The "Recommended Plan" badge (`bg-white text-foreground/70`) → `bg-card text-card-foreground border-border`.
- The "Fit Score" pill (`bg-white`) → `bg-card border-border`.
- The 3 stat tiles (`bg-white/80`) → `bg-card/60 border-border`.
- Keep the gradient icon badges and the green revenue-impact accent (`text-emerald-400` instead of `emerald-600` for dark-mode contrast).

**`src/components/audit/AuditQuestion.tsx`**
- Unselected option rows: `bg-white hover:bg-gray-50 border-gray-200 text-gray-700` → `bg-muted/40 hover:bg-muted/70 border-border text-foreground`.
- Unselected radio circle: `border-gray-400` → `border-muted-foreground/50`.
- Selected state keeps its bright fill (emerald/yellow/orange/red) — those are intentional traffic-light cues and already have white text on saturated bg, which works in both themes.

### Files touched
- `src/components/audit/AuditResults.tsx` — color-token sweep (~12 class swaps)
- `src/components/audit/AuditQuestion.tsx` — unselected-row color-token sweep (~3 class swaps)

### Out of scope
- No changes to scoring logic, tier copy, the PDF, or routing
- No changes to the gradient icon backgrounds or selected-answer traffic-light colors (those render correctly)
- No global theme changes

### Verification
After the swap, every card on `/audit` and `/audit` results screen will use `bg-card` / `bg-muted` / `bg-primary/10` style tokens that automatically invert with the theme — text will be readable in both light and dark modes.

