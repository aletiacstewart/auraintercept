## What's broken

On `/dashboard/ai-consoles/marketing-sales` and `/dashboard/ai-consoles/social-media`, the inner tabs (Home / Campaign / Leads / Marketing — and Home / Create Content / My Posts) render an empty middle panel with only the "Ask about…" input at the bottom.

## Root causes

1. **Confused tab routing.** Both consoles render their content only inside `{activeTab === 'chat' && (...)}`. The `onTabChange` handler then immediately calls a "quick action" that's supposed to set `activeTab` back to `'chat'` AND flip a `showLeadsForm` / `showContentEngine` flag. Between the two handlers there's a race in state batching that leaves `activeTab` on `'leads'` / `'create-content'` in practice, so the entire chat block (which is the only thing that renders anything) is skipped → blank body.

2. **WelcomeScreen has been gutted.** `src/components/ai/chat/WelcomeScreen.tsx` no longer renders the title / subtitle / `QuickActionGrid` — only a collapsed `AgentHowToGuide`. So even when `activeTab === 'chat'` works on the Outreach console, the Home view looks empty.

3. **Forms gated on `effectiveCompanyId`.** `{showLeadsForm && effectiveCompanyId && <LeadForm />}` silently renders nothing when there's no company id, which compounds the blank state.

## Fix

### `src/components/marketing/MarketingSalesAgentConsole.tsx`
- Drop the "tab click triggers quick action that resets to chat" pattern.
- Render content per `activeTab` directly:
  - `chat` → welcome hero + chat messages + floating input (same as today).
  - `campaign` → `<CampaignForm />`
  - `leads` → `<LeadForm />`
  - `customers` → `<CustomerSegmentsForm />`
- Keep `QUICK_ACTIONS` buttons in the welcome hero, but make them just call `setActiveTab(actionId)` (no more `handleQuickAction` indirection).
- Replace `<WelcomeScreen />` usage with an inline hero block (mirroring Social's pattern) so the body always has visible content: icon, "Outreach & Sales Console" title, subtitle, and the 3 quick-action buttons.
- When `effectiveCompanyId` is missing, show a small "Sign in to a company to use this form" placeholder instead of rendering nothing.

### `src/components/social/SocialMediaAgentConsole.tsx`
- Same refactor: render per `activeTab`.
  - `chat` → existing hero + MultiChannelGenerator.
  - `create-content` → the Brand Voice / Generate / Dashboard / Calendar `<Tabs>` block.
  - `my-posts` → `<SocialFeedQueue />`.
- Remove the `showContentEngine` / `showMyPosts` booleans (now derived from `activeTab`).
- Same "no company id" placeholder fallback.

### `src/components/ai/chat/WelcomeScreen.tsx`
- Restore the missing UI inside the inner wrapper: render `title` (h2), `subtitle` (p), and `<QuickActionGrid actions={actions} onAction={onAction} />` below the `AgentHowToGuide`. This keeps other consoles that still use `WelcomeScreen` from looking empty.

## Out of scope
- No changes to pricing, edge functions, Stripe, or the parent `MarketingSalesConsole.tsx` / `SocialMediaConsole.tsx` page shells.
- No changes to `CyberConsoleLayout` or `MobileTabNav` — they're already controlled correctly.

## Verification
- Visit `/dashboard/ai-consoles/marketing-sales`: Home shows hero + 3 quick-action buttons; clicking Campaign / Leads / Marketing tabs shows the corresponding form; Home tab returns to hero.
- Visit `/dashboard/ai-consoles/social-media`: Home shows the Create-Content hero; Create Content tab shows the 4-tab content engine; My Posts shows the feed queue.
- No console errors; no regressions in other consoles that import `WelcomeScreen`.