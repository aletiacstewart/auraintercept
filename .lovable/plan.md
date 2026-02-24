
## Plan: Add Icon-Color Hover Glows to All Console & Dashboard Buttons/Icons

### What the user wants
On the consoles (Business Mgt Ops, Field Ops, Analytics, Marketing, etc.) and the dashboard sidebar, hovering over buttons and tab icons should produce a colored glow/shadow that matches the icon's assigned feature color. This is the same "neon glow on hover" aesthetic already applied to homepage grid cards.

---

### Where the affected elements live

**1. Dashboard Sidebar nav buttons** — `src/components/dashboard/DashboardLayout.tsx`
- Each `NavItem` already carries a `featureColor` string like `'text-feature-platform'`, `'text-feature-fieldops'`, etc.
- The current `onMouseEnter` handler only brightens the text to white — no colored glow.
- **Fix:** Add a per-item neon `boxShadow` + background tint on `onMouseEnter`, keyed off `featureColor`.
- A small helper map translates `featureColor` → an RGBA shadow value using the corresponding CSS variable color, e.g. `text-feature-fieldops` → `rgba(134,239,172,0.25)` glow.

**2. MobileTabNav tabs** — `src/components/ai/chat/MobileTabNav.tsx`
- Each tab button has a `featureColor` (Tailwind class like `text-feature-quotes`).
- On hover, we add a `filter: drop-shadow()` or a `textShadow` matching the icon color, plus a subtle `background`.
- Since these are Tailwind-driven, we add a CSS utility in `src/index.css` using the already-defined `--feature-*` variables.

**3. QuickActionGrid buttons** — `src/components/ai/chat/QuickActionGrid.tsx`
- Buttons with `featureColor` classes on their icons.
- On hover (currently `hover:opacity-90 hover:border-primary/50`), add a colored border and box-shadow matching `featureColor`.
- Since we can't do per-color dynamic Tailwind without purging, we'll use inline style `onMouseEnter`/`onMouseLeave` with a color map.

**4. FloatingInput action buttons** (Home, Send, Mic) — `src/components/ai/chat/FloatingInput.tsx`
- Send button: add cyan glow on hover (`rgba(0,229,255,0.4)`).
- Home/Mic buttons: add a soft white→cyan glow.

**5. GlassHeader action buttons** (Phone, Mic, ArrowLeft) — `src/components/ai/chat/GlassHeader.tsx`
- Buttons currently have `hover:bg-white/20`. Add `transition` + a subtle cyan drop-shadow on hover via a CSS class.

---

### Technical Implementation

#### A. CSS utilities added to `src/index.css`
Add a new section of `.btn-feature-*` hover glow utilities for each feature color. Also add a generic `.btn-hover-glow` for simple cyan hover cases.

```css
/* Button hover glows — one class per feature area */
.btn-hover-glow-cyan:hover          { box-shadow: 0 0 14px hsl(var(--feature-platform)/0.55); ... }
.btn-hover-glow-fieldops:hover      { box-shadow: 0 0 14px hsl(var(--feature-fieldops)/0.55); ... }
/* ... etc for each feature color ... */
```

But because the `featureColor` prop is already a Tailwind text class (`text-feature-quotes`), a cleaner approach is to add CSS utilities that cover the `group-hover` pattern. The simplest approach that requires no new Tailwind config changes is **inline style helpers in the components**, similar to how the homepage works.

#### B. Inline approach (matches existing homepage pattern)

**`DashboardLayout.tsx` sidebar buttons** — Add to `onMouseEnter`:
```ts
const featureGlowMap: Record<string, string> = {
  'text-feature-overview':      '189,100%,65%',
  'text-feature-config':        '221,100%,65%',
  'text-feature-platform':      '189,100%,55%',
  'text-feature-fieldops':      '84,100%,55%',
  'text-feature-customers':     '38,100%,65%',
  'text-feature-employees':     '173,100%,55%',
  'text-feature-analytics':     '223,100%,65%',
  'text-feature-marketing':     '292,100%,70%',
  'text-feature-integrations':  '282,80%,70%',
};
// onMouseEnter: if featureColor exists, set boxShadow glow using hsl
e.currentTarget.style.boxShadow = `0 0 14px hsl(${hsl}/0.4), inset 0 0 0 1px hsl(${hsl}/0.2)`;
e.currentTarget.style.background = `hsl(${hsl}/0.06)`;
e.currentTarget.style.color = `hsl(${hsl})`;
// onMouseLeave: restore original
```

**`MobileTabNav.tsx` tab buttons** — Add `onMouseEnter`/`onMouseLeave` with the same glow map, applied to icon + text color as well as the button's `filter: drop-shadow(0 0 6px hsl(...))`.

**`QuickActionGrid.tsx` action buttons** — Same inline approach. The `featureColor` prop is already available on each action.

**`FloatingInput.tsx`** — Send button gets `hover:shadow-[0_0_14px_rgba(0,229,255,0.5)]` via inline style on `onMouseEnter`. Home/Mic get a soft cyan glow.

**`GlassHeader.tsx`** — Buttons get `transition-all duration-200` + cyan drop-shadow on `onMouseEnter`.

---

### Files to modify
1. `src/components/dashboard/DashboardLayout.tsx` — sidebar nav button hover logic
2. `src/components/ai/chat/MobileTabNav.tsx` — tab button hover glow
3. `src/components/ai/chat/QuickActionGrid.tsx` — quick action button hover glow
4. `src/components/ai/chat/FloatingInput.tsx` — send/home/mic button hover glow
5. `src/components/ai/chat/GlassHeader.tsx` — header icon button hover glow

### What stays the same
- All active/selected states remain unchanged
- All existing transition animations unchanged
- No new packages or Tailwind config changes needed
- The glow colors are sourced directly from the already-defined `--feature-*` CSS variables, ensuring consistency with the rest of the platform
