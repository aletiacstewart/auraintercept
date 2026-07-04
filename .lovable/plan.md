
## Platform Audit — Consolidated Fix Plan

Three parallel audits ran: runtime/code health, standards/naming, and AI-agent/feature completeness. Plus the security scanner and Supabase linter. The good news is structural: **all 24 agents wire end-to-end with no orphans**, all 10 major feature areas are real (not mocked), and every operative gets industry prompt injection on chat/voice/SMS. The issues are mostly leakage of old copy, hardcoded colors/prices, and a handful of real bugs.

Fixes are grouped so each stage ships something coherent and testable. Approve all or pick stages.

---

### STAGE 1 — Real bugs & security (P0/P1)

**1.1 Orphan-user bug on signup role assignment**
`src/pages/CustomerAuth.tsx:158` — if role insert fails, user is already in auth but has no role, breaking every role-gated route silently. Wrap in a rollback: delete the auth user (or mark for cleanup) and show a recoverable error instead of a destructive toast + return.

**1.2 TrialBanner math bug (user-visible)**
`src/components/dashboard/TrialBanner.tsx:117` — copy says "the remaining 60 days are full live use." Trial is 30+30, not 60+60. Fix to "the remaining 30 days are your full live use window" and add the "Live" qualifier: "60-Day Live Trial".

**1.3 Shared demo/trial passwords (security scanner P1)**
`supabase/functions/create-demo-trial/index.ts:10` (`auratrial*!`) and `seed-demo-accounts-v2/index.ts:8` (`aidemo*!`). Replace shared plaintext with a per-account `crypto.randomUUID()` password returned only to the caller once. Keep seeder output unchanged for platform_admin only.

**1.4 Storage listing on public buckets (linter WARN ×3)**
Three storage buckets have broad SELECT policies allowing anonymous listing. Tighten `storage.objects` SELECT to require the caller be in the folder's owning company (same pattern as `job-photos`).

**1.5 SECURITY DEFINER exec grants (linter WARN, many)**
Revoke default `EXECUTE ... TO anon, authenticated` on SECURITY DEFINER functions that aren't meant to be publicly callable. Keep only the ones you intentionally expose (e.g., `has_role`, public company listing RPCs). Everything else: `REVOKE EXECUTE ... FROM anon, authenticated; GRANT EXECUTE ... TO service_role`.

**1.6 CustomerAuth / OnboardingForm unhandled effects**
Add try/catch around the async `supabase.from('companies').select` in `AIAgentSettings.tsx:755` and the deps-suppressed effects in `Subscription.tsx:320`, `InvoiceForm.tsx:159,176`, `BusinessQuoteForm.tsx:119,134`, `BusinessOperations.tsx:42`, and `SpecialistOperativesConsole.tsx:220,366`. Where the intent is truly one-shot, use a `useRef` guard instead of suppressing lint, so lint stays honest.

---

### STAGE 2 — Trial & pricing consistency

**2.1 Canonicalize trial wording (10 spots)**
Replace all "14-day" / "7-14 days" onboarding language and any bare "60-day trial" with the canonical "60-Day Live Trial (30-day onboarding + 30-day full live use)":
- `LaunchPathSelector.tsx:90,124,129,157`
- `GuidedLaunchFlow.tsx:283`
- `GoLiveTimeline.tsx:1,152` (change `addDays(startDate, 13)` → `addDays(startDate, 29)`)
- `Subscription.tsx:864`
- `TermsOfService.tsx:73,93`
- `SalesPitchDataPDF.tsx:817,853`

**2.2 De-hardcode prices (5 files)**
Every price string should read from `src/lib/launchPricing.ts` via `formatPrice()` / `getMonthlyPrice()`:
- `AIAgentGuide.tsx` (multiple `$994/mo`, `$3,979/mo`)
- `subscriptionAgentConfig.ts` (multiple `$497/mo`)
- `SignUp.tsx:~279-283` (`originalMonthly`/`monthlyPrice` object literals)
- `helpSystemPrompt.ts` (4 lines with tier prompts)
- `auraInterceptSalesPrompt.ts` (4 lines)

Verify canonical "original" (pre-beta) prices in `launchPricing.ts:10-19` match the memory rule ($697/$1,394/$2,788/$5,576 vs the memory's core note). If the canonical originals in memory are the higher figures, the file is correct — no code change; just confirm.

---

### STAGE 3 — Naming & user-facing copy

**3.1 Naming standard**
- `Integrations.tsx` — rename "CRM Sync" nav label → "Lead Capture & Scoring" (or "External Tool Sync") per memory.
- `industryMarketingContent.ts`, `industryPortalCopy.ts` — replace "Warranty triage" / "warranty status" with "Service coverage" / "Manufacturer coverage status".
- `AgentTestConsole.tsx:771` — remove "Powered by Lovable AI".

**3.2 Never say "Supabase" in user-facing copy**
- `PrivacyPolicy.tsx:76` — replace `"Lovable Cloud / Supabase for application hosting…"` with `"our cloud infrastructure provider for hosting, database, and authentication"`.
- `platformBrief.ts:216,324` — used as AI system prompt; sanitize to "the platform database" / "a valid platform session".

**3.3 Feature status honesty**
- `CalDAVSubscription.tsx` and `CalendarSubscription.tsx` — replace "Coming Soon" badge on company-wide feeds with either a firm ETA or hide the option until wired.
- `Analytics.tsx` — memory says "8 tabs"; code renders 6. Either update memory to "6 tabs" or ship the missing 2 (Customer Insights, Demand Forecast pages exist as dedicated routes — could be surfaced as tabs). Recommend updating memory to 6.

---

### STAGE 4 — Cyber-Sentry design token compliance

Systematic hex/rgba purge. Highest-impact files first:

| File | Instances | Approach |
|---|---|---|
| `src/pages/Index.tsx` | 76 | Introduce local token map: `--cyber-cyan`, `--cyber-cyan-glow-lg/md/sm`, `--cyber-frost`. Replace inline `style={{color:'#00E5FF'}}` with class utilities driven by tokens. |
| `src/components/audit/AuditResults.tsx` | 19 | Same token set — score/gauge colors become semantic (`--score-good/warn/bad`). |
| `src/components/employee/FieldOpsAgentConsole.tsx` | 14 | Replace `rgba(2,8,18,…)` container styles with `surface-elevated-dark` utility. |
| `src/pages/Companies.tsx` | 14 | Default `primary_color`/`secondary_color` → CSS var fallbacks. |
| `src/components/ai/chat/GlassHeader.tsx` | 14 | Introduce `--glass-border`, `--glass-accent-success`. |
| `WidgetPreview.tsx` (4), `QuickActionGrid.tsx` (6), `ProfileSettings.tsx` (2), `AIAgentFlowDemo.tsx` (bg hexes) | ~15 | Direct token swap. |

No layout changes. No behavior changes. Purely swap literals for tokens defined in `src/index.css`.

---

### STAGE 5 — Code hygiene (P2)

**5.1 Remove dead route imports**
`src/App.tsx:91-92,145` — `ExportDocumentation`, `VideoPromptsPage`, `AIAgentFlowDemo` imported but their routes redirect. Delete imports.

**5.2 `as any` reduction on Supabase queries (fragility)**
`useIndustryWidgetCounts.ts:37`, `useRunWorkflowChain.ts:69-81`, `useSetupProgress.ts:89-91`. Add generated types (`Database['public']['Tables'][...]`) or Zod-parse the response before use, so shape drift throws instead of silently producing `undefined`.

**5.3 AI fallback**
`ai-agent/index.ts:331,399,436` — all AI chat rides one `LOVABLE_API_KEY` → `google/gemini-2.5-flash`. Add a single fallback (e.g., `google/gemini-2.5-flash-lite`) invoked when the primary returns 429/5xx twice. Keeps the platform functional under quota events.

**5.4 Deprecated `serve()` import**
20+ edge functions import `https://deno.land/std@0.168.0/http/server.ts`. Migrate to `Deno.serve` in the ones being touched by this audit; don't do a mass rewrite — pin future migrations to functions you edit anyway.

---

### Not doing

- No agent renames, no new agents, no consolidation changes — registry is clean.
- No pricing structural changes — only de-hardcoding.
- No layout / component structure changes anywhere.
- Multi-location roadmap sales-FAQ line in `MarketingSalesMasterPDF.tsx` — leaving as-is per current sales copy unless you say otherwise.
- Deep SECURITY DEFINER audit function-by-function beyond the blanket revoke pattern in 1.5 — call out any you want kept public.

---

### Verification per stage

- **1** — Sign up as a new customer with intentionally-broken role insert; confirm auth user is cleaned up. Trial banner text reads "30 days full live use". Security scanner rerun shows demo-password finding cleared.
- **2** — grep for `14-day`, `14 day`, `60-day trial` (without "Live"), and hardcoded `$497`/`$994`/`$1,988`/`$3,979` in `src/`; expect zero matches outside `launchPricing.ts`.
- **3** — Search UI for "CRM Sync", "Warranty", "Powered by Lovable", "Supabase" in user routes; expect zero matches.
- **4** — grep for `#[0-9A-F]{6}`, `rgba(`, `style={{ color:`, `style={{ background:` in `src/pages/Index.tsx` etc.; expect zero literal color values outside the token definitions.
- **5** — Typecheck passes with fewer `as any`. Manual load of `/dashboard/architecture` and admin routes confirms no dead route breakage.

Suggested order: **Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5**. Stage 1 is the only stage with user-visible bug risk; the rest are safe presentational/copy work.

Reply "go" to implement all, or name the stages you want (e.g. "stage 1 and 2 only").
