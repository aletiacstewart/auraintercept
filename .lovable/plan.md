## Fix all 3rd-party pricing inconsistencies on landing page

All edits are copy-only in `src/pages/Index.tsx`. No business logic.

### 1. SMS Compliance block (line 1127)
- `brand registration $4 (one-time)` → `$4.50 (one-time)` (reconcile with A2P card)
- `campaign $1.50–$10/month` → `$1.50–$30/month` (Agents & Franchises use case tops at $30)
- `no SMS to a T-Mobile handset in 59+ days` → `in 60 consecutive days`

### 2. A2P 10DLC card (line 1183)
- `T-Mobile $250/mo for inactive campaigns (60+ days)` → `(60 consecutive days)`

### 3. SignalWire card (lines 1166–1174)
Add per-usage rate detail line:
- `Local number $0.50/mo · SMS $0.00415/segment · Voice $0.0066/min in / $0.008/min out · AI Agent $0.16/min`

### 4. ElevenLabs card (lines 1156–1164)
Add tier line:
- `Free 15 min/mo · Starter $5 · Creator $22 · Pro $99 · pay-as-you-go available`

### 5. Resend card (lines 1145–1154)
Add concrete tiers:
- `Free 3,000/mo · Pro $20 (50k) · Scale $90+ · overage ~$0.90 per 1,000`

### 6. Tavily card (lines 1210–1219)
Add concrete pricing:
- `Free 1,000 credits/mo · $0.008/credit overage · Project plans from ~$30/mo`

No other files touched.
