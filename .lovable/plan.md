## Goal

Make the `/dashboard/architecture` diagrams feel like the Cyber-Sentry consoles — high-tech, glowing, animated — instead of plain dark Mermaid renders.

## Approach

Keep Mermaid as the diagram engine (so all 9 charts and the download pipeline keep working), and layer Cyber-Sentry styling + motion **on top** of the rendered SVG. No diagram content changes.

### 1. Cyber-Sentry theme for Mermaid (`src/components/architecture/MermaidDiagram.tsx`)

- Switch `mermaid.initialize` `themeVariables` to use CSS theme tokens via `hsl(var(--…))` only (per Cyber-Sentry rule, no raw hex/rgba in component output). Background becomes `hsl(var(--card))`, lines `hsl(var(--primary) / 0.6)`, node fill `hsl(var(--muted))`, borders `hsl(var(--primary))`, text `hsl(var(--foreground))`.
- Wrap the diagram container in a Cyber-Sentry frame: gradient border, soft inner glow, subtle scanline overlay, and a corner "uptime chip" badge showing the diagram id (matches existing console headers).
- Background gets the existing `bg-grid` / radial-glow pattern used by consoles (reuse the same Tailwind utility already in `index.css`; no new tokens).

### 2. Tier classDef → glow palette

Replace the flat `fill: …` classDefs (`core`/`boost`/`pro`/`elite`/`system`/`external`/`entry`) with stroke-led styles that read as neon chips:
- `fill: hsl(var(--card))`
- `stroke: hsl(var(--<tier-token>))` at 2.5px
- `color: hsl(var(--foreground))`
- Drop-shadow filter applied per tier via a post-render SVG pass (see §3) — Mermaid classDef can't express `filter`, so we apply it after render.

Tier → token map (already in design system): core→`primary`, boost→`accent`, pro→`secondary`, elite→`warning`, system→`muted-foreground`, external→`destructive`, entry→`success`.

### 3. Post-render SVG animation pass

After `mermaid.render(...)` returns, walk the SVG once and inject:
- **Node pulse glow** — add an SVG `<filter>` (`feGaussianBlur` + `feMerge`) per tier and apply `filter="url(#glow-<tier>)"` to nodes carrying that class. Animate `stdDeviation` from 2 → 5 → 2 on a 3s loop with `<animate>` (works inside the captured SVG, so PNG/PDF still export a static glow snapshot).
- **Edge data-flow** — for each `<path class="flowchart-link">`, set `stroke-dasharray: 6 10` and animate `stroke-dashoffset` from 0 → -160 over 4s linear infinite (CSS `@keyframes architecture-dataflow` injected once). Creates the "packets travelling along the wire" look used in the consoles.
- **Entry-node ping** — entry-tier nodes get a duplicated circle behind them that scales 1 → 1.4 + fades, mirroring the console pulse rings.
- **Hover lift** — CSS rule on `.mermaid-svg g.node:hover` adds `transform: translateY(-1px)` + brighter stroke. Pointer-events stay on so existing diagram links work.

All animation CSS lives in a single `<style>` block scoped via a class on the container (`.cyber-mermaid`) — no global leak, no new index.css tokens.

### 4. Tabs + page chrome (`src/pages/Architecture.tsx`)

- Restyle the `TabsList` to match Cyber-Sentry segmented controls: dark capsule, animated underline on the active tab, soft glow on hover.
- Add a thin animated "telemetry" strip under the PageHeader (3 dots + a scanning line) — purely decorative, matches console headers.
- No layout, no tab order, no diagram changes.

### 5. Exports still work

- SVG export: animation `<animate>` tags + filters are kept inside the serialized SVG, so the downloaded SVG is animated when opened in a browser.
- PNG / PDF: `html2canvas` captures a still frame mid-pulse — already works, no change needed.
- Code export: unchanged (raw Mermaid source).

### 6. Legend

The 7-tier legend chips at the top of each diagram get the same neon-stroke + glow treatment so the legend visually matches the in-diagram nodes.

## Out of scope

- No diagram content changes (same nodes, edges, sections).
- No new tabs, no removed tabs.
- No new design tokens in `index.css` / `tailwind.config.ts` — Cyber-Sentry rule says theme vars only, and the ones we need already exist.
- No 3D / Three.js / WebGL — pure SVG + CSS so PNG/PDF export keeps working.

## Verification

After implementing, open each of the 9 tabs and confirm:
1. Nodes glow in their tier color and pulse softly.
2. Edges show animated dashed flow.
3. Tabs and header strip read as part of the Cyber-Sentry visual family.
4. SVG / PNG / PDF / Code downloads still produce files (PNG/PDF as static snapshots, SVG keeps animation).
5. No console errors, no layout shift, legend matches in-diagram colors.
