
## Goal

Replace the fake "Active Agents" sidebar in the Customer Portal (`AIAgentConsole.tsx` lines 617–711) with a real **Business Info Card** showing:
- Company open/closed status (live, using today's business hours)
- Today's operating hours
- Company contact info: phone, email, address
- Available services count + short list
- Which AI assistant is currently active (single chip — not a list of internal agents)
- Session footer kept as-is (Session Status: Live, Response, Satisfaction)

## Data Already Available — No New Queries Needed

All required data is already fetched in the component:
- `company` → name, phone, email, address
- `businessHours` → use `getTodayHours()` + add `isOpenNow()` logic
- `services` → list with name + duration
- `currentAgent` + `agentInfo` → currently active AI assistant name + color

## Files to Change

**1 file only: `src/components/ai/AIAgentConsole.tsx`**

Replace lines ~617–711 (the entire left panel div) with the new Business Info Card panel.

### New Panel Structure:
```text
┌────────────────────────┐
│ ● PORTAL INFO          │
├────────────────────────┤
│  🟢 OPEN               │  ← green if open, red if closed
│  Mon–Fri 8AM – 6PM     │  ← today's hours
├────────────────────────┤
│ 📞 (555) 000-0000      │
│ ✉  hello@company.com   │
│ 📍 123 Main St          │
├────────────────────────┤
│ SERVICES (3)           │
│ • Electrical 60m       │
│ • Lighting   90m       │
│ • Outlet     45m       │
│ View All Services →    │
├────────────────────────┤
│ ACTIVE ASSISTANT       │
│ [AI Receptionist chip] │  ← tracks currentAgent live
├────────────────────────┤
│ Session Status  Live   │
│ Response        <1s    │
│ Satisfaction    98.4%  │
└────────────────────────┘
```

### Open/Closed Logic to Add:
```ts
const isOpenNow = () => {
  const today = new Date().getDay();
  const h = businessHours?.find(bh => bh.day_of_week === today);
  if (!h || h.is_closed || !h.open_time || !h.close_time) return false;
  const [oH, oM] = h.open_time.split(':').map(Number);
  const [cH, cM] = h.close_time.split(':').map(Number);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= (oH * 60 + oM) && nowMins < (cH * 60 + cM);
};
```

Services list is capped at 4 items to avoid overflow, with a "View All →" link that sets `activeTab` to `'services'`.

The "Active Agents" title and all 4 agent cards with fake numbers are fully removed and replaced with one "ACTIVE ASSISTANT" chip that tracks `currentAgent` live.
