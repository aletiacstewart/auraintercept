
## Fix Homepage Pricing Section

The homepage `Index.tsx` currently shows 7 stale plan cards split across two rows — a "Start Your AI Journey" group (Aura Starter $197, Aura Connect $397, Aura Growth $597, Aura Presence $797) and a "Scale Your Operations" group (Aura Logistics $1,497, Aura Performance $497, Aura Command $697). Only the last 3 are correct. Everything else is leftover from old tiers.

The fix replaces the entire pricing cards section with a single clean **3-column grid** showing only the 3 canonical tiers.

### What changes in `src/pages/Index.tsx`

**Remove both old tier sections** (lines ~733–1136):
- Delete the `order-1` group: Aura Starter, Aura Connect (old $397), Aura Growth, Aura Presence
- Delete the `order-2` group: Aura Logistics ($1,497), and the wrapping flex/order structure

**Replace with a single 3-column grid:**

| Card | Tier | Price | Agents | Consoles | Style |
|---|---|---|---|---|---|
| 1 | Aura Connect | $297/mo | 5 AI Operatives | 4 Consoles | cyan border |
| 2 | Aura Performance | $497/mo | 7 AI Operatives | 6 Consoles | gradient primary / "Most Popular" badge |
| 3 | Aura Command | $697/mo | 10 AI Operatives | All 7 + AI Hub | amber / "Enterprise" badge |

**Fix `agentCategories` array** (lines ~93–107): Add missing `id: 'creative_web'` to the 7th entry that has no `id` field (prevents React key warning).

**Update 3rd party integration text** (line ~1177): Change old tier name references like "Connect, Growth, Presence, Logistics, Performance, Command" → "Connect, Performance, Command".

### Files
- `src/pages/Index.tsx` — pricing cards section rewrite + minor fixes
