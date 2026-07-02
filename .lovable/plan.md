# Voice & Style Sheet v2 — Implementation Plan

Apply the uploaded style guide across marketing, consoles, and agent copy. Frontend/content-only — no schema or business-logic changes.

## 1. Canonical naming registry (single source of truth)

Update `src/lib/canonicalNames.ts` (create if missing; otherwise extend the existing naming registry in `.lovable/memory/architecture/canonical-naming-registry.md` + code helpers) so every surface pulls names from one place.

**Consoles — one canonical name each, used everywhere (nav, hero grid, agent grid, footer, tier cards, docs):**

| Canonical | Replace occurrences of |
|---|---|
| Customer Portal | (already consistent) |
| Service Management | (already consistent) |
| Business Operations | "Business Management" |
| Outreach & Sales | "Outreach & Sales Ops", "Outreach & Sales Console" |
| Analytics & Reports | (already consistent) |
| Social Media | "Social Media Console" (drop suffix or add everywhere — pick drop) |
| Creative & Web Presence | "Smart Website" (as a console header) |

Decision: drop the trailing "Console" from display names everywhere; keep it only in route paths.

**Agents — every unit uses `[Function] Agent`.** Sole exception: **AI Receptionist**. Purge "operative" as a per-unit label; keep it only for collective phrases ("24 AI operatives", "the operative network").

## 2. Agent card copy rewrite (jargon → foreman voice)

Update the agent registry (`src/lib/agentStyles.ts` + wherever agent descriptions live, e.g. `subscriptionAgentConfig.ts`, `industryPack` agent labels) with plain-English one-liners. Examples from the doc:

- Admin Agent → "Manages your team's logins and settings, so you control who can see and change what."
- AI Receptionist → "Answers every call, figures out what the customer needs, and either handles it or hands it straight to the right agent."
- Insights Agent → "Ask it a plain-English question about your business and get a straight answer."

Rewrite all 24 agent descriptions in the same voice: owner's language, concrete verbs, no "role-based / classifies intent / access control" spec-sheet phrasing.

## 3. Voice pillars applied to marketing pages

Sweep `src/pages/ForBusiness.tsx`, landing hero, pricing section, and console hero grids:

- Short sentences (<20 words), second person, active voice.
- Max one tactical word per sentence from {Agent, Console, Operative, Command, Deploy}.
- Replace adjectives ("powerful/comprehensive/robust") with real counts/dollars.
- Keep em-dash "here's the real reason" beat.
- No exclamation points, no "revolutionary".

## 4. Fee/trust sections — lean in harder

On pricing + integration pages (`launchPricing.ts` copy, tier cards, SignalWire/ElevenLabs/Resend blurbs, `third-party-fee-disclaimer` surfaces):

Every fee claim uses the 3-beat structure: **number → who bills it → why it protects the owner**, in ≤3 sentences. Keep phrases: "Billed by your provider — never by Aura Intercept.", "Never marked up by us.", "Your accounts. Your control. Your protection."

## 5. Structural card shapes (enforce)

- **Console card:** name → one plain sentence → 3–5 chip tags.
- **Agent card:** `[Function] Agent` name → one owner-voice sentence.
- **Tier card:** name + category line → "Best for…" → strike-through original + Beta Pricing badge → plain-count checklist → CTA. (Already close; audit for consistency.)

## 6. Files expected to change

- `src/lib/agentStyles.ts` — agent names + descriptions
- `src/lib/subscriptionAgentConfig.ts` — tier agent lists use canonical names
- `src/lib/canonicalNames.ts` (new or extended) — console + agent name constants
- `src/pages/ForBusiness.tsx` — hero, console grid, tier cards, fee sections
- `src/pages/ai-consoles/*.tsx` — page headers use canonical console names
- Sidebar/nav components rendering console labels
- `src/lib/launchPricing.ts` copy (tier taglines / "Best for" lines) if drift found
- `.lovable/memory/architecture/canonical-naming-registry.md` — updated to match
- Save a new memory: `mem://style/voice-and-copy-standard` capturing the pillars, phrase bank, and words-to-avoid so future edits stay in voice.

## 7. Out of scope

- No DB migrations, no edge functions, no schema changes.
- No changes to route paths (only display labels).
- Voice-agent prompts (`auraInterceptSalesPrompt.ts`) unchanged unless a canonical name drifts.

## 8. Verification

- Grep for stale strings: "Business Management" (as console), "Outreach & Sales Ops", "Outreach & Sales Console", "Smart Website" used as console header, "operative" as singular per-agent label.
- Load `/for-business`, `/dashboard/ai-consoles/*`, pricing section — confirm every console name matches the registry.
- Read 3 random agent cards out loud — should sound like a coworker, not a spec sheet.
