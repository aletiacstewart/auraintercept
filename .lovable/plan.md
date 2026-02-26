
## New Mockup: Customer Portal Console — Cyber-Sentry Edition

The user wants a second mockup page that shows what the **Customer Portal Console** specifically would look like if it adopted the Cyber-Sentry design language. This is a new standalone page — no modifications to existing files except adding one route.

### What the Customer Portal Console actually contains (from AIAgentConsole.tsx):
- **GlassHeader** with company name, logo, online status badge
- **MobileTabNav** with tabs: AI Assistant, Services, Appointments, Voice AI, Contact, Hours
- **Chat area** with AI message bubbles (user right, agent left)
- **Quick Action Bar** — action buttons: Schedule, Quote, Emergency, Feedback, Review, Billing, Track
- **FloatingInput** — text input at the bottom
- **WelcomeScreen** — shown before first message
- Right-side agent info panel showing which AI agent is active (Triage, Booking, Follow-up, Review)

### New file: `src/pages/CyberSentryPortalMockup.tsx`

This translates ALL of those real portal elements into the Cyber-Sentry aesthetic:

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: [Hex logo] ACME HOME SERVICES ▸ CUSTOMER PORTAL  [LIVE][clock]│
│  border-top: 3px neon cyan  |  glassmorphism bg                     │
├──────────────────┬─────────────────────────────┬────────────────────┤
│  LEFT PANEL      │   CENTER: CHAT INTERFACE    │  RIGHT PANEL       │
│  "Active Agents" │                             │  "Quick Actions"   │
│                  │  [Tab row: AI/Services/      │                    │
│  4 agent cards:  │   Appointments/Voice/        │  7 glowing         │
│  · AI Receptionist│  Contact/Hours]             │  action buttons:   │
│  · Scheduling    │                             │  · Schedule Appt   │
│  · Follow-up     │  Chat bubbles in dark        │  · Get a Quote     │
│  · Review Agent  │  obsidian glass pane         │  · Emergency       │
│                  │  User messages: right-align  │  · Feedback        │
│  Each card:      │  cyan accent border          │  · Leave Review    │
│  name, status    │  Agent messages: left-align  │  · Track Appt      │
│  badge (online/  │  emerald accent border       │  · Billing/Invoice │
│  standby)        │                             │                    │
│                  │  [WelcomeScreen style:        │  Each button:      │
│  ALSO:           │   hex shield, welcome text,  │  icon in glow      │
│  Session data    │   "How can I help?" prompt]  │  badge container + │
│  mini stats:     │                             │  neon hover glow   │
│  · Session: Live │  [Floating input bar:]       │                    │
│  · Response: <1s │  glass input + send button   │                    │
│  · Satisfaction  │  with neon cyan glow         │                    │
└──────────────────┴─────────────────────────────┴────────────────────┘
```

**Tab row** (center, above chat): AI Assistant | Services | Appointments | Voice AI | Contact | Hours — styled as glowing pill tabs with active cyan highlight.

**Left panel — "Active Agents":**
- 4 cards for the 4 Customer Engagement agents
- Each: icon, name, status dot (green=active, amber=standby)
- Bottom: session stats (Response time, Messages handled, Satisfaction)
- Glassmorphism `bg-white/3 border-cyan-400/15`

**Center — Chat area:**
- Tab bar in neon pill style
- Shows simulated chat thread:
  - WelcomeScreen: hex shield icon, "AURA CUSTOMER PORTAL", subtitle, agent greeting message
  - 3-4 mock chat bubbles: user (right, cyan-tinted glass) + agent (left, indigo-tinted glass)
- Agent typing indicator (3 pulsing dots)
- Bottom: floating input (`backdrop-blur`, `border-cyan-400/30`, cyan glow on focus)

**Right panel — "Quick Actions":**
- 7 action buttons mapped to real portal actions
- Each: icon wrapped in `bg-[color]/10 border-[color]/20` badge container
- Button label below icon
- Hover: `box-shadow: 0 0 20px [color]60` neon glow

**Colors used for Quick Actions:**
- Schedule: cyan `#00e5ff`
- Quote: indigo `#6366f1`
- Emergency: amber `#f59e0b`
- Feedback: emerald `#10b981`
- Review: pink `#ec4899`
- Track: blue `#3b82f6`
- Billing: purple `#a855f7`

**Inline CSS keyframes** (same `pulse-ring`, `blink`, `slide-left` plus new `typing-dot` for the 3-dot animation).

**No live data** — all mock/static data to demonstrate the visual. No Supabase calls needed.

**Route:** `/dashboard/cyber-sentry-portal-mockup`

### Files to create/edit:
1. **`src/pages/CyberSentryPortalMockup.tsx`** — new, ~280 lines, fully self-contained
2. **`src/App.tsx`** — add one route line

### What does NOT change:
- `AIAgentConsole.tsx` — untouched
- `CustomerPortalConsole.tsx` — untouched
- All existing routes and consoles — untouched
