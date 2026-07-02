Reduce vertical spacing and row height in the main dashboard sidebar so all nav groups and footer actions fit without scrolling.

### What we will change
1. **Tighten nav group spacing** in `src/components/dashboard/DashboardLayout.tsx`:
   - Reduce the outer `nav` gap (`space-y-4`) and nav padding (`py-4`) so groups sit closer together.
   - Reduce group label/header padding (`px-3 py-1`) to `px-3 py-0.5`.
   - Keep visual hierarchy with the existing uppercase label and icon styling.

2. **Compact individual nav buttons**:
   - Add `h-8` / `py-1.5` sizing to the nav `Button` so each row is shorter while the icon and label remain the same size.
   - Preserve the collapsed icon-only layout and active/hover glow effects.

3. **Compact the footer section** (tier badge, role badge, AI Help Center, Report Issue, Sign Out):
   - Reduce `p-3 space-y-2` to `p-2 space-y-1`.
   - Shorten the Report Issue and Sign Out buttons to match nav row height.
   - Keep the tier badge and Sign Out button as they are functionally.

4. **Verification**:
   - Type-check with `tsgo`.
   - Confirm the full sidebar (nav + footer) fits within a 900 px viewport without scrolling and that all items remain clickable and readable.

### Out of scope
- Mobile drawer layout
- Collapse behavior / collapse button
- Technicians dashboard layout
- Nav labels, group ordering, or tier badge logic
- Color/theming changes beyond spacing/sizing classes