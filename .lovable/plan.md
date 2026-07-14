# Marketing Funnel Tracking (v1)

Add anonymous visitor funnel tracking for the public marketing site (auraintercept.ai), separate from Smart Website tracking. Data is platform-admin only.

## 1. Database + Edge Function

**Migration** — new table `public.marketing_funnel_events`:

- `id uuid pk default gen_random_uuid()`
- `session_id text not null` (client-generated, localStorage-stitched)
- `event_type text not null` with CHECK constraint restricting to: `page_view`, `chat_opened`, `chat_message_sent`, `pricing_viewed`, `pricing_expanded`, `demo_cta_clicked`, `auth_started`, `signup_completed`, `checkout_completed`
- `page_path text`, `industry text`, `tier text`
- `utm_source text`, `utm_medium text`, `utm_campaign text`, `referrer text`
- `company_id uuid references public.companies(id)` (nullable)
- `created_at timestamptz not null default now()`

Indexes: `session_id`, `event_type`, `created_at`.

GRANTs (in same migration):
- `GRANT INSERT ON public.marketing_funnel_events TO anon, authenticated` (anonymous visitors log events)
- `GRANT SELECT ON public.marketing_funnel_events TO authenticated` (SELECT gated by RLS policy)
- `GRANT ALL ON public.marketing_funnel_events TO service_role`

RLS:
- Enable RLS
- Policy `"Anyone can insert funnel events"` — `FOR INSERT WITH CHECK (true)` (mirrors `site_visitor_logs`)
- Policy `"Platform admins can view funnel events"` — `FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))`

**Edge function** `supabase/functions/log-funnel-event/index.ts`:

Modeled directly on `log-site-event`. `verify_jwt = false` (default). Uses service-role client for insert. Validates `event_type` against allowlist matching CHECK constraint. Caps strings (session_id 64, page_path 300, industry/tier 64, utm_* 128, referrer 300). Returns `{ ok: true }`. Full CORS headers on every response including errors.

## 2. Client Helper

**`src/lib/funnelTracking.ts`** — exports:

- `type FunnelEventType` union matching the 9 allowlisted values
- `trackFunnelEvent(eventType, meta?: { industry?; tier?; pagePath? })`

Behavior:
- Get-or-create `aura_funnel_session_id` in localStorage via `crypto.randomUUID()`
- On first event of a session (guarded by `aura_funnel_attribution_captured` flag in localStorage), capture UTM params from `window.location.search` + `document.referrer`; include on that event only. Subsequent events omit them so late navigation can't overwrite attribution.
- POST to `${VITE_SUPABASE_URL}/functions/v1/log-funnel-event` with `Authorization: Bearer VITE_SUPABASE_PUBLISHABLE_KEY` header (same pattern as `LandingAIChat`)
- Fire-and-forget: `try/catch`, `console.debug` on failure, never throws

## 3. Instrumentation

Wire `trackFunnelEvent` at exactly these points, each wrapped so it can't throw or block:

| File | Event | Trigger |
|---|---|---|
| `src/pages/Index.tsx` | `page_view` | `useEffect` empty deps on mount, `pagePath: '/'` |
| `src/pages/ForBusiness.tsx` | `page_view` | mount + on `industry` change (use ref to avoid double-firing initial default) |
| `src/pages/ForBusiness.tsx` | `demo_cta_clicked` | first line of existing `startLiveDemo`, before `navigate(...)` |
| `src/pages/ForBusiness.tsx` (pricing section) | `pricing_viewed` | IntersectionObserver on pricing section wrapper, fire once |
| `src/pages/ForBusiness.tsx` (pricing section) | `pricing_expanded` | in "Compare all plans" toggle handler when opening |
| `src/components/landing/LandingAIChat.tsx` | `chat_opened` | first time component becomes visible/active (mount guard) |
| `src/components/landing/LandingAIChat.tsx` | `chat_message_sent` | inside `handleSubmit`, only for user-sent messages |
| `src/components/landing/FloatingChatWidget.tsx` | `chat_opened` | when visitor manually opens widget; skip auto-open (timer-triggered) |
| `src/pages/Auth.tsx` | `auth_started` | mount, only if `mode === 'company'` && `tab === 'signup'`, with `tier`/`industry` from searchParams |
| `src/pages/Auth.tsx` | `signup_completed` | success branch of company-signup submit handler, after account+company created, with `tier`/`industry` |
| `src/pages/Subscription.tsx` (or wherever `success=true` is read) | `checkout_completed` | on mount when `searchParams.get('success') === 'true'`, guarded with a `useRef` so it only fires once |

## 4. Admin Funnel Dashboard

**`src/hooks/useFunnelAnalytics.ts`** — new read-only hook. Accepts `{ startDate, endDate }`. Queries `marketing_funnel_events` and returns:

- `stageCounts`: distinct `session_id` counts reaching each stage (a session "reaches" stage N if it has that event **or any later event** in the funnel order)
- `conversionRates`: pct between consecutive stages
- `byIndustry`: same stage counts split by `industry`, top 10 by volume
- `byAttribution`: session counts grouped by `utm_source`, with sessions lacking UTM bucketed as `(direct)` or by hostname of `referrer`

Stage order: `page_view → chat_opened → pricing_viewed → demo_cta_clicked → auth_started → signup_completed → checkout_completed`.

**`src/pages/Analytics.tsx`** — add a new `"Signup Funnel"` tab (icon: `Filter` or `TrendingDown` from lucide). Visible only when `userRole === 'platform_admin'` (same guard pattern already in the file).

Tab renders:
- Date-range picker matching the existing pattern in Analytics.tsx (default: last 30 days)
- Funnel chart (bar/step) using the existing charting lib (recharts, based on other Analytics components) — no new deps
- Consecutive-stage conversion % labels
- Industry breakdown table (top 10)
- Attribution panel: sessions by `utm_source` with `(direct)`/referrer fallback

Reuse existing card/table primitives from `@/components/ui/*`. Read-only, minimal polish — internal ops view.

## Technical Notes

- Session stitching is localStorage-based and approximate by design (cross-device / cleared storage = lost thread). Acceptable v1 tradeoff.
- `checkout_completed` is client-side redirect-fired, not a Stripe webhook. Good enough for funnel shape; if it ever drifts from Stripe revenue, upgrade to a `checkout.session.completed` webhook that also inserts into this table server-side.
- Landing pages are unauthenticated → the tracker POSTs with the publishable anon key; edge function inserts with service role to satisfy RLS reliably.
- `aura_funnel_attribution_captured` flag prevents later same-session navigations (without UTM params) from clobbering original attribution.
- Do NOT add `chat_auto_opened` yet — spec says default to skipping auto-opens; leaves ALLOWED_TYPES clean.

## Files touched

Create:
- `supabase/migrations/<ts>_marketing_funnel_events.sql`
- `supabase/functions/log-funnel-event/index.ts`
- `src/lib/funnelTracking.ts`
- `src/hooks/useFunnelAnalytics.ts`

Edit:
- `src/pages/Index.tsx`
- `src/pages/ForBusiness.tsx`
- `src/components/landing/LandingAIChat.tsx`
- `src/components/landing/FloatingChatWidget.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Subscription.tsx` (or verified checkout-success page)
- `src/pages/Analytics.tsx`
