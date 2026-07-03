## Confirmed — customer_journey has no real tools

Verified in `supabase/functions/ai-agent-chat/index.ts`:
- `AGENT_TOOLS` (line 1035+) defines `booking` (1135), `followup` (1334), `review` (1399) but **no `customer_journey` key**.
- `TOOL_KEY_MAP` (line 3973) has aliases for every other consolidated operative (social, analytics, outreach, field_navigation, business_finance) but **nothing mapping to `customer_journey`**.
- `toolKey = TOOL_KEY_MAP[agentType] || agentType` → for `customer_journey` this is `'customer_journey'` → `AGENT_TOOLS['customer_journey']` is undefined → falls through to the handoff-only default at line 4001.

Claude's diagnosis is correct. The agent can talk about booking/follow-up/review but cannot call any of the underlying tools.

## Plan

### Fix — Give `customer_journey` the union of booking + followup + review tools

`supabase/functions/ai-agent-chat/index.ts`, inside the `AGENT_TOOLS` object literal, add a new key after the `review` array (line ~1399+) so the spreads resolve to already-defined properties:

```ts
customer_journey: [
  ...AGENT_TOOLS.booking,
  ...AGENT_TOOLS.followup,
  ...AGENT_TOOLS.review,
],
```

Note: spreading `AGENT_TOOLS.booking` inside the same object literal that's defining `AGENT_TOOLS` doesn't work — the identifier isn't bound yet. Two safe options:

1. **Define the arrays as `const` first, then compose the object.** Extract `BOOKING_TOOLS`, `FOLLOWUP_TOOLS`, `REVIEW_TOOLS` as top-level `const` arrays, then reference them from both the legacy keys and the new `customer_journey` key. Cleanest but touches three existing entries.
2. **Add `customer_journey` after the object is constructed:** immediately after the `AGENT_TOOLS` declaration, do `AGENT_TOOLS.customer_journey = [...AGENT_TOOLS.booking, ...AGENT_TOOLS.followup, ...AGENT_TOOLS.review];`. Minimal diff, no restructuring of existing entries.

Recommended: **option 2** — smallest surgical change, matches the "additive, nothing about the existing legacy arrays changes" acceptance criterion.

### Optional cleanup (also included)
Add legacy aliases to `TOOL_KEY_MAP` so any straggler code calling the old names routes to the same unified set going forward:
```ts
booking: 'customer_journey',
followup: 'customer_journey',
review: 'customer_journey',
```
This is safe because after the fix, `AGENT_TOOLS.customer_journey` contains the full union — so `booking`/`followup`/`review` callers get a superset of their old tools, not less.

### Files touched
- `supabase/functions/ai-agent-chat/index.ts` — one added assignment plus 3 alias entries in `TOOL_KEY_MAP`.

### Verification
- Deploy the function, then invoke `ai-agent-chat` with `agentType: 'customer_journey'` and a message like "book me an appointment tomorrow at 2pm". Check the response `tool_calls` (or edge function logs) for `create_appointment` / `check_availability`.
- Second call with "send a review request to that customer" → expect `send_review_request` in tool_calls.
- Call once with legacy `agentType: 'booking'` → still returns booking tools (now via the alias, superset).
