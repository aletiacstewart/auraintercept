## Deep-Dive Audit: Findings

I read the route table (75 dashboard routes), the 14 AI consoles, the 18 published industry packs, the demo company seeds, the 49 files that consume `useIndustryPack`, the 80+ edge functions, and the schema (92 tables). Below is what is fully implemented, what is partially wired, and what is broken or inconsistent — followed by a credit-conscious fix sequence.

---

### What is fully implemented and consistent

- **Industry pack engine**: 18 packs published in `industry_template_packs` (hvac, plumbing, electrical, roofing, landscape, fencing, pool_spa, pest_control, solar, appliance_repair, auto_care, handyman, construction, security_systems, beauty_wellness, restaurants, real_estate, personal_assistant) — all active, all with 5 widgets, all with cluster + terminology. Matches the 4-cluster model (trades/outdoor/repair/booking).
- **Industry-aware surfaces (49 files)**: dashboard widgets, sidebar nav labels, page headers (Leads/Quotes/Invoices/Customers/Inventory), Aura suggestions, KPI labels, empty states, form schemas, marketing playbooks, portal copy, field-ops workflows, report templates, quick actions.
- **AI agent / operative model**: 24 agents grouped into 10 operatives, 14 console pages, `agentStyles` plain-English labels, dynamic console nav, handoff/event routing.
- **Tier model**: 4-tier (Core/Boost/Pro/Elite) with `LEGACY_TIER_MAP` translating DB values (starter/connect/performance/command).
- **Subscription/trial**: 90-day trial, trial banner, Stripe mapping, subscription-check edge function returns 200 OK on failure.
- **Public surfaces**: `/book/:slug` now resolves slug-or-UUID; `/site/:subdomain`, `/customer-portal/:companySlug`, `/chat/:companySlug` all live.
- **Edge function inventory**: voice, SMS, email, calendar OAuth, social OAuth, ElevenLabs, SignalWire, content engine, demo seeder, missed-call, reminders, digest cadences — all present.
- **Security posture**: SECURITY DEFINER RPCs for public lookups, role table separated from profiles, tenant integrations table.

---

### Inconsistencies / partial implementations (ordered by severity)

**1. Industry-awareness gaps on operational consoles** (medium)
These consoles do not consume `useIndustryPack`, so vertical context is lost the moment a user leaves the dashboard:
- `AnalyticsConsole.tsx`
- `SocialMediaConsole.tsx`
- `Analytics.tsx`, `CallHistory.tsx`, `Messages.tsx`, `Campaigns.tsx`, `EmployeeAppointments.tsx`
- `BlogManagement.tsx`, `ContentEngineConsole.tsx`

A real-estate user sees "Calls" / "Messages" / "Campaigns" generically instead of "Showings Inquiries" / "Buyer Texts" / "Listing Promotions".

**2. Demo accounts: customer role missing from join** (medium)
Memory says 12 demo accounts (4 tiers × admin/employee/customer). DB shows only 8 admin+employee profiles linked to demo companies. Customers either don't exist, aren't linked to demo companies, or live in a different table. Reseeder may need a re-run.

**3. Legacy warranty + CRM tables still in DB** (low / cosmetic)
`warranty_claims`, `warranty_policies`, `warranty_records`, `crm_connections`, `crm_field_mappings`, `crm_sync_logs`, `crm_entity_mappings` still exist despite the "CRM/Warranty Removal" memory rule. No UI references them, but they bloat the schema and security surface.

**4. Power-user routes still in App.tsx** (low)
`/dashboard/cyber-sentry-mockup`, `/dashboard/cyber-sentry-portal-mockup`, `/dashboard/architecture`, `/dashboard/calculators`, `/dashboard/export-docs` are correctly gated to `platform_admin` — fine. But `BusinessMgtOpsApp.tsx`, `Companies.tsx`, `CustomerPortalInstall.tsx`, `Referrals.tsx` flagged in the `MOCK|TODO` scan — need a quick read to confirm there is no leftover mock data.

**5. AI consoles routing collisions** (low)
Six routes (`/dashboard/ai-consoles/performance-report`, `/business-insights`, `/revenue-analysis`, `/revenue-forecast`, `/customer-insights`, `/kpi-dashboard`) all render the **same** `<AskAura />` component. Dedicated pages exist (`PerformanceReportPage.tsx`, `BusinessInsightsPage.tsx`, etc.) but are not wired to their routes.

**6. Generic page headers not personalized everywhere**
Batch 2 wired Leads/Quotes/Invoices/Customers/Inventory. Still generic: `Messages`, `CallHistory`, `Campaigns`, `Employees`, `EmployeeAppointments`, `Analytics`, `BusinessOperations`.

**7. Industry pack seeding trigger may not have run for older companies**
The trigger `seed_industry_pack_kb_on_industry_change` runs on INSERT/UPDATE OF `industry_vertical`. Companies created before the trigger or never re-saved will have empty KB. Worth a one-line backfill check.

---

### Recommended fix sequence (≈30 credits, leaves buffer)

**Batch A — Wire orphaned AI console routes (1 message, ~3 credits)**
Replace the 6 redirects-to-AskAura with their real page components. Files exist; just swap the route element.

**Batch B — Industry-aware headers on remaining ops pages (1 message, ~5 credits)**
Extend `getPageHeader()` registry with `messages`, `calls`, `campaigns`, `appointments`, `employees`, `analytics`. Apply to the 6 page components.

**Batch C — Industry pack on the 4 operational consoles (1 message, ~5–8 credits)**
Add `useIndustryPack` + terminology to AnalyticsConsole, SocialMediaConsole, Campaigns, Messages, CallHistory. Use existing `industryAuraSuggestions` / `industryQuickActions` for inline prompts.

**Batch D — Demo customer reseeder verification (1 message, ~3 credits)**
Read `seed-demo-accounts-v2/index.ts`, confirm it creates 4 customer auth users + customer_profiles for each demo company. If missing, add. Instruct user to hit `/dashboard/demo-seeder`.

**Batch E — Legacy table cleanup migration (1 message, ~3 credits)**
Drop `warranty_*` and `crm_*` tables (after confirming zero code references with `rg`). Removes a security/maintenance surface.

**Batch F — KB backfill + scan (1 message, ~3 credits)**
- One UPDATE statement to re-trigger pack KB seeding on existing companies missing it.
- Run security scan, fix only severity ≥ warning.

**Optional Batch G — Mock-data cleanup (~3–5 credits)**
Read the 4 flagged files (BusinessMgtOpsApp, Companies, CustomerPortalInstall, Referrals) and replace any remaining mock arrays with real Supabase queries.

---

### Estimated total: ~25 credits

| Batch | Purpose | Credits |
|---|---|---|
| A | Wire orphaned analytics routes | 3 |
| B | Industry headers on remaining ops pages | 5 |
| C | Industry pack on 4 operational consoles | 5–8 |
| D | Verify demo customer accounts | 3 |
| E | Drop legacy warranty + CRM tables | 3 |
| F | KB backfill + security scan | 3 |
| G | (Optional) Mock-data cleanup | 3–5 |
| **Core (A–F)** | | **22–25** |

---

### What I am NOT proposing

- New features
- Tutorial copy overhauls
- Re-running browser QA on every vertical (Demo Elite already passed)
- Touching the 24-agent model, tier names, or auth schema
- Multi-location work (memory rule excludes it)

---

### Confirmation

If approved, I will execute Batches A → F in order, pausing only if a batch reveals something unexpected. Tell me to "skip G" if you want to preserve more buffer, or "do all" to include cleanup.
