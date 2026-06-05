
# Launch Readiness Sweep

One large pass covering docs, pricing, onboarding, audit page, AI agents, 3rd-party integrations (live smoke tests), and a clean demo reseed. Launch Pricing stays ACTIVE.

## Phase 1 — Source-of-truth reconciliation (must do first)

Two contradictions in project memory must be resolved before docs are touched, otherwise every fix will be wrong somewhere:

1. **Trial length.** Core rule says *90-Day Live Trial*. Memory `product/trial-period-standard` says *60-Day*. Code (`useDemoSession`, signup, progress bar) and docs mix both. I will standardize on **90-day** (matches Core rule + current signup), update the 60-day memory file, and fix every stale string.
2. **Demo registry size.** Core list says *v3 / 54 accounts / 18 industries*; the actual `demo-account-registry` file is *v6 / 78 accounts / 26 industries*. I will refresh the index to v6/78/26 to match `industry_template_packs` and the seeder.

Also reconcile 3rd-party policy copy: memory currently has BOTH a "Bundled (Resend/Tavily/SignalWire/ElevenLabs)" disclaimer file AND the newer "customer brings their own account, billed direct" core rule. The core rule wins — I'll rewrite `legal/third-party-fee-disclaimer` and scrub any "bundled / overage / absorbed" copy from UI + PDFs.

## Phase 2 — Pricing, fees, onboarding docs

- Audit every surface that prints a price/fee against `src/lib/launchPricing.ts` (single source of truth): landing pricing, `/audit` checklist PDF, `documentationConfig.ts` (`implementationFee`), Stripe checkout, signup tier cards, plan comparison, outreach toolkit PDFs, blog/marketing JSON.
- Verify every shown price renders as: original strikethrough + sale + "Launch Pricing" chip. Onboarding = 50% of sale rounded.
- Verify Stripe price IDs: new `Tee*` IDs active, legacy `Tdvk*` retained only for grandfathered subs (no new checkout uses them).
- Onboarding flow review: `OnboardingForm` (Fast Start vs Full), `CompanyOnboardingForm`, `FastStartWizard`, `LaunchProgressCard`, `useLaunchProgress`, `useSetupProgress`. Confirm:
  - Tier + industry persisted correctly (per `signup-vs-demo-isolation`).
  - 90-day trial start sets `trial_ends_at = now()+90 days`.
  - Onboarding fee charged at trial start; first 30 days = onboarding window copy is consistent.
  - 10DLC / A2P legal step present and accurate now that SignalWire SMS is live.
  - Industry pack auto-seed trigger fires (KB + FAQs).

## Phase 3 — /audit page + downloadable PDF

- Review `pages/OpportunityAudit.tsx`, `AuditReport.tsx`, `components/audit/*`, AuditChecklistPDF generator.
- Update pricing table, onboarding fee, trial length, feature list per tier (Core 8 / Boost 12 / Pro 18 / Elite 24 agents).
- Confirm public access (no auth wall) per `power-user-pages-restricted-v1`.
- Regenerate PDF, visually QA each page (pdftoppm → inspect), fix overlaps/clipping.
- Verify lead capture from `/audit` writes to `leads` table with `service_interest='audit'`.

## Phase 4 — Documentation sweep

Single source = `src/lib/documentationConfig.ts` + `src/lib/howToUseContent.ts` + `src/lib/helpSystemPrompt.ts` + industry help content libs.

- Reconcile every prices/fees/feature/tier list against Phase 1 truths.
- Update outreach toolkit PDFs (7 components) and promo video scripts.
- Update marketing locales (`src/locales/{en,es}/marketing.json`) — CTAs say "90-Day Live Trial".
- Scrub "bundled/overage/absorbed" language; replace with customer-pays-provider-directly copy.

## Phase 5 — Features & AI Agents functional audit

- 24-agent / 10-operative model: verify each agent has a working system prompt + edge function path, tier-gated correctly (Core 8 / Boost 12 / Pro 18 / Elite 24), and renders in the right Operative Hub tab.
- Spot-check console pages we recently fixed: Business, Analytics, Marketing & Sales, Social, Field Ops, Customer Portal, Specialist — confirm nav dropdowns + panels render real data, no mock arrays.
- Field Ops + Technician PWA: job assignment, dispatch, click-to-call.
- Smart Website: chat widget install (3 methods), public RLS read, blog management isolation.
- Content Engine, Aura Command Center, conversational intelligence modal.
- Run `vitest` for hook/component test suites; run security linter; review console + network errors at `/`.

## Phase 6 — 3rd-party integrations LIVE smoke tests

Each tested against Aura Intercept tenant (`04c57cbe…`) credentials. Captured results documented in chat.

| Provider | Test | Function |
|---|---|---|
| SignalWire SMS | send test SMS to a staff number | `send-sms` / keyword auto-responder |
| SignalWire Voice | place test inbound to AI receptionist | SWML voice flow |
| ElevenLabs | trigger voice agent test call | client-tools webhook |
| Resend | send test transactional email | `send-transactional-email` |
| Tavily | run a web search query | `tavily-search` |
| Stripe | create $1 test PaymentIntent against current Tee* price | `stripe-checkout` |
| Google Calendar | OAuth + event create/sync | `google-calendar-*` |
| Push notifications | send test push to a registered sub | `send-push` |
| Social (manual + OAuth) | dry-run publish to connected accounts | `social-publish` |

For each: confirm env var present, edge function deployed, success response, log row written. Flag any failure with concrete fix.

## Phase 7 — Clear mock data + reseed demos

Per your scope: only `is_demo=true` companies (and their data) — Aura Intercept tenant + any real signups are untouched.

1. Run a migration that deletes all rows tied to `companies.is_demo=true` (appointments, leads, quotes, invoices, customers, blogs, marketing campaigns, agent configs, KB docs, FAQs, inventory, etc.), then deletes the companies themselves and their demo auth users.
2. Run `seed-demo-accounts-v2` to reseed 78 accounts (26 industries × 3 roles). Verify:
   - Each industry sits at curated tier.
   - AI agents auto-activated per tier + pack extras.
   - KB/FAQs seeded by `trg_seed_industry_pack_kb`.
   - Tier-appropriate quotes/invoices created (Pro/Elite only).
   - Universal password `aidemo*!` works for one sample admin/employee/customer.
3. Update `mem://platform-operations/demo-account-registry` if any drift found; refresh index entry.

## Phase 8 — Final launch checklist + verification

- Run security scan + linter, fix any new high/critical.
- Verify all canonical URLs use `https://auraintercept.ai` (no Lovable previews) per Published Domain Standard.
- Confirm SEO basics on landing + `/audit` + pricing (title <60, desc <160, single H1, sitemap entries).
- Smoke test signup → onboarding fee → 90-day trial → dashboard → one agent action end-to-end as a brand-new real (non-demo) user.
- Produce a short "Launch Readiness Report" in chat: ✅/⚠️ per area + any remaining manual steps the user must do (e.g. provider-side billing top-ups, DNS, Google verification).

---

## Technical notes

- Migrations: one for demo wipe (DELETE only — no schema change), reseed is an edge function call, not a migration.
- Hard rules respected: don't touch `auth` schema directly; deletes go through service-role inside the seeder edge function where possible; for direct deletes, use Supabase migrations.
- Memory updates required: `product/trial-period-standard` (60→90), index entry for demo registry (v3/54/18 → v6/78/26), `legal/third-party-fee-disclaimer` (remove bundled language), index core line "60-Day" if any.
- Any pricing string found hardcoded outside `launchPricing.ts` / `documentationConfig.ts` is replaced with a call to the helpers (`getMonthlyPrice`, `getOnboardingPrice`, `<SalePrice>`).
- No new dependencies expected.

## Out of scope (will not touch)

- Real customer companies (`is_demo=false`).
- Aura Intercept tenant users beyond what `seed-aura-intercept` already manages.
- Schema migrations to add/remove tables.
- New features — only verification + reconciliation + reseed.
