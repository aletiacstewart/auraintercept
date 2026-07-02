## Sidebar scroll unification (`src/components/dashboard/DashboardLayout.tsx`)

Today the sidebar has two regions:
- Middle nav wrapped in a `ScrollArea` (lines 514–661) — scrolls.
- Bottom footer holding the Aura Elite tier badge, role badge, AI Help Center, Report Issue, and Sign Out (lines 663–737) — pinned, never scrolls.

That's why the tier chip + bottom actions stay stuck while the nav scrolls behind them.

### Fix

Merge both regions into a single scroll surface so the tier badge and bottom actions scroll together with the nav:

1. Extend the existing `ScrollArea` (still inside the `flex-1 min-h-0` container) to wrap both the `<nav>` block and the current footer `div`.
2. Keep the `Separator` between nav and footer, but move it inside the scroll area.
3. Preserve current visuals: same spacing (`px-2 py-4` around nav, `p-3 space-y-2` around footer), same collapsed vs. expanded rendering, same tour IDs, same scroll-restore logic (still targets the single `[data-radix-scroll-area-viewport]`).
4. Leave the collapse chevron button (lines 740–748) outside the scroll area so it stays fixed on the sidebar edge.

Result: on short viewports, the user can scroll down within the sidebar to reach Aura Elite → Platform Admin → AI Help Center → Report Issue → Sign Out. On tall viewports, everything fits with no scrollbar (same as today).

### Out of scope

- No changes to nav items, tier logic, badge styling, or the main content area.
- No changes to the technician sidebar (`TechnicianDashboardLayout.tsx`).
