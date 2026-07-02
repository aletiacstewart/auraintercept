## Fix: Automation, AI Operatives Hub & Knowledge Base

### 1. Confirmed: "Failed" count is independent (item 1)
`AgentWorkflowMonitor` computes `failed = events.filter(e => e.status === 'failed').length` from `ai_agent_events` — unrelated to the header's `enabledCount/totalCount`. **The "24" match is coincidental.** No code change; note only.

### 2. Confirmed: Failed workflow events are genuine (item 2)
Direct DB query on `ai_agent_events` where `status='failed'`:
- 24 total failed rows across 5 distinct days (Jan 21 → Feb 10, 2026)
- 19 `triage_handoff`, 2 `booking_handoff`, 2 `human_escalation`, 1 `triage→quoting`
- 22 of 24 rows have distinct payloads — not a logging duplication bug, just historical events sharing the same `formatDistanceToNow` bucket ("5 months ago")

**Fix:** Show an absolute date next to (or in place of) the relative "5 months ago" so historical clusters read clearly. In `AgentWorkflowMonitor.tsx`, render both `format(created_at, 'MMM d, yyyy · h:mm a')` (title) and the relative form, or add a `title` attribute tooltip. No data change.

### 3. Disambiguate the two "Operatives Active" counters (item 3)
- `AIAgentsHub.tsx` header (line 419): change `Operatives Active` → `Total Operatives Active` and keep `{enabledCount}/{totalCount}` (24/24).
- Quick Activation panel (same page, lower): change its label to `Core Operative Phases Active` (10/10). Locate and rename the label text only.

### 4. Filter Content Topics by industry (item 4 — highest value)
In `src/components/knowledge/AIContentProfileManager.tsx`:
- Refactor `DEFAULT_CONTENT_TOPICS` (currently a flat array of ~30 topics grouped by comment) into a keyed object:
  ```ts
  const TOPICS_BY_CLUSTER = {
    general: [...5 general],
    food_hospitality: [...5],
    beauty_wellness: [...6],
    personal_services: [...5],
    home_services: [...6],
  };
  ```
- Add an `INDUSTRY_TO_CLUSTER` map covering all entries in `INDUSTRY_OPTIONS` (Restaurant/Cafe/... → food_hospitality; Hair Salon/Spa/... → beauty_wellness; Coaching/Concierge/... → personal_services; HVAC/... → home_services). Already grouped in file by comments — reuse those groupings.
- Compute `visibleTopics` = `general` ∪ clusters resolved from `primaryIndustry` + `secondaryIndustries`. If nothing selected or industry maps to no cluster → show `general` only (sensible generic default).
- Render `visibleTopics.map(...)` in the checklist (line 777).
- Keep `DEFAULT_CONTENT_TOPICS` as the union of all preset topics so the "Custom Topics" filter at line 795 still correctly distinguishes user-added topics from any preset (including presets from other clusters that a saved profile may reference).
- No DB schema change; applies platform-wide because it's client-render.

### 5. Consistent "Free" pricing display (item 5)
In `src/components/knowledge/ServicesManager.tsx`:
- `getPriceDisplay(service)` (line 793): change final fallback from `prices.length > 0 ? prices.join(' + ') : '-'` to `prices.length > 0 ? prices.join(' + ') : 'Free'`.
- Also apply same fallback in the import-preview table (line 1447): replace trailing `|| '-'` with `|| 'Free'`.
- The `<DollarSign />` icon precedes the text, so the row renders `$ Free` consistently with existing rows whose `price_display` is literally `'Free'`. No data migration needed.

### Out of scope
- Deleting/deduping historical `ai_agent_events` rows (confirmed genuine).
- Reshaping the ai_agent_events table or write path.
- Changing industry pack / cluster infrastructure beyond the topic mapping above.
