

# Remove Internal Scrollbars from Dashboard Consoles

## Problem
All dashboard consoles have fixed or constrained heights (`h-[600px]`, `calc(100vh - 140px)`, `min-h-[600px]`) that create internal scrollbars instead of letting content flow naturally with the page scroll.

## Changes

### 1. `src/components/ai/chat/CyberConsoleLayout.tsx`
- Remove the fixed `height: 'calc(100vh - 140px)'` and `minHeight: '560px'` from the root container (line 138-139)
- Change `overflow-hidden` to `overflow-visible` on the root
- Remove `overflow-hidden` from the 3-column flex container (line 170)
- Remove `overflow-y-auto` from the left panel (line 174) — let it flow naturally
- Remove `overflow-hidden` from center content div (line 276)
- This affects all 5 CyberConsoleLayout-based consoles: Business Mgt, Field Ops Agent, Marketing, Social Media, Analytics

### 2. `src/components/businessops/BusinessOpsConsole.tsx`
- Change `min-h-[600px]` and `overflow-hidden` on the Card (line 38) to just `min-h-0`
- Remove `overflow-y-auto` from the content div (line 41)

### 3. `src/components/billing/BillingAgentConsole.tsx`
- Change `h-[600px]` (line 965) to `min-h-0` so it grows with content
- Remove `overflow-hidden` from CardContent (line 980)

### 4. `src/components/fieldops/FieldOpsConsole.tsx`
- Change `h-full` (line 135) to `min-h-0` on root div
- Remove `overflow-hidden` from the main content flex container (line 202)

### 5. `src/components/ui/page-container.tsx`
- Remove `overflow-hidden` and `overflow-y-auto` from the container (lines 22, 30) — the page itself (via DashboardLayout) handles scrolling

### 6. Console chat areas — preserve internal scroll only for chat message lists
- The chat message `overflow-y-auto` divs inside each console (e.g., `pb-32` scrollable areas) should keep their scroll behavior since chat threads can grow indefinitely. These will use a `max-h` instead of flex-1 overflow to cap their height while the rest of the console flows naturally.

## Technical Notes
- The `DashboardLayout` already provides page-level scrolling, so removing fixed heights lets content size naturally
- Chat message areas will retain a `max-h-[60vh]` with `overflow-y-auto` so long threads remain scrollable without forcing the entire console into a fixed box
- Left sidebar agent panels will display fully without their own scrollbar

