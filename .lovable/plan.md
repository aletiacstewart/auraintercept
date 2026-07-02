## Pre-Launch Readiness Fixes

Five fixes before onboarding real clients. Item 5 is a quick verification (unread badge already exists in code — likely a data/route issue, not missing UI).

---

### 1. Onboarding checklist / Setup Progress

**Symptom:** New company sees "0 of 0 sections completed · 0%" on the Platform Dashboard.

**Root cause:** `DashboardSetupNav.tsx` and `SetupProgressBar.tsx` bail to a `sections.length === 0` empty state when the `companies` row fetch fails or `companyId` isn't hydrated yet. Both also mix "always-true" checks with "needs data" checks, so real progress numbers look wrong.

**Fix:**
- Redefine the checklist as **6 first-run steps** every new company must complete, in order:
  1. Business info (name, phone, address, hours)
  2. Services / offerings (≥1 service row)
  3. Communications (SignalWire phone connected OR email sender configured)
  4. AI Operatives (≥1 `ai_agent_configs.is_enabled`)
  5. Web Presence (smart website created)
  6. Publish / Go Live (smart website `is_published` OR `public_app_url` set)
- Rewrite `DashboardSetupNav.tsx` so it always renders those 6 steps even before data loads (skeleton), never "0 of 0".
- Each chip links to the correct settings route and shows check when complete.
- Fire `SETUP_PROGRESS_REFRESH_EVENT` from the relevant settings screens (verify existing dispatch points, add where missing).
- Retire the redundant duplicate section calc in `SetupProgressBar.tsx` — collapse both widgets into a single source of truth (`useSetupProgress` hook) so the dashboard and settings header agree.

---

### 2. Clean signup state (no AuraIntercept / demo data bleed)

Audit + patch:
- **Signup path** (`SignUp.tsx` + `handle_new_user` + `seed-company` edge functions if any): confirm no INSERT into `services`, `faqs`, `smart_links`, `inventory_items`, `knowledge_documents` beyond the generic industry-pack seed. The `seed_default_smart_links` trigger inserts 5 empty smart-link *templates* (URLs blank) — that's fine; verify no live URLs.
- Confirm `seed_industry_pack_kb_for_company` uses `industry_template_packs` (generic per-vertical content) — never Aura Intercept's own row.
- Audit that no dropdown, "recent customers", or dashboard widget on a fresh account can select data outside `.eq('company_id', currentCompanyId)`. Reuse the tenant-scope grep from the prior pre-launch report to spot-check.
- Customer Portal: verify the portal page loads company info via `get_company_public_info_by_id(currentCompanyId)` (not a hardcoded Aura Intercept fallback). If a default falls back to Aura Intercept anywhere, replace with the active company's own `contact_phone`/`contact_email`/`address`.
- Confirm demo companies (`is_demo = true`) are excluded from every non-platform-admin query (dropdowns, reports, "all companies" lists in non-admin surfaces).
- If any seed content is retained, prefix with `Example — ` and mark `is_example = true` (add column) so the UI can render it grayed with an "Edit or delete" hint.

Deliverable: audit notes in `/mnt/documents/tenant-isolation-audit.md` + code fixes for anything found.

---

### 3. Standardize empty states

Create `src/components/ui/EmptyState.tsx` with a single pattern: icon + title + subtitle + optional CTA. Then sweep:
- `SmartWebsiteAnalytics.tsx` — Daily Traffic Trend + AI Engagement Trend: when the log arrays are empty, render `<EmptyState />` instead of a zero-line chart. Same for any hardcoded satisfaction % — swap for "No sessions yet".
- `CalDAVSubscription.tsx` company variant already shows "Coming Soon" — confirm ICS card has parity (check `src/pages/integrations/CalendarIntegration.tsx`).
- Ripgrep for `not available.*contact support`, `NaN%`, hardcoded percentages in analytics cards, and flat-zero recharts renders — replace each with `<EmptyState />`.

---

### 4. Remove hardcoded tenant-specific references

Audit the surfaces that generate AI templates or content:
- ElevenLabs voice agent prompt generator (find it — likely `src/pages/AskAuraConfig.tsx` or an edge function).
- AI Content Profile defaults (`company_ai_content_profiles`).
- Any system prompt in `supabase/functions/*` (there are ~30 matches for "Aura Intercept").
- Filter matches into two buckets:
  - **Legitimate** (platform-level branding — welcome emails from `ai@auraintercept.ai`, TCPA opt-in copy, signup page, footer) — leave alone.
  - **Illegitimate** (any string used as a default for the *tenant's* company name, manager name, or contact info in generated content) — replace with `${company.name}`, `${company.contact_phone}`, etc. Placeholder previews shown before a company fills in data get grayed "e.g., Jane Smith" styling.
- Also scan for literal "Charles Perez" and any other personal names appearing as defaults.

Deliverable: audit notes + code fixes.

---

### 5. Notification bell unread indicator

The bell component (`NotificationBell.tsx`) **already** renders a destructive badge with `unreadCount` when > 0. So the "no indicator ever" symptom is one of:
- `useStaffNotifications` hook returns `unreadCount = 0` because no rows match the current user's `recipient_id`;
- notifications aren't being written for the events listed (integration status, low inventory, escalations);
- bell isn't mounted on the header the user is looking at.

**Fix:**
- Verify `NotificationBell` is mounted in `DashboardLayout` header for every role (spot-check).
- Audit `staff_notifications` inserts — add missing ones for: A2P 10DLC status change, failed automation (edge function error), escalated customer issue, low inventory threshold, new signup (already present), integration disconnect. Add whichever are missing.
- Confirm the `staff_notifications` RLS `SELECT` policy lets a company_admin see rows where `recipient_id = auth.uid()` OR `recipient_role` matches their role.
- Add a small test insert path (dev-only button) so the badge can be smoke-tested during QA.

---

### Order of work

1 → 2 → 4 → 3 → 5. Items 1 and 2 ship together so a fresh test company can be walked end-to-end (matches the manual verification checklist). No product behavior changes to billing, tier, or integrations — this pass is polish, isolation, and UX consistency only.
