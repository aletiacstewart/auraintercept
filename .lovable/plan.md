# Review of your recommendations

Before executing, three important corrections from the current codebase — a fair chunk of Part A is already built. Adjusting scope so we don't re-do existing work.

**Already in place (confirmed):**
- `companies.default_language` (`en|es|auto`) and `companies.supported_languages text[]` — exist since a June migration.
- Spanish opt-in UI already exists at **Settings → AI Agent → Languages** (`AIAgentSettings.tsx`, `spanishEnabled` toggle).
- `companies.elevenlabs_voice_id_es` column already exists (not `tenant_integrations` as your prompt guessed — the ES voice override lives on `companies`).
- SignalWire phone handler (`voice-handler`) **already** registers `en-US` + `es-ES` in SWML, injects a language-switch directive into the system prompt, and localizes the greeting when default is `es`. SignalWire's AI auto-switches on caller's spoken language — no DTMF menu needed on that path.
- `voice-handler` already references `company.ai_voice_greeting_es`, but the **column doesn't exist yet** (silent null → falls back to a generic Spanish line).

**Actually missing:**
- `ai_voice_greeting_es` column on `companies` (referenced but not created).
- ElevenLabs Convai path (`elevenlabs-conversation-token`, used by browser voice + the Convai phone product) doesn't pass a language override or use the ES greeting/voice.
- No industry-specific Spanish greetings library.
- Platform's own `/blog` has zero posts; `generate-blog-content` / `generate-blog-batch` are hard-scoped to `company_id`.
- Light-mode toggle doesn't exist (Tailwind `darkMode: 'class'` is set, but no light tokens or ThemeProvider).

## Part A — Bilingual phone AI (revised)

### A1. Fill the missing column + expose ES greeting field
- Migration: add `companies.ai_voice_greeting_es text` (nullable). No other schema changes — everything else your prompt asked for already exists.
- `AIAgentSettings.tsx`: add a Spanish greeting textarea directly under the existing English greeting, visible only when Spanish is enabled. Include a "Reset to industry default (ES)" button that pulls from the new library in A3.
- Add an optional ES ElevenLabs voice picker in the same card, writing to the existing `companies.elevenlabs_voice_id_es`.

### A2. Wire language handling into ElevenLabs Convai path
- `supabase/functions/elevenlabs-conversation-token/index.ts`:
  - Also select `default_language`, `supported_languages`, `ai_voice_greeting_es`, `elevenlabs_voice_id_es` from `companies`.
  - When `supported_languages` includes `es`:
    - Append a language directive to `systemPrompt` telling the agent: *if the caller speaks or requests Spanish, continue the entire call in natural Spanish and use the Spanish greeting.*
    - When `default_language === 'es'`, swap `firstMessage` to `ai_voice_greeting_es` (fallback to a generic ES line).
  - Return a new `language` / `voiceIdEs` payload so `VoiceChat.tsx` / `AuraAvatarChat.tsx` can pass `overrides.agent.language` and `overrides.tts.voiceId` when the caller/UI locale is `es` (they already know how to send `overrides` per the bilingual-language-standard memory).
- No DTMF menu — SignalWire already handles caller-driven language on the phone path, and Convai handles it via prompt + overrides. Your Prompt A2 fallback isn't needed given current infrastructure.
- Manual verification step (post-deploy, before A3): place one real Spanish test call through the SignalWire number and one through the browser Convai widget; confirm greeting, mid-call switching, and voice quality.

### A3. Industry-specific Spanish greetings
- New `PER_INDUSTRY_ES` map in `src/lib/industryVoiceGreetings.ts` mirroring the existing 28-entry English map (natural, warm translations — not literal).
- Export `getIndustryVoiceGreetingEs(industryId, companyName)` alongside the existing helper.
- Fast Start launch step + the "Reset to industry default (ES)" button in A1 both use it to seed `ai_voice_greeting_es`.

## Part B — Platform blog generation

### B1. Add `target: 'platform'` mode
- `supabase/functions/generate-blog-content/index.ts` and `generate-blog-batch/index.ts`: accept `target: 'company' | 'platform'` (default `'company'` — no behavior change for existing customer flows).
- Platform mode:
  - Requires caller to be `platform_admin` (check `has_role`).
  - Skips company-specific enrichment (services/faqs/content profile lookups).
  - Uses an AuraIntercept-voice system prompt (concise, buyer-focused — write it once in a shared const).
  - Writes to `blog_posts` (the platform table `Blog.tsx` already reads) instead of `scheduled_blog_posts`.
  - Batch mode supports scheduled publish dates by inserting with `published = false` + a `publish_at` timestamp; add a small daily cron (`platform-blog-publisher`) that flips `published = true` when `publish_at <= now()`. Only add `publish_at` if the column doesn't already exist on `blog_posts`.
- Admin UI: new "Platform Blog" tab on `PlatformHealth.tsx` (already platform-admin gated) reusing `BlogContentWizard` / `BlogBatchWizard` with a `target="platform"` prop threaded through.

### B2. Seed initial calendar
- Using the admin wizard from B1, generate 10 posts targeting buyer intent, one per top-tier industry pulled from `mainIndustryCategories.ts`:
  - "How much a missed call costs a {industry} business"
  - "AI receptionist vs. answering service for {industry}"
  - "{industry} scheduling software: what to look for"
  - (Rotate templates across the 10 industries.)
- Schedule two per week starting the day after B1 ships.

## Part C — Light-mode toggle (scoped small)

- Tailwind `darkMode: 'class'` is already configured, but there are no light tokens and no ThemeProvider. Do NOT redesign the site.
- Scope: `Index.tsx` and `ForBusiness.tsx` only.
- Add a minimal `ThemeProvider` (no extra deps — small custom hook) that toggles `light` class on `<html>` and persists to `localStorage` with dark as default.
- Add `ThemeToggle` (sun/moon icon `Button variant="ghost"`) placed next to `LanguageToggle` in `PublicHeader.tsx` desktop + mobile.
- In `src/index.css`, define a `.light` selector overriding only the specific semantic tokens used by the two target pages (background, foreground, muted, primary glow variants). Keep neon accent tokens shared where they read fine on both; only override where contrast breaks.
- Explicitly out of scope this pass: dashboard, other public routes, marketing sub-pages. Follow-up ticket if the toggle proves used.

---

## Execution order
1. A1 → A2 → manual test call → A3
2. B1 → B2
3. C1

## Technical notes
- One migration total in Part A: `ALTER TABLE public.companies ADD COLUMN ai_voice_greeting_es text;` — no new RLS/grants needed (existing companies policies cover it).
- B1 may need one migration if `blog_posts.publish_at` doesn't exist (check first; skip if it does).
- No changes to `voice-handler` (already correct) — Part A is entirely about the Convai token function + UI.
- Reuses existing i18n, existing `overrides` pattern in Convai clients, existing wizard components.

## Out of scope
- DTMF language menus (SignalWire + Convai both handle language dynamically).
- Translating outbound SMS/reminder templates (already deferred in bilingual memory).
- Site-wide light theme beyond Index/ForBusiness.
- Automating platform blog SEO submission / social cross-post.
