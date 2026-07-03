Plan: Color token consistency cleanup + remove dead light-mode CSS

## Background
I reviewed the two highest-traffic shell files and the global CSS. The hardcoded brand colors (#00E5FF, #ff6b6b, #46a2d3) in DashboardLayout.tsx and PublicHeader.tsx already have semantic token equivalents in src/index.css, and the app is dark-mode-only (index.html hardcodes `<html class="dark">`), so the `:root` light-mode variable block is never rendered.

## Fix 1 — Replace hardcoded brand colors with tokens

### src/components/dashboard/DashboardLayout.tsx
1. Active nav item styling (~line 604-609)
   - Replace `background: "rgba(0,229,255,0.1)"` with `background: "hsl(var(--primary) / 0.1)"`
   - Replace `color: "#00E5FF"` with `color: "hsl(var(--primary))"`
   - Replace `boxShadow` rgba values with `hsl(var(--primary) / 0.2)`
2. Active icon styling (~line 653)
   - Replace `style={isActive ? { color: "#00E5FF" } : undefined}` with `style={isActive ? { color: "hsl(var(--primary))" } : undefined}`
3. Logout icon (~line 733)
   - Replace `style={{ color: "#ff6b6b" }}` with `style={{ color: "hsl(var(--destructive))" }}`
4. Collapse button (~line 745)
   - Replace `border: "1px solid rgba(0,229,255,0.2)"` with `border: "1px solid hsl(var(--primary) / 0.2)"`
   - Replace `color: "#00E5FF"` with `color: "hsl(var(--primary))"`
   - Keep `background: "rgba(4,10,20,0.95)"` as-is (dark-background pattern is out of scope for this change)
5. Mobile menu button (~line 765)
   - Replace `style={{ color: "#00E5FF" }}` with `style={{ color: "hsl(var(--primary))" }}`

### src/components/layout/PublicHeader.tsx
1. Wordmark span (~line 30)
   - Replace `text-[#00E5FF]` with `text-primary`
2. Tagline span (~line 31)
   - Replace `text-[#46a2d3]` with `text-primary/60` to approximate the original muted sky-blue feel

## Fix 2 — Remove dead light-mode CSS

### src/index.css
- Delete the entire `:root` CSS variable block (roughly lines 13-97) that defines the unused light-mode theme.
- Keep the `.dark` block unchanged so all existing tokens continue to resolve correctly for the always-dark app.
- No rename of `.dark` to `:root` is required, since `<html class="dark">` is already set everywhere.

## Out of scope
- Dark background rgba() values (`rgba(4,10,20,...)`), near-white text (`rgba(255,255,255,...)`), and other surface-level hardcoded colors are intentionally left untouched pending a separate dedicated cleanup.
- No functional changes to navigation, header links, or layout behavior.

## Acceptance checklist
- [ ] Sidebar active-item highlight, active icon, logout icon, collapse button, and mobile menu button render visually identical to before (zero-visible-difference refactor).
- [ ] PublicHeader wordmark and tagline colors look the same or acceptably close; we can adjust the tagline opacity fraction if `text-primary/60` does not match #46a2d3 closely enough.
- [ ] The dead `:root` light-mode block is removed, and the codebase no longer contains a silently unreachable second theme.
- [ ] App builds and existing dark-mode screens remain unchanged.