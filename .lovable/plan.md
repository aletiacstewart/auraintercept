
## What's Currently Real vs Fake

The "LIVE 17:31:00" chip in the GlassHeader IS real — it's a live clock showing the **current local time**, updating every second. It is NOT a session timer or uptime counter. There's no date shown.

The request is to:
1. Keep the current live time display
2. Add current date
3. Add a **platform uptime counter** — showing how long the company has been on the platform (from their account `created_at`)
4. These values should be available to AI agents for date/time context

---

## Plan

### 1. Fetch company `created_at` for uptime calculation

The `companies` table has a `created_at` timestamp. We'll query it via Supabase in a small hook called `useCompanyUptime(companyId)`. This returns:
- `companyCreatedAt: string | null` — the ISO timestamp from the DB
- `uptimeDisplay: string` — formatted as `"2y 4m 12d"` or `"47d 3h 22m"` for newer accounts

### 2. Update `GlassHeader.tsx`

Add a new optional prop: `companyCreatedAt?: string`

Replace the single "LIVE hh:mm:ss" chip with **two chips** in the top-right:

**Chip 1 — Date + Time:**
```
📅  TUE · JUN 03, 2025 · 17:31:04
```
One chip showing full date + live time (updates every second).

**Chip 2 — Platform Uptime:**
```
⬆ ONLINE  2y 4m 12d
```
Shows how long since the company's account was created. This gives the "how long have we been using the platform" indicator the user wants.

Both chips will only show on `sm:` and up (hidden on mobile to avoid crowding).

### 3. Update `CyberConsoleLayout.tsx`

Add `companyCreatedAt` prop and pass it through to `GlassHeader`.

### 4. Update each console (`BusinessOpsAgentConsole`, `FieldOpsAgentConsole`, `MarketingSalesAgentConsole`, `AnalyticsAgentConsole`, `SocialMediaAgentConsole`)

Each console already has `companyId`. We add `useCompanyUptime(companyId)` call and pass `companyCreatedAt` down to `CyberConsoleLayout`.

### 5. AI Agents date/time context

In the AI agent system prompt (injected in the chat hooks), append the current date and time so agents always have context:
```
Current date/time: Tuesday, June 03, 2025 at 5:31 PM (local). 
Company on platform since: January 15, 2023.
```

This is injected in `useAIAgentChat` or the equivalent hook that builds the system prompt. Searching shows the system prompts are built inside the console-specific agent hooks.

---

## Files to Change

1. **`src/hooks/useCompanyUptime.ts`** — new hook, queries `companies.created_at` by company_id
2. **`src/components/ai/chat/GlassHeader.tsx`** — update chips: date+time chip + uptime chip
3. **`src/components/ai/chat/CyberConsoleLayout.tsx`** — pass `companyCreatedAt` prop through
4. **`src/components/billing/BusinessOpsAgentConsole.tsx`** — add uptime hook + pass to layout
5. **`src/components/employee/FieldOpsAgentConsole.tsx`** — same
6. **`src/components/marketing/MarketingSalesAgentConsole.tsx`** — same
7. **`src/components/analytics/AnalyticsAgentConsole.tsx`** — same
8. **`src/components/social/SocialMediaAgentConsole.tsx`** — same
9. **AI chat hook(s)** — inject current date/time into system prompt context

### Uptime Format Logic
```ts
function formatUptime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / 86400000);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainDays = days % 30;
  if (years > 0) return `${years}y ${months}m ${remainDays}d`;
  if (months > 0) return `${months}m ${remainDays}d`;
  return `${days}d`;
}
```

### New Header Chips Layout (desktop only):
```text
[  TUE · JUN 03 · 17:31:04  ]  [⬆ 2y 4m 12d ONLINE  ]
```
