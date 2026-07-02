---
name: Voice & Copy Standard
description: Aura Intercept Voice & Style Sheet v2 — pillars, phrase bank, and words-to-avoid for every marketing/console/agent surface
type: design
---
# Voice & Copy Standard (v2)

## Pillars
1. **Radical fee transparency is a brand asset.** State the number, name who bills it, explain why it protects the owner — in that order, ≤3 sentences per fact.
2. **Plain sentence, cool name.** Tactical section titles ("Command Level", "Control Centers") are fine; the copy underneath drops back into plain English immediately.
3. **Agent cards speak the owner's language, not the system's.** A foreman explaining a job to a new hire — not a spec sheet.
4. **Confident, not hypey.** No exclamation points. No "revolutionary/powerful/comprehensive/robust". Use real counts and dollar figures.
5. **One tactical word per sentence** from {Agent, Console, Operative, Command, Deploy}. If a sentence has two, cut one.

## Sentence mechanics
- Short sentences, rarely over 20 words.
- Second person ("you", "your team", "your calendar").
- Active voice.
- Em-dash for the "here's the real reason" beat.
- Numbers over adjectives.

## Phrase bank (keep using)
- "So you don't have to be glued to your phone."
- "Your accounts. Your control. Your protection." (use sparingly, high-trust moments only)
- "Billed by your provider — never by Aura Intercept."
- "Never marked up by us."
- "One 24/7 workforce capturing every lead while your team is in the field."

## Words / moves to avoid
- "Operative" as a per-unit label (that's what "Agent" is for).
- "Smart Website" as a console header (use "Creative & Web Presence").
- Spec-sheet phrasing: "role-based permissions", "classifies intent", "access control", "AI-powered", "leverage", "seamless".
- Renaming shipped consoles (Business Management, Field Operations Console, Outreach & Sales Console) to invented alternates ("Business Operations", "Service Management", etc.). Use the names in `src/lib/canonicalNames.ts` verbatim.
- Piling up "Command / Control Center / Operative" in one sentence.

## Card shapes
- **Console card:** name → one plain sentence → 3–5 chip tags.
- **Agent card:** `[Function] Agent` → one owner-voice sentence.
- **Tier card:** name + category → "Best for…" → strike-through original + Beta Pricing badge → plain-count checklist → CTA.

## Source of truth
- Console + agent names/descriptions: `src/lib/canonicalNames.ts`.
- Naming registry: `mem://architecture/canonical-naming-registry`.

## Self-check before shipping copy
- Same console/agent name used everywhere?
- Would a foreman say it this way to a new hire?
- Fee claim = number + who bills + why?
- ≤1 of {Agent, Console, Operative, Command, Deploy} per sentence?
- Read aloud: person, not system log?