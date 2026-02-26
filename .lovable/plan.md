
## Fix: Sidebar Nav Text — Faded White → Bright White

The screenshot shows "Dashboard" and "Quick Setup" labels in a dim grey-white. This is caused by a single color value `rgba(255,255,255,0.65)` used in 4 places in `DashboardLayout.tsx`.

### Root Cause

In `src/components/dashboard/DashboardLayout.tsx`:

| Location | Current | Fix |
|---|---|---|
| Line 470 — inactive nav item style | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.92)` |
| Line 500 — `onMouseLeave` reset | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.92)` |
| Line 578 — "Report Issue" button | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.92)` |
| Line 592 — "Sign Out" button | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.92)` |

### What Changes

All inactive sidebar menu items (Dashboard, Quick Setup, every nav link) will go from dim/faded grey-white to crisp bright white. Active items and hover glows are unaffected — they already use full-brightness colors.

### One file, 4 value swaps. No structural changes.
