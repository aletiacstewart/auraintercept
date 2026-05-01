---
name: Industry pack prompt delta aliases
description: Canonical agent → pack delta key alias map for industry context injection
type: feature
---
ai-agent-chat applies industry pack `agent_prompt_deltas` keyed by canonical agent name (e.g. `field_navigation`). Industry packs may use short keys (`route`, `triage`, `intake`). DELTA_KEY_ALIASES maps canonical → short keys:
- field_navigation → ['route', 'recurring_route']
- lead → ['triage', 'intake']
- admin / customer_journey / outreach → ['triage']

This lets recurring-route verticals (landscape, pest_control, pool_spa) reuse the existing field_navigation agent with a route delta — no new agent needed.
