I’ll do a deeper, component-level cleanup instead of another narrow pass, because the screenshots show the remaining grey text is coming from shared console primitives and nested cards/forms rather than only the top-level pages.

## Scope
- All AI consoles:
  - Customer Portal Console
  - Field Operations Console
  - Business Management Console
  - Outreach & Sales Console
  - Social Media Console
  - Analytics Console
- Main dashboards and authenticated dashboard pages under `/dashboard`
- Technician dashboard pages under `/technician`
- Shared console/dashboard components used inside those screens
- Exclusion: sidebar menu text stays as-is/white per your instruction

## Changes to make

1. Fix shared console primitives first
   - Update `PageHeader` so console/page subtitles are solid white, while titles use the feature/icon accent color where appropriate.
   - Update `WorkflowChainButtons` so:
     - workflow section label is white or accent-safe on dark backgrounds
     - grid box titles match their icon color
     - descriptions are pure white
     - arrow separators do not appear grey on dark cards
   - Update `CyberConsoleLayout` so left-panel agent descriptions, metric labels, “Session Metrics”, and small status labels are pure white unless they are intentionally colored status values.
   - Update `FloatingInput` and Aura input components so placeholder/input helper text is white on dark input bars.
   - Update `AgentHowToGuide` so collapsed guide text, grid card descriptions, step descriptions, tips, and chevrons are white; guide/card titles match their icon colors.
   - Update `CompanySelector` so “Choose a company…”, “Click to start chatting”, empty/loading text, and chevrons are white on the dark card background.

2. Sweep all console-specific components
   - Replace remaining grey/low-opacity text classes inside AI console implementations and nested forms/cards, including patterns such as:
     - `text-muted-foreground`
     - `text-white/30`, `text-white/40`, `text-white/50`, `text-white/60`, `text-white/70`
     - `text-card-foreground/60`, `text-foreground/70`, similar opacity text
     - `text-slate-*`, `text-gray-*`, `text-zinc-*` used for body/description text on dark backgrounds
     - muted inline styles like `rgba(255,255,255,0.6)` used as text color
   - Preserve intentional non-grey semantic colors such as cyan, green, amber/yellow, red, purple, success/warning/error badges, and disabled/placeholder states only where they are not on the dark grid/card text the user is calling out.

3. Sweep dashboards and technician pages
   - Update remaining dashboard and technician page headings/subtitles/descriptions from muted grey to white.
   - Keep sidebar navigation unchanged.
   - Keep color-coded icons and status indicators colored.

4. Match grid/card titles to their icon colors
   - For reusable cards that receive an icon color, wire the title class to the same color.
   - For console action/guide cards, use the mapped feature/icon color for the title instead of `text-foreground` or grey.
   - For cards without a clear feature/icon color, keep the title solid white rather than grey.

5. Add a safer dark-surface CSS fallback
   - Add scoped rules for dashboard/console dark containers so common muted utility text inside dark surfaces renders white by default.
   - This reduces missed nested cases without affecting the public landing page or sidebar menu.
   - The rule will avoid overriding explicit feature/status colors.

6. Verify by search and targeted visual pass
   - Re-run searches for muted/opacity text classes across console/dashboard directories.
   - Review the exact areas shown in your screenshots:
     - page header subtitles
     - End-to-End Workflow cards
     - active agent panel text
     - session metrics labels
     - how-to accordion cards
     - company selector list text
     - analytics empty-state prompt text
     - top progress chips where text sits on dark backgrounds

## Technical notes
- I won’t edit generated Lovable Cloud integration files.
- No backend/database changes are needed.
- I’ll prioritize shared components so the fix applies across all consoles instead of changing each screenshot one at a time.
- Sidebar menu text will not be targeted by the color sweep.