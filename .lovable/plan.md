
## Scope Assessment

The user wants to apply the Cyber-Sentry aesthetic across ALL dashboards, consoles, forms, and AI agent pages. This is a large-scale design system upgrade — NOT a new mockup page, but an in-place transformation of the real UI. Here's exactly what needs to change and what doesn't.

### What Gets Upgraded (targeted surgical changes):

**1. `src/index.css` — Core Design Token Changes**
- Upgrade `.glass-primary` from `hsl(208 30% 18%)` to a deeper obsidian `rgba(4,10,22,0.92)` with `border-color: rgba(0,229,255,0.18)`
- Upgrade `.glass-card` with a neon cyan border tint
- Add new CSS classes: `.cyber-panel`, `.neon-top-border`, `.cyber-dot-grid`, `.cyber-card`, `.gauge-ring`, `.cyber-badge-icon`
- Add `@keyframes` for `cyber-pulse`, `cyber-scan`, `cyber-glow` 

**2. `src/components/ai/chat/GlassHeader.tsx` — Console Header Upgrade**
- Add `border-top: 3px solid rgba(0,229,255,0.7)` neon top accent line (already in memory as a feature to add)
- Add `box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,229,255,0.1)` 
- Deepen background to `rgba(4,10,22,0.95)` obsidian
- Add `text-shadow` to company name for cyan glow effect
- Online status dot: add outer animate-ping ring in emerald

**3. `src/components/ai/chat/MobileTabNav.tsx` — Glowing Active Pill Tabs**
- Replace `border-b border-border/50` bottom-line active indicator with a glowing pill: `background: rgba(0,229,255,0.15); border: 1px solid rgba(0,229,255,0.4); box-shadow: 0 0 12px rgba(0,229,255,0.3)`
- Deepen background from `hsl(208 30% 18%)` to `rgba(2,8,16,0.95)`
- Active tab text: bright white + neon feature-color glow

**4. `src/components/ai/chat/QuickActionGrid.tsx` — Glowing Badge Icons**
- Replace plain icon rendering with badge container: icon wrapped in `bg-[color]/10 border border-[color]/20 rounded-lg` glow badge
- Deepen button base background to `rgba(4,10,22,0.9)`
- Add `border-top: 1px solid rgba(0,229,255,0.08)` subtle separator above grid

**5. `src/components/ui/page-header.tsx` — Cyber-Sentry Page Header**
- Add neon border accent to the icon container: `box-shadow: 0 0 16px [featureColor]/0.4`
- Title text: add subtle `text-shadow` for glow effect on hover
- Add a subtle `border-b border-[featureColor]/10` separator below

**6. `src/components/dashboard/CompanyAdminDashboard.tsx` — Main Dashboard Cards**
- Upgrade stat Cards: add `border-t-2 border-[featureColor]/40` neon top accent + glassmorphism bg `bg-[color]/5`
- Upgrade Quick Action buttons: wrap icons in glowing badge containers (matching the cyber-sentry portal style)
- Progress bars: change `bg-slate-600` track to `rgba(0,229,255,0.08)` + add cyan glow to fill
- "Intelligence Network: Active" pill: upgrade to neon emerald ping style

**7. `src/components/dashboard/DashboardLayout.tsx` — Fix Report Issue button**
- Line 578: `color: "rgba(255,255,255,0.65)"` → `"rgba(255,255,255,0.92)"` (the one remaining instance missed earlier)
- Add a subtle `border-t-2 border-cyan-400/60` to the main sticky top header bar
- Add `.cyber-dot-grid` overlay to the main content background

**8. `src/components/ai/chat/WelcomeScreen.tsx` — Cyber Welcome Screen**
- Add a hex shield SVG watermark behind the quick actions
- Upgrade heading with monospace font + subtle neon glow

### What Does NOT Change:
- All existing data/logic/routing — zero functional changes
- `src/integrations/supabase/*` — never touched
- The 2 new mockup pages (CyberSentryMockup.tsx, CyberSentryPortalMockup.tsx) — already correct

---

## Files to Edit: 7 Files

| # | File | What Changes | Lines Affected |
|---|------|-------------|----------------|
| 1 | `src/index.css` | Add `.cyber-*` classes, upgrade `.glass-primary`, add keyframes | ~8 new lines |
| 2 | `src/components/ai/chat/GlassHeader.tsx` | Neon top border, obsidian bg, ping status dot | ~15 lines |
| 3 | `src/components/ai/chat/MobileTabNav.tsx` | Obsidian bg, glowing active pill (remove bottom-line) | ~20 lines |
| 4 | `src/components/ai/chat/QuickActionGrid.tsx` | Badge icon containers, deeper base bg | ~15 lines |
| 5 | `src/components/ui/page-header.tsx` | Neon glow on icon container | ~5 lines |
| 6 | `src/components/dashboard/CompanyAdminDashboard.tsx` | Cyber stat cards, badge quick actions, cyber progress bars | ~40 lines |
| 7 | `src/components/dashboard/DashboardLayout.tsx` | Fix Report Issue button (line 578), main header neon accent | ~5 lines |

---

## Visual Delta — Before → After

```
BEFORE (current)                    AFTER (Cyber-Sentry edition)
─────────────────────────────────   ─────────────────────────────────
GlassHeader: hsl(208,30%,18%)       GlassHeader: rgba(4,10,22,0.95)
             no top border                       3px neon cyan top
             simple green dot                    green dot + ping ring

MobileTabNav: bottom underline      MobileTabNav: glowing pill
              dimmer inactive text               bright white inactive

QuickAction: plain icon + label     QuickAction: icon in glow badge
             slate background                    obsidian + neon hover

Stat Cards: plain white cards       Stat Cards: border-t neon accent
            plain borders                        glassmorphism tinted

Progress bars: bg-slate-600 track   Progress: rgba(cyan/8) track
                                               glow fill line

PageHeader icon: plain circle       PageHeader icon: neon ring shadow

Dashboard bg: light cards on dark   Dashboard bg: obsidian cards with 
              obsidian layout                    dot-grid texture overlay
```

---

## Implementation Approach

All 7 files are edited in parallel. No new files created. No routes added. No data changes. No Supabase changes. Pure CSS/style upgrades preserving all existing functionality, data bindings, and component APIs.

The changes cascade automatically to ALL console pages (BusinessManagementConsole, FieldOpsConsole, MarketingSalesConsole, AnalyticsConsole, SocialMediaConsole, CustomerPortalConsole) because they all use the shared `GlassHeader`, `MobileTabNav`, `QuickActionGrid`, and `WelcomeScreen` components.
