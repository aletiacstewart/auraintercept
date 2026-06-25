
## Problem

The project's `STRIPE_SECRET_KEY` is currently for a sandbox account named **"Ai Bot Company sandbox"** (`acct_1SekovJ9fo9y8fGH`), not for the real **Aura Intercept** account (`acct_1StvIGEGn9AqCo3E`) shown in your screenshot. Every checkout, subscription check, customer-portal call, and onboarding fee charge is being routed to the wrong Stripe account.

The 8 price IDs hardcoded in the codebase (4 subscription tiers + 4 onboarding fees) only exist in the wrong sandbox account, so they will 404 the moment we point at the correct account.

## Plan

### Step 1 — You: get a Stripe secret key from the real Aura Intercept account
From the screenshot you're already on `dashboard.stripe.com/acct_1StvIGEGn9AqCo3E/apikeys`. The "Active 0" panel shows you have **no secret key created yet** on this account.

Decide which mode to launch with:
- **Test mode (recommended first)** — top of the dashboard, click **"Switch to sandbox"** (or the test-mode toggle), then create a **Secret key** starting with `sk_test_...`. Use this until live payments are ready.
- **Live mode** — stay in live mode and click **"+ Create"** → **Secret key** to mint an `sk_live_...` key. Only do this once the Aura Intercept account is fully activated (business details, bank account, tax info).

Copy the secret key (you'll only see it once).

### Step 2 — I update the project secret
I'll open the secure secret form via `update_secret` so you can paste the new `STRIPE_SECRET_KEY`. The old sandbox value gets overwritten; nothing is logged.

### Step 3 — I recreate the 8 prices in the Aura Intercept account
Using `create_stripe_product_and_price`, I'll create — in the new account — the exact catalog the codebase expects, matching the canonical 4-tier + beta pricing rules in project memory:

| Product | Price | Type | Maps to env / code constant |
|---|---|---|---|
| Aura Core — Subscription | $497 / month | recurring | `STRIPE_PRICE_CORE` |
| Aura Boost — Subscription | $994 / month | recurring | `STRIPE_PRICE_BOOST` |
| Aura Pro — Subscription | $1,988 / month | recurring | `STRIPE_PRICE_PRO` |
| Aura Elite — Subscription | $3,979 / month | recurring | `STRIPE_PRICE_ELITE` (alias `command`) |
| Aura Core — Onboarding | $249 | one-time | `STRIPE_PRICE_CORE_ONBOARDING` |
| Aura Boost — Onboarding | $497 | one-time | `STRIPE_PRICE_BOOST_ONBOARDING` |
| Aura Pro — Onboarding | $994 | one-time | `STRIPE_PRICE_PRO_ONBOARDING` |
| Aura Elite — Onboarding | $1,990 | one-time | `STRIPE_PRICE_ELITE_ONBOARDING` |

### Step 4 — I wire the new price IDs into the codebase
Update the price-ID map in `supabase/functions/create-checkout/index.ts` and `supabase/functions/check-subscription/index.ts` (and `src/lib/launchPricing.ts` if it carries them) so they reference the new IDs. The legacy `Tdvk*` / `Tee*` IDs stay in the `LEGACY_TIER_MAP` fallback list so any grandfathered subs on the wrong account would still resolve to a tier if they ever appeared — but those will not exist on the new account, so nothing breaks.

### Step 5 — I verify
- `get_stripe_account_info` → confirms key now points to `acct_1StvIGEGn9AqCo3E` / Aura Intercept.
- `fetch_stripe_resources` on each new `price_…` → confirms all 8 are active and amounts/intervals match.
- Redeploy the three Stripe edge functions (`create-checkout`, `check-subscription`, `customer-portal`) so they pick up the new secret + price IDs.
- Smoke test: hit `check-subscription` for `auraintercept@gmail.com` — expect `subscribed:false, tier:'command'` (no customer yet on this account, which is correct).

### Step 6 — Customer Portal activation (one manual step on your side)
The Customer Portal must be enabled once per Stripe account. On the new Aura Intercept account, visit https://dashboard.stripe.com/settings/billing/portal (test mode first, then live) and click **Activate**. Without this the "Manage subscription" button will throw.

## Notes / things this plan deliberately does NOT do

- It does **not** migrate any customers, subscriptions, or payment history from the sandbox account — there shouldn't be any real ones, but confirm. If there are real test subs you want to keep, tell me and I'll list them first.
- It does **not** touch the `LEGACY_TIER_MAP` price-id fallbacks; those continue to grandfather older subs by name.
- I won't ask for the secret value in chat — `update_secret` opens a secure form.

## Open question before I proceed

**Which mode do you want to launch the new key in — test (`sk_test_...`) or live (`sk_live_...`)?**
Recommendation: start with **test**, recreate the 8 prices in test, run an end-to-end checkout smoke test against the Aura Intercept account, then repeat the exact same 4-step swap in live mode once you've activated the live account.
