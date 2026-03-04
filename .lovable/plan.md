
## Three Console Fixes

### Issue 1 — Consoles require scrolling
**Root cause:** `CyberConsoleLayout` has a fixed `h-[600px]` on line 130. When the console is rendered inside a dashboard page, this height is too small and the inner content overflows, forcing scroll at the page level. The fix is to make the layout fill the available viewport height instead of being fixed at 600px.

**Fix:** In `src/components/ai/chat/CyberConsoleLayout.tsx` line 130, change `h-[600px]` to `h-full min-h-0` and ensure the wrapping pages/containers also stretch. The console pages use `DashboardLayout` → `PageContainer` wrappers — those need `h-full` flow-through too.

Check the page wrappers:
- `src/pages/BusinessMgtOps.tsx` (or similar) renders `BusinessOpsAgentConsole`
- Same for FieldOps, Marketing, Analytics, Social console pages

The console itself needs `h-full` so it fills the parent. The parent dashboard page content area needs `flex-1 flex flex-col` to stretch.

**Changes:**
- `CyberConsoleLayout.tsx` line 130: `h-[600px]` → `h-full`
- Each console page that wraps the `<XAgentConsole />` component needs its container to be `flex-1 flex flex-col h-full`

---

### Issue 2 — "How To Use" text not showing
**Root cause:** `AgentHowToGuide.tsx` at line 1005 — the `Card` component has `bg-white text-foreground` hardcoded. Since the entire app uses `class="dark"` on the `<html>` element (Cyber-Sentry design standard), `text-foreground` in dark mode resolves to near-white, and `bg-white` is fine for labels — BUT the inner text elements at lines 1016-1017 use `text-foreground` and `text-muted-foreground`. In dark mode on a white card background, `text-muted-foreground` typically becomes very light/white text on a white card — invisible.

**Fix:** The card already has `bg-white` forced. The text classes need explicit dark colors to be visible on the white background:
- Line 1016: `text-foreground` → `text-gray-900`
- Line 1017: `text-muted-foreground` → `text-gray-500`
- Same for description text at line 1017
- Step title at 1035: `text-foreground` → `text-gray-900`
- Step description at 1036: `text-muted-foreground` → `text-gray-500`
- Tips header at 1044: `text-muted-foreground` → `text-gray-600`
- Tip items at 1047: `text-muted-foreground` → `text-gray-500`
- Guide header label at 994: `text-muted-foreground hover:text-foreground` — needs explicit colors too

Also the trigger button (lines 985-996) uses `text-muted-foreground` which in dark mode = near-white on the dark background, which should be fine. But when `isOpen=false`, it has `"text-muted-foreground hover:text-foreground"` — this is visible on dark bg. The cards themselves need explicit light text on white background.

---

### Issue 3 — Active Agents not highlighting when tab icon is clicked
**Root cause:** In `CyberConsoleLayout.tsx` line 179, the `isActive` condition for agent card highlighting is:
```ts
const isActive = agent.status === 'active' && (currentAgentId === agent.id || (!currentAgentId && idx === 0));
```

This means only agents with `status === 'active'` can highlight. All other agents are permanently `'standby'` in the static arrays, so only the first "active" agent ever highlights.

In `BusinessOpsAgentConsole.tsx` line 257, `currentAgentId={currentAgent || lastAgent}` is passed — this is the AI chat agent type (e.g., `'quoting'`, `'invoicing'`), not the tab id. When the user clicks the `invoice` tab, `currentAgent` stays as `'quoting'` (the chat agent) and the invoicing agent card doesn't highlight because its `status` is `'standby'`.

**Fix:** Two changes needed:
1. In `CyberConsoleLayout.tsx`, update the `isActive` logic to highlight whichever agent matches `currentAgentId` regardless of their `status` field:
   ```ts
   const isActive = currentAgentId === agent.id || (!currentAgentId && idx === 0 && agent.status === 'active');
   ```
2. In `BusinessOpsAgentConsole.tsx`, map the `activeTab`/`activeFormType` to the correct agent ID:
   - tab `quote` → agent `quoting`
   - tab `invoice` → agent `invoicing`  
   - tab `lead` → agent `leads`
   - default/chat → `currentAgent || lastAgent`
   Pass this mapped value as `currentAgentId`.

3. In `FieldOpsAgentConsole.tsx` (line 997), `currentAgentId` is hardcoded as `activeTab === 'chat' ? 'dispatch' : null` — map tab to the correct agent ID instead:
   - `accept`, `enroute`, `eta`, `arrive`, `complete` → `dispatch`
   - `directions` → `route`
   - When null → `dispatch`

Similarly for `MarketingSalesAgentConsole` and `AnalyticsAgentConsole`.

---

### Files to change
1. `src/components/ai/chat/CyberConsoleLayout.tsx` — height fix + agent highlight logic
2. `src/components/ai/chat/AgentHowToGuide.tsx` — fix text color on white cards
3. `src/components/billing/BusinessOpsAgentConsole.tsx` — map activeTab to correct agent ID
4. `src/components/employee/FieldOpsAgentConsole.tsx` — map activeTab to correct agent ID
5. `src/components/marketing/MarketingSalesAgentConsole.tsx` — same agent mapping fix
6. `src/components/analytics/AnalyticsAgentConsole.tsx` — same agent mapping fix
7. Console page wrappers (DashboardLayout pages) — ensure `h-full` flow for Issue 1

Let me check the console page wrappers and marketing/analytics consoles briefly to complete the picture.

**For Issue 1 height — approach:**
Rather than touching every page, the simplest targeted fix is:
- Change `CyberConsoleLayout` from `h-[600px]` to use `min-h-[600px] h-[calc(100vh-200px)]` which gives it a responsive height that fits the viewport without requiring scroll, while still having a minimum.
- This avoids touching every parent container.

This is the cleanest single-file fix for Issue 1.
