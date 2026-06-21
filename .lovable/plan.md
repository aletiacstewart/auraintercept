## Two fixes

### 1. Add "Personal Assistant" to every industry dropdown

The marketing/onboarding dropdowns (`IndustryDropdownPicker` on `/for-business` and `SignUp.tsx`) are built from `src/lib/businessTypeRegistry.ts`, which derives its list from `BUSINESS_TYPE_TO_PROFILE` in `src/lib/businessTypeProfileMap.ts`. Neither contains a `personal assistant` entry, so it cannot appear.

Add `personal assistant` (and the common adjacent variant `executive assistant`) to:

- `src/lib/businessTypeProfileMap.ts` → `BUSINESS_TYPE_TO_PROFILE`: map both to `PROFILE_D` (booking/intake, no field crew), matching the existing pattern used by `personal organizer` and `wedding planner`.
- `src/lib/businessTypeRegistry.ts`:
  - `BUSINESS_TYPE_CATEGORY`: assign both to `'In-Home Personal Services'` (the existing category that already groups `house sitter`, `nanny`, `personal chef`, `wedding planner`, etc., and uses the 👤 emoji).
  - `BUSINESS_TYPE_TO_PACK`: map both to `'beauty_wellness'` (the category default pack — closest existing booking-first pack; we are not creating a new industry pack here).
- Leave `BusinessTypeSelector.tsx` alone — it already has a `personal_assistant` tile in its own (separate, legacy) catalog.
- Sanity check: `BUSINESS_TYPE_GROUPS` is built off the registry, so the picker on `/for-business` and the SignUp business-type select will both pick the new entries up automatically.

### 2. Flip "100% mock data" → "100% live data" everywhere on demo surfaces, and fix the "48 hrs free" button

Per your direction: demos are NOT pre-seeded mock — every record is real data the customer enters themselves, or that a concierge specialist enters during onboarding. Nothing is simulated.

Files to update:

- **`src/components/marketing/IndustryHero.tsx`** — button copy `Try the demo (48 hrs free)` → `Start 60-Day Live Demo`. Keep the sub-line "No commitment. Full access for 60 days."
- **`src/components/marketing/IntegrationStatusPanel.tsx`**:
  - Section heading: "Every demo is 100% mock data" → "Every demo runs on 100% live data".
  - Sub-copy: "No real customers, calls, texts, emails, or charges. Everything below runs against your isolated 60-day Live Demo company." → "Every record in your 60-Day Live Demo is real data you add yourself or that a concierge specialist sets up for you during onboarding — no pre-seeded mock data, no fake customers."
  - Badge per card: `MOCK DEMO` → `LIVE`.
  - Icon/colour: switch the `AlertCircle` + muted styling to `CheckCircle2` + primary styling (i.e. drop the mock branch — treat every row as live).
- **`src/lib/demoFeatureStatus.ts`** — rewrite each row's `status` to `'live'` and rewrite each `description` to reflect live behaviour (descriptions below). Keep the `requires` lines as-is — they describe the customer's own 3rd-party accounts, which is still accurate. Rewrite `DEMO_FEATURE_DISCLAIMER` to: *"Your 60-Day Live Demo runs entirely on live data — either entered by you in-app or set up on your behalf by a concierge specialist during onboarding. Aura connects to 3rd-party providers (SignalWire, ElevenLabs, Resend, Stripe, Google, Meta/LinkedIn/TikTok) using your own accounts; usage on those providers is billed by them directly to your card."*

  New per-row descriptions (replace mock framing):
  - dashboard → "Real jobs, leads, customers, and analytics — everything you enter (or that your concierge specialist enters during onboarding) is live in your company."
  - aura_chat → "Aura answers using your real company knowledge base and books real appointments into your calendar."
  - image_gen → "Real AI-generated images saved to your company's content library, ready to publish from the Content Engine."
  - voice_inbound → "Real inbound calls hit your SignalWire number, Aura answers via your ElevenLabs voice, and every call logs to your dashboard."
  - sms_outbound → "Real SMS sends through your A2P-registered SignalWire number — auto-responders, follow-ups, and broadcasts go to real customers."
  - email → "Real email delivery through your Resend account and verified sending domain."
  - gcal → "Two-way sync with the Google Calendar you connect — events created in Aura appear on your calendar and vice-versa."
  - stripe → "Real Stripe checkout against your connected products and prices — invoices and subscriptions charge live."
  - social → "Posts publish live to the Meta / LinkedIn / TikTok / Google Business profiles you connect from the Content Engine."

- Sweep verification: `rg -n "48 hr|48hr|mock data|MOCK DEMO|Pre-seeded|isolated 60-day Live Demo company|simulated" src/ supabase/` returns zero hits after the edits (existing `seed-demo-accounts-v2` registry tool used by sales reps for the 78 canned demo accounts is **out of scope** — that's a separate platform-admin path).

## Out of scope

- The legacy 78-account sales-rep demo registry (`/dashboard/demo-seeder`, `seed-demo-accounts-v2`) is not part of the public Live Demo flow and is left untouched.
- No backend / RLS / Stripe / edge function changes are required for either fix.
