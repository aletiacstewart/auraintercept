---
name: AI Auto-Translate Fallback (Layer 2)
description: Page-wide AI translation system that complements curated react-i18next strings — covers untranslated UI when locale != en
type: feature
---

## Two-layer translation architecture

**Layer 1 — Curated i18n** (react-i18next, `src/locales/{en,es}/*.json`): hand-translated strings for high-value surfaces. Use `t('key')`.

**Layer 2 — AI auto-translate fallback**: catches everything Layer 1 doesn't cover.

### Components
- `supabase/functions/translate-ui/index.ts` — batched (≤100), Lovable AI (`google/gemini-3-flash-preview`), writes results to `ui_translations` table for shared cache.
- `public.ui_translations` table — `(text_hash, target_lang)` PK, public read / service-role write.
- `src/lib/autoTranslate.ts` — sha256 keying, memory + localStorage cache, batched queue (50ms flush) calling the edge function.
- `src/hooks/useAutoTranslate.ts` — returns translated string for current language; falls back to source while loading.
- `src/components/common/T.tsx` — `<T>Save</T>` wrapper.
- `src/components/common/AutoTranslatePageObserver.tsx` — MutationObserver mounted in `App.tsx` that walks all text nodes and applies translations live when language is non-English.

### Brand terms (never translated)
`Aura`, `Aura Intercept`, `Operative(s)`, `Core/Boost/Pro/Elite`, `Launch Pricing`, `Cyber-Sentry`, `SignalWire`, `ElevenLabs`, `Tavily`, `Stripe`, `Resend`. Mirror list lives in BOTH `src/lib/autoTranslate.ts` and the edge function.

### Opt-out
Add `data-no-translate` on any element (e.g. logo, brand wordmark) to skip its subtree.

### Skipped tags
`SCRIPT, STYLE, NOSCRIPT, CODE, PRE, TEXTAREA, INPUT, SELECT, OPTION, SVG, PATH`.

### Cost
~one AI call per unique English phrase per language, ever. After first translation it lives in `ui_translations` and serves to every user globally.

### Performance
First view of an uncurated string: 200-400ms delayed (renders English, then swaps). Cached: instant (synchronous from localStorage on initial render).

### Failure mode
If edge function returns 429/402/error, original English is left in place silently.

### Toggle
`LanguageToggle` in `PublicHeader`. Authenticated users' choice persists to `profiles.preferred_language` and syncs across devices.