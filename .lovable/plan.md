## Homepage grid color fix — titles match icon color, descriptions pure white

For every grid card on the homepage (`/`), set the **title** to the same color as that card's icon/border accent and set the **description** (and any small body labels) to solid `#FFFFFF`. Colored accent text (POWERED BY tags, "Agents" pills, prices, etc.) stays as-is.

### Sections & per-card title color mapping

**1. "Three Promises" grid** — `Index.tsx` lines 597–653
Already uses `o.color` per card. Change the title color:
- Never Miss a Call → `#00E5FF` (cyan)
- Fill Your Calendar → `#00E676` (green)
- Get Paid Faster → `#FFB300` (amber)
- Description: `rgba(210,225,240,0.65)` → `#FFFFFF`

**2. "24 Smart AI Agents" grid (4 console groups + agent sub-cards)** — lines 698–729
Use `rgb(${category.neonRgb})` (already defined per group):
- Customer Portal: cyan • Field & Dispatch Ops: green • Business Operations: violet • Analytics & Reports: indigo • Outreach & Sales: orange • Social Media: pink • Smart Website: teal
- Group title (line 706): change `rgba(255,255,255,0.9)` → `rgb(${category.neonRgb})`
- Sub-agent name (line 721): change `rgba(255,255,255,0.92)` → `rgb(${category.neonRgb})`
- Sub-agent description (line 723): `rgba(200,220,240,0.5)` → `#FFFFFF`

**3. Communication Channels grid (Talk to Aura / SMS / Email / Message Aura)** — lines 747–763
Add a `titleColor` per channel (matching the gradient/border):
- Talk to Aura: `#EC4899` (pink/voice)
- SMS Reminders: `#22C55E` (green)
- Email Reminders: `#0EA5E9` (sky)
- Message Aura: `#A855F7` (purple)
- Title (line 759): use `rgb(${channel.neonRgb})` (already available — just inject `color: \`rgb(${channel.neonRgb})\``)
- Description (line 760): `rgba(200,220,240,0.5)` → `#FFFFFF`

**4. 7-Console grid (Customer Portal / Field Operations / Business Management / Outreach & Sales Ops / Analytics & Reports / Social Media / Creative & Web Presence)** — referenced via `agentConsoles` (lines 161–224)
Title already has a per-console `iconColor` Tailwind class (e.g., `text-cyan-500`, `text-green-500`, `text-orange-500`, `text-purple-500`, `text-indigo-500`, `text-pink-500`, `text-teal-500`). Apply that `iconColor` to the card title. Description and feature pill labels → solid `text-white` (pills keep their colored borders/backgrounds, only the inner label goes white).

**5. Platform Features grid (12 small cyan cards)** — lines 779–797
- Title (line 792): `rgba(255,255,255,0.9)` → `#00E5FF`
- Description (line 794): `rgba(200,220,240,0.5)` → `#FFFFFF`

**6. Pricing tier cards (Aura Core / Boost / Pro / Elite)** — lines 899–1020
Tier titles already use the tier accent (teal/sky/purple/amber). Confirm; otherwise apply:
- Core: `text-teal-400` • Boost: `text-sky-400` • Pro: `text-purple-400` • Elite: `text-amber-400`
- Subtitles, "Best for…" italic line, and feature row labels: → `text-white` (was `text-card-foreground/70` and similar)
- "$X/year (Save ~20%)" lines and "Requires:" footer keep their tier color

**7. Third-Party Cost grid (Google Calendar / Resend / ElevenLabs / SignalWire / A2P 10DLC / Stripe / Social Media / Tavily)** — lines 1090–1180
Titles get the matching icon color of each card (already colored icons exist — apply same color to the title `<span>`):
- Google Calendar: `text-sky-400`
- Resend: `text-cyan-400`
- ElevenLabs: `text-purple-400`
- SignalWire: `text-emerald-400`
- A2P 10DLC: `text-orange-400`
- Stripe: `text-amber-400`
- Social Media: `text-pink-400`
- Tavily: `text-amber-400`
- All `text-white/60`, `/70`, `/90`, `/50` body labels → solid `text-white`
- Italic footer disclaimer (line 1178): `text-white/50` → `text-white`

**8. Beta callout** — lines 1052–1082
- Heading "We're in Beta!" stays warning color
- All `text-muted-foreground` body copy → `text-white`
- `text-foreground` inline emphases → `text-white`

### Files to edit
- `src/pages/Index.tsx` (all 8 sections above)
- `src/components/landing/CompetitiveDifferentiation.tsx` — section heading subtitle and stat labels: title in colored accent if applicable, descriptions/labels → solid white
- `src/components/landing/PricingComparisonTable.tsx` — `text-white/70` optional labels → `text-white` (X icons stay grey)
- `src/components/landing/LandingAIChat.tsx` & `FloatingChatWidget.tsx` — `text-muted-foreground` helper labels → `text-white`

### Out of scope
- Icon colors, border colors, gradient backgrounds — unchanged
- "POWERED BY" tags, agent-count pills, prices, "Save ~20%" lines, warning/destructive text — keep current colored treatment
- Pages other than `/`

### Verification
After the edits, re-grep the 5 files for `rgba(200,220,240` `rgba(255,255,255,0.9` `text-muted-foreground` `text-white/[5-9]` `text-card-foreground/` to confirm only intentional non-text uses remain.