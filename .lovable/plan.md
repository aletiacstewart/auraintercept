

## Plan: English / Spanish Language Toggle (Platform-Wide)

### Goal
Add a global EN/ES language toggle accessible from every dashboard and the public marketing site. Default = English. Selection persists per user (DB) or per visitor (localStorage for anonymous), and propagates to:
1. All UI strings (sidebar, buttons, headers, labels, modals, marketing pages)
2. AI chat responses (Aura text)
3. Voice agent (ElevenLabs / SignalWire)
4. AI-generated content (blog posts, social posts, SMS replies, follow-up scripts)
5. Customer-facing channels (chat widget, customer portal, missed-call SMS)

### Architecture

**Library:** `react-i18next` + `i18next` + `i18next-browser-languagedetector`. Industry standard, hooks-based, lightweight (~30 KB), already compatible with React 18 / Vite.

**Translation files:** JSON namespaces under `src/locales/`
```text
src/locales/
  en/
    common.json      (buttons, nav, sidebar)
    dashboard.json   (KPIs, console labels)
    marketing.json   (landing, pricing, audit)
    auth.json        (signup, login)
    aura.json        (command center, suggestions)
    customer.json    (customer portal)
  es/
    (mirrored structure)
```

**Persistence:**
- Logged-in users → new column `profiles.preferred_language` (`'en'` | `'es'`, default `'en'`)
- Anonymous visitors → `localStorage.aura_lang`
- Detection priority: profile → localStorage → browser navigator → `'en'` fallback

**Component:** `<LanguageToggle />` — pill switcher (EN | ES) placed in:
- `PublicHeader` (marketing site, audit, customer portal)
- `DashboardLayout` header (right side, near user menu)
- `TechnicianDashboard` mobile header
- `CustomerPortal` header

### AI / Voice / Content Propagation

| Channel | How language flows in |
|---|---|
| **Aura chat** (`ai-agent-chat`, `ai-agent-respond`) | Add `language` param → injected into system prompt: *"Respond strictly in {language}."* |
| **Voice agent** (ElevenLabs) | Pass `language` to ElevenLabs `language_code` override; switch between English + Spanish voice IDs (`elevenlabs_voice_id_es` column on `companies`) |
| **SMS auto-responder** | `language` from customer profile → prompt sets reply language |
| **Missed-call SMS** | Same as above |
| **Blog / social generator** | Generation form gets language selector (defaults to admin's preferred_language) |
| **Smart Website widget** | Reads `?lang=es` query param OR detects browser; passes to chat edge function |
| **Customer Portal** | Customer's `preferred_language` from `customer_profiles` |

### Database changes (migration)

```sql
ALTER TABLE public.profiles
  ADD COLUMN preferred_language text NOT NULL DEFAULT 'en'
  CHECK (preferred_language IN ('en','es'));

ALTER TABLE public.customer_profiles
  ADD COLUMN preferred_language text NOT NULL DEFAULT 'en'
  CHECK (preferred_language IN ('en','es'));

ALTER TABLE public.companies
  ADD COLUMN elevenlabs_voice_id_es text;  -- optional Spanish voice
```

### Edge function updates

Add `language` parameter handling (default `'en'`) to:
- `ai-agent-chat`, `ai-agent-respond`, `voice-navigator`
- `generate-blog-post`, `generate-social-content`, `publish-social-content`
- `missed-call-handler`, `sms-keyword-responder`
- `elevenlabs-signed-url` (pass `language_code` override)

### Translation strategy

**Phase 1 (this implementation):** Translate the highest-traffic surfaces — sidebar nav, dashboard headers, Aura command center, auth pages, public landing/pricing, customer portal, common buttons. ~400 strings total.

**Phase 2 (deferred):** Auto-translate remaining deep settings pages on demand using Lovable AI Gateway (`google/gemini-2.5-flash`) with a one-time batch script — generates ES JSON from EN source, committed to repo.

Hardcoded brand strings stay English ("Aura Intercept", "Aura Core", agent names, etc.).

### Files to create/edit

**Create:**
- `src/lib/i18n.ts` — i18next init, namespace loader
- `src/contexts/LanguageContext.tsx` — provider, `useLanguage()` hook with DB sync
- `src/components/common/LanguageToggle.tsx` — EN/ES pill switcher
- `src/locales/en/*.json` and `src/locales/es/*.json` (6 namespaces each)
- `supabase/migrations/[ts]_add_language_preference.sql`

**Edit:**
- `src/main.tsx` — import i18n init, wrap with `LanguageProvider`
- `src/App.tsx` — provider mount
- `src/components/layout/PublicHeader.tsx` — add toggle
- `src/components/dashboard/DashboardLayout.tsx` — add toggle in header
- `src/pages/TechnicianDashboard.tsx` — add toggle
- `src/pages/CustomerPortal.tsx` — add toggle + use customer's pref
- `src/components/dashboard/AuraCommandCenter.tsx` — translate suggestions, send `language` to `useUnifiedAura`
- `src/hooks/useUnifiedAura.ts` — pass `language` to chat edge function
- Edge functions listed above — accept + honor `language` param
- `mem://index.md` — add new memory entry for language standard

### Verification

1. Toggle on landing page → all marketing copy switches to Spanish; persists on reload (localStorage).
2. Sign in → toggle saved to `profiles.preferred_language`; survives logout/login.
3. Set ES → ask Aura "Book a job" → response in Spanish.
4. Voice call → ElevenLabs replies in Spanish (with ES voice if configured, otherwise English voice speaking Spanish).
5. Customer portal → customer with ES preference sees portal + chat in Spanish without affecting admin.
6. Generate blog → output in admin's selected language.

### Out of scope (clarify after build)

- Translating user-generated content (existing blog posts, customer messages already saved). Only NEW AI generations honor the language setting.
- Right-to-left languages, additional locales beyond ES (can be added later by dropping in new JSON namespaces).

