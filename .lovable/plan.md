## Simplify Pricing Plan Boxes (Homepage)

The 4 plan cards in `src/pages/Index.tsx` (lines ~915–1045) currently repeat info that's already in the Beta Sign-Up notice above them AND repeat the same agent/voice/SMS/email/chat line in two places inside each card. Trim each card to a single, distinct, scannable feature list.

### What's duplicated today
1. **Provider channels** ("Voice + SMS + Email + Web Chat (your provider accounts)") — already covered by the Beta notice's 3rd-party paragraph.
2. **Agent count + channel list in the tagline paragraph** repeats the first feature row ("X Smart AI Agents + Industry Specialists").
3. **Industry Specialists** appears as both "X Smart AI Agents + Industry Specialists" AND a separate "All Industry Specialists Included" row on Elite.
4. **"Beta Pricing" chip + strikethrough monthly + onboarding line** — onboarding strikethrough is already in the Beta notice grid; keep it on the card (still useful at point of CTA) but remove the redundant tagline.

### Per-card edits

**Aura Core**
- Remove tagline paragraph (line 929: "Voice, SMS, email & web chat handled by 8 Smart AI Agents…").
- Remove feature row: "Voice + SMS + Email + Web Chat (your provider accounts)".
- Keep: 8 Smart AI Agents + Industry Specialists · 7 Control Centers (Field Ops, Social, Analytics) · Triage + Booking + Follow-Up + Review · Creative Content + Web Presence · 10 Employee Accounts.

**Aura Boost**
- Remove tagline paragraph (line 963).
- Remove feature row: "Voice + SMS + Email + Web Chat (your provider accounts)".
- Keep: 12 Smart AI Agents + Industry Specialists · 7 Control Centers · Dispatch + Route + ETA + Check-In · Service Management + Social Media + Analytics · 25 Employee Accounts.

**Aura Pro**
- Remove tagline paragraph (line 997: "16 Smart AI Agents with social media…") — agent count already in first feature row.
- Keep: 16 Smart AI Agents + Industry Specialists · All 7 Control Centers (Business Mgmt unlocked) · Quoting + Invoicing + Inventory · Insights + Performance Agents · 50 Employee Accounts.

**Aura Elite**
- Remove tagline paragraph (line 1030: "All 10 AI Operatives with full-suite automation.") — restated by feature rows.
- Remove redundant "All Industry Specialists Included" row (merge into agent row → "24 Smart AI Agents + All Industry Specialists").
- Keep: 24 Smart AI Agents + All Industry Specialists · All 7 Control Centers + AI Hub · Priority Support + Unlimited Employees.

### Kept as-is on every card
- Tier badge, name, "Best for…" italic line
- Strikethrough monthly + sale price + Beta Pricing chip + annual line
- CTA button, See More Details toggle
- Footer line: "Platform only — providers billed separately · Onboarding: ~~$X~~ $Y (50% OFF — Beta)"

### Files
- `src/pages/Index.tsx` only. No logic, no pricing, no other surfaces touched.

### Verification
Reload `/`, confirm each card now shows ~4–5 feature rows (down from 6), no duplicate agent/channel mentions, and Beta notice above still carries the channel disclosure.
