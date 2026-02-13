

## Plan: Interactive Dashboard Tutorial + AI Agent Flow Demo Video Page

### Part 1: Dashboard Tutorial (upgraded from "tour")

Instead of a simple click-through tour, this will be an interactive tutorial system that teaches users how to use each section of the platform with contextual guidance.

**How it works:**
- A "Start Tutorial" button on the Dashboard page launches the guided experience
- Each step highlights a real UI element with a spotlight overlay and shows a tutorial card with:
  - Step title and explanation of what the feature does and why it matters
  - "Try it" prompts where appropriate (e.g., "Click this menu to explore")
  - Tips and best practices
  - Progress bar and step counter
  - Next / Back / Skip buttons
- The tutorial auto-navigates between pages when needed (e.g., from Dashboard to Customer Portal)
- Progress is saved in localStorage so users can resume later
- Covers ~25-30 steps across all Command-tier features: sidebar nav groups, consoles, integrations, AI Operatives Hub, Knowledge Base, etc.
- Uses `data-tour-id` attributes on sidebar items and key UI elements for precise targeting

**New files:**
- `src/components/tutorial/DashboardTutorial.tsx` -- Main tutorial overlay controller
- `src/components/tutorial/TutorialStep.tsx` -- Spotlight overlay + tooltip card component
- `src/components/tutorial/tutorialSteps.ts` -- Step definitions (title, description, tips, target selector, route)
- `src/hooks/useTutorial.ts` -- State management hook (current step, active/paused, localStorage persistence)

**Modified files:**
- `src/components/dashboard/DashboardLayout.tsx` -- Add `data-tour-id` attributes to nav items; render `DashboardTutorial` component
- `src/pages/Dashboard.tsx` -- Add "Start Tutorial" button/card

### Part 2: AI Agent Flow Demo Page

A standalone page that visually demonstrates how the AI Receptionist (Triage agent) routes conversations to specialized agents, and how those agents serve the company, customers, and employees. This page is designed to be screen-recorded for a video.

**What it shows (animated, step-by-step flow):**

```text
Scene 1: Customer calls/chats in
   [Customer] --> [AI Receptionist]

Scene 2: AI Receptionist qualifies and routes
   [AI Receptionist] --> [Booking Agent] (scheduling request)
   [AI Receptionist] --> [Follow-up Agent] (post-service check-in)
   [AI Receptionist] --> [Dispatch Agent] (urgent service call)

Scene 3: Agent actions
   [Booking Agent] --> books appointment, notifies employee
   [Dispatch Agent] --> assigns technician, sends ETA
   [Follow-up Agent] --> sends review request

Scene 4: Who benefits
   Company: 24/7 coverage, no missed leads
   Customer: Instant service, no hold times
   Employee: Pre-qualified jobs, clear instructions
```

**Implementation:**
- New page at `/dashboard/ai-agent-demo` with a clean, presentation-friendly layout (dark background, large typography)
- Uses Framer Motion for smooth step-by-step animations
- Flow diagram with animated connection lines between agent nodes
- Auto-play mode that advances through scenes on a timer (for screen recording)
- Manual mode with play/pause/next controls
- Each scene includes a narration text panel explaining what's happening
- Minimal chrome -- designed to look great as a recorded video
- A "Download Script" button that exports the narration text as a reference

**New files:**
- `src/pages/AIAgentFlowDemo.tsx` -- Main demo page with animated flow
- `src/components/demo/AgentFlowScene.tsx` -- Individual scene renderer with animated nodes and connections
- `src/components/demo/DemoControls.tsx` -- Play/pause/next/restart controls

**Modified files:**
- `src/App.tsx` -- Add route for `/dashboard/ai-agent-demo`
- `src/components/dashboard/DashboardLayout.tsx` -- Add nav link under Platform Resources

### Part 3: Free Trial Signup Note

- Add a prominent banner on the signup form highlighting: "Your 30-day free trial includes ALL features -- all 24 AI agents, all 7 control centers, and all integrations. No credit card required."
- Style as an eye-catching gradient card with a sparkle/crown icon

**Modified files:**
- `src/pages/Auth.tsx` -- Add trial banner above or within the company signup form

### Technical Details

**Tutorial targeting mechanism:**
- Sidebar nav items receive `data-tour-id` attributes (e.g., `data-tour-id="nav-customer-portal"`)
- Tutorial engine uses `document.querySelector('[data-tour-id="..."]')` to locate elements
- When a step targets a different route, the tutorial navigates there first, waits for render, then highlights
- Spotlight effect: semi-transparent dark overlay with a CSS clip-path cutout around the target element

**Demo page animation approach:**
- Framer Motion `AnimatePresence` for scene transitions
- SVG animated paths for connection lines between agent nodes
- Staggered entrance animations for agent cards
- Auto-advance timer (configurable 5-8 seconds per scene) for recording mode
- Clean 16:9 aspect ratio container for consistent video capture

