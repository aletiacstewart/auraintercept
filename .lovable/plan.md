
## Mockup: "Cyber-Sentry" Console UI Concept

The user wants a new standalone mockup page that demonstrates the sci-fi / cyberpunk SOC (Security Operations Center) aesthetic shown in the reference image — deep obsidian backgrounds, neon cyan glows, glassmorphism panels, animated elements, and a three-column command layout. This is a **new page** (not modifying existing consoles), serving as a visual concept/prototype.

### What to Build

A new route `/dashboard/cyber-sentry-mockup` with a full self-contained demo page showing:

```
┌────────────────────────────────────────────────────────────────┐
│  [NEON HEADER] AURA INTERCEPT  ●  CYBER-SENTRY COMMAND CENTER  │
│  border-t-2 border-cyan-400/60  +  scanline texture overlay    │
├──────────────────┬──────────────────┬──────────────────────────┤
│  LEFT PANEL      │   CENTER STAGE   │    RIGHT PANEL           │
│  "Event Stream"  │  Aura Shield     │  "System Metrics"        │
│                  │  (hexagon glow)  │                          │
│  Glass pane      │  98% Secure      │  4x Circular gauges:     │
│  scrolling live  │  pulsing rings   │  · System Health         │
│  event log items │                  │  · Agent Velocity        │
│  with colored    │  Animated neural │  · Threat Index          │
│  timestamps      │  network nodes   │  · Uptime                │
│                  │  (SVG lines)     │                          │
│  Color-coded     │  Data wave       │  Gold accent for         │
│  by event type   │  (Recharts line) │  warnings                │
├──────────────────┴──────────────────┴──────────────────────────┤
│  BOTTOM CONTROL DOCK — grid of 12 glowing tactical icon buttons │
│  [Quote] [Invoice] [Lead] [Appt] [Inventory] [Customers] ...   │
└────────────────────────────────────────────────────────────────┘
```

### New File: `src/pages/CyberSentryMockup.tsx`

This is a fully self-contained page with:

**1. Obsidian background with dot-grid texture**
```css
background: radial-gradient(ellipse at top, #0a1628 0%, #020810 100%)
overlay: radial-gradient dot pattern at 1.5% opacity
```

**2. Neon header bar**
- `border-t-4 border-cyan-400` with `box-shadow: 0 -4px 20px rgba(0,229,255,0.5)` 
- "AURA INTERCEPT" title in monospace, cyan glow text
- Live timestamp clock (updates every second via `setInterval`)
- Blinking "LIVE" badge

**3. Left column — Event Stream panel (glassmorphism)**
- `backdrop-blur-xl bg-white/5 border border-cyan-400/20`
- 12 mock event log items with animated scroll-in
- Color-coded by type: INTERCEPT (cyan), ALERT (amber), SECURE (green), SYSTEM (blue)
- Auto-scrolling simulated feed using `useEffect` interval

**4. Center column — Command Hub**
- Large hexagon SVG with pulsing concentric ring animations (`animate-ping` style)
- "98% SECURE" large text with emerald glow
- Aura shield icon centered
- Neural network dots: 8 SVG circle nodes with connecting lines, slowly rotating
- Recharts `AreaChart` below showing "Interception Wave" — animated glowing line graph

**5. Right column — System Metrics**
- 4x circular gauge components using SVG `<circle>` stroke-dasharray trick
- Metrics: System Health (emerald), Agent Velocity (cyan), Threat Index (amber), Uptime (blue)
- Animated counter on mount (number counts up from 0)

**6. Bottom tactical dock**
- 12 icon buttons in a 6-col grid
- Each has `bg-cyan-400/5 border border-cyan-400/20` base
- Hover: full neon glow `box-shadow: 0 0 20px rgba(0,229,255,0.6)`
- Mapped to the existing console quick actions (Quote, Invoice, Lead, etc.)
- Glowing active state

**7. Animations used**
- CSS `@keyframes` in inline styles for the hex rings (scale + opacity pulse)
- SVG neural network: slow rotation with `animation: spin 20s linear infinite`
- Event feed: new items slide in from left
- Gauges: SVG stroke-dashoffset animates from 0 to value on mount
- Data wave: Recharts `AreaChart` with custom cyan gradient fill

### Route Registration

Add to `src/App.tsx` (or wherever routes are defined):
```tsx
<Route path="/dashboard/cyber-sentry-mockup" element={<CyberSentryMockup />} />
```

And add a temporary nav link or the user can navigate directly to the route.

### No existing files modified

This is purely additive — a new standalone demo page inside `DashboardLayout`. It does not touch any existing console, component, or routing logic beyond adding one `<Route>`.

### Files to create/edit:
1. **`src/pages/CyberSentryMockup.tsx`** — new, full page (~300 lines)
2. **`src/App.tsx`** — add one route line
