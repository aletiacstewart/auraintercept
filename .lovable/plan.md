## Goal

Stop seeding fake data into Live Demo accounts, kill the standalone Live Demo intake form, and route every "Try the Live Demo" CTA through the real signup page — pre-filling the chosen industry, defaulting the 60-day trial to the Elite tier, and surfacing a 3rd-party fee/cancellation notice.

## 1. Route Live Demo CTAs to real signup

**`src/pages/ForBusiness.tsx`**
- Remove `<StartDemoDialog>` mount and `demoOpen` state.
- Change every "Try Demo / Start Live Demo" handler (RolePreviewRow `onTryDemo`, hero CTA, sticky CTA) to `navigate('/auth?mode=company&tab=signup&tier=command&industry=' + industry)`.
- Update subhead copy: "60-Day Live Demo on Aura Elite — downgrade or cancel anytime before day 60."

**`src/components/marketing/StartDemoDialog.tsx`**
- Delete file (no other consumers — verified via rg).

**Other CTAs (`Index.tsx`, `IndustryHero.tsx`, `DemoAccess.tsx`, `ai-consoles/*` "Start Demo" buttons, marketing PDFs)**
- Repoint any `/demo`, `create-demo-trial` invocation, or `StartDemoDialog` trigger to the same `/auth?mode=company&tab=signup&tier=command&industry={id}` deep link.
- Leave `/demo/:trialId` (DemoAccess credentials page) intact for already-issued demo links but stop generating new ones.

## 2. Signup defaults Elite for 60-day trial

**`src/pages/SignUp.tsx`**
- When `tierParam` is absent, default `selectedTier` to `'command'` (Elite) instead of Core, only when arriving from a `?industry=` deep link (preserve existing default for organic signups — confirm with user if they want Elite as universal default).
- Keep existing industry pre-fill logic (already supported via `industryParam`).
- Under the tier selector add a callout: "Your 60-Day Live Demo runs on Aura Elite. Downgrade to Core / Boost / Pro anytime before day 60 or your card is charged Elite."
- Add a required checkbox above submit: "I understand 3rd-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social platforms) require my own accounts and card on file. All provider usage fees during the 60-Day Live Demo are billed directly to me by each provider. If I cancel Aura I am responsible for canceling these provider accounts separately." Block submit until checked.

## 3. Strip seeded data from live-demo (real signup) accounts

The "live demo" the user is talking about now == a real company created via SignUp. Those must start empty.

- **Confirm:** `SignUp.tsx` currently does NOT call `seed-demo-accounts-v2` — only `/dashboard/demo-seeder` (platform_admin) and the cron do. Verified via rg.
- **Guardrail:** add an explicit `is_demo: false` on the company insert in `SignUp.tsx` so the seed-demo job (which scopes by `is_demo = true`) can never touch it.
- **Empty-state copy:** rely on existing `IndustryEmptyState` everywhere — no changes needed; just confirm Leads/Quotes/Invoices/Customers/Inventory/Jobs surfaces render the empty state for a 0-row company (already do per memory `industry-empty-states`).
- **Sandbox `demo_trials` flow:** leave `create-demo-trial` + `DemoAccess` + `seed-demo-accounts-v2` in place for the legacy 78-account demo registry (used by sales-rep logins), but stop linking to it from public marketing. Add a banner on `/demo` route: "Public Live Demo has moved — [Start your 60-Day Live Demo →](/auth?mode=company&tab=signup&tier=command)".

## 4. Trial-end downgrade flow

**`src/pages/Subscription.tsx` + `TrialBanner.tsx`**
- During trial show: "Day X of 60 on Aura Elite. Pick your plan before day 60 or you'll be charged $3,979/mo + $1,990 onboarding."
- Surface a "Downgrade plan" button that opens the tier picker.
- No new Stripe logic — existing checkout/portal handles the downgrade.

## 5. Verification

- `rg "StartDemoDialog|create-demo-trial" src` returns only `DemoAccess.tsx`, `SuperSwitcher`, and the edge function itself.
- Manual: click every "Live Demo" CTA on `/for-business`, `/`, industry hero — all land on `/auth?mode=company&tab=signup&tier=command&industry=<id>` with industry + Elite pre-selected and the 3rd-party checkbox visible.
- Create a fresh signup, confirm dashboard renders empty states (no seeded leads/jobs/customers).
- TypeScript build passes.

## Out of scope

- Pricing values, Stripe price IDs, RBAC, schema changes.
- The legacy 78-account demo registry at `/dashboard/demo-seeder` (sales-rep tool) stays as-is.
- Auto-downgrade at day 60 — user picks manually; if no action, existing Stripe billing kicks in at Elite (matches current behavior).

## Open question

Should Elite be the default tier for **all** organic signups too (anyone hitting `/auth?tab=signup` with no `?tier=`), or only when arriving from a Live Demo deep link? Current plan: only deep-link path defaults to Elite. Confirm if you want it universal.
