## Goal
Make the entire Aura platform Spanish-ready using a two-layer translation system: hand-curated react-i18next strings for high-value surfaces + an AI auto-translate fallback for everything else. No DOM-mutating third-party widget. Real `/es` URLs, brand-safe terms, works with PDFs/SMS/email.

## Architecture

### Layer 1 — Curated i18n (react-i18next, already installed)
Expand the existing 6 JSON namespaces and convert hardcoded strings to `t('key')` on the highest-value surfaces only:
- Public marketing + auth (landing, pricing, audit, contact, signup, login, legal)
- Top dashboard chrome (sidebar, header, role nav, command center hero)
- Billing & subscription pages, trial banners
- Customer portal (booking, status, receipts)
- Transactional email/SMS templates (edge-function side)

Brand-locked terms never translated: "Aura", "Aura Intercept", "Operative", "Boost", "Core", "Pro", "Elite", tier prices, "Launch Pricing".

### Layer 2 — AI auto-translate fallback (everything else)
A `<TranslatedText>` wrapper + `useAutoTranslate(text)` hook for deep console pages we don't manually translate. When locale = `es` and no curated key exists:
1. Check `localStorage` cache → instant
2. Check `ui_translations` table (shared cache across users) → ~50ms
3. Call new `translate-ui` edge function (Lovable AI Gateway, `google/gemini-3-flash-preview`) → ~300ms, then write to both caches

Brand-locked terms passed in a "do not translate" list in the system prompt.

### New database
`ui_translations` table:
- `text_hash` (text, PK part) — sha256 of source string
- `source_lang` (text, default 'en')
- `target_lang` (text)
- `source_text` (text)
- `translated_text` (text)
- `created_at` (timestamptz)
- Public read (RLS), service-role write only. GRANTs included.

### New edge function
`supabase/functions/translate-ui/index.ts` — batched (up to 50 strings/request), uses `LOVABLE_API_KEY`, returns `{ hash → translated }`. `verify_jwt = false` (public, cached, low risk).

### Routing & SEO
- Add `/es` prefix routes mirroring key public pages (landing, pricing, audit, contact, auth).
- `<html lang>` updates with locale.
- `hreflang` alternate tags on public pages.
- LanguageToggle persists to localStorage + URL.

## Scope of work (this implementation)

1. **DB migration** — `ui_translations` table + RLS + GRANTs.
2. **Edge function** — `translate-ui` (batched, cached, brand-locked terms).
3. **Frontend infra**
   - Extend `LanguageContext` with `/es` URL sync + `<html lang>` updater.
   - Add `useAutoTranslate(text)` hook (cache → DB → edge function).
   - Add `<T>` component (drop-in wrapper that auto-translates children text).
   - Brand-term denylist constant.
4. **Curated translations** — expand existing `es/*.json` namespaces to cover:
   - `common` (buttons, nav, errors, time/date)
   - `landing`, `pricing`, `auth`, `legal`
   - `dashboard` chrome (sidebar groups, header)
   - `billing` (trial banner, subscription, upgrade prompts)
   - `customer-portal`
5. **Convert highest-value components to `t()`** (≈40 files):
   - Sidebar, AppHeader, role nav, LanguageToggle
   - Landing pages: Index, ForBusiness, Contact, Auth, Subscription, Pricing table, Audit
   - Trial banner, subscription cards, billing prompts
   - Customer portal pages
6. **Auto-translate the rest** — wrap deep console page roots in `<AutoTranslateProvider>` so any uncurated text passes through Layer 2.
7. **Transactional content (email/SMS)** — pass `locale` into existing send functions; switch templates based on customer's `preferred_language` (already on profiles).
8. **Toggle UX** — global header `LanguageToggle` (EN | ES) wired to context; reflects in URL on public pages.

## Out of scope (explicit)
- Manual translation of every deep console string (auto-translate covers it).
- Translating PDFs already generated — only new PDF generations honor locale (separate follow-up if needed).
- Third-party admin tools or external SaaS dashboards.

## Technical details (for reference)

- **Caching keys**: `tx:${sha256(text)}:es`
- **Edge function input**: `{ texts: string[], target: 'es' }` → `{ results: Record<hash, translation> }`
- **Brand denylist** lives in `src/lib/brandTerms.ts` and is sent to AI in system prompt.
- **Hook batching**: `useAutoTranslate` collects strings within a 50ms tick and sends one batched request per render flush.
- **Performance**: First view of an uncurated page ~300ms slower; cached views are instant. Curated pages have zero overhead.
- **Cost**: ~0.0001¢ per translated string, one-time per phrase across all users (shared DB cache).
- **Failure mode**: If edge function errors or rate-limits (429/402), render original English silently and log.

## Acceptance
- Toggle EN↔ES in header flips entire visible UI within 1s on cached pages, 1–2s first time.
- `/es/pricing`, `/es/audit`, `/es/contact`, `/es/auth` render fully Spanish with correct `<html lang="es">` and `hreflang`.
- Brand terms ("Aura", tier names, "Operative") remain unchanged in Spanish.
- Customer with `preferred_language='es'` receives Spanish SMS/email.
- No DOM errors in Radix dialogs, dropdowns, or toasts.
