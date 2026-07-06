## Phase 2 — Live Runtime Smoke Suite

Goal: prove every top-level route actually renders without runtime errors after the recent audit + refactor sweep — not just compiles.

### Approach
Playwright script driven from the sandbox against `http://localhost:8080`, persisted at `/tmp/browser/smoke/`.

**Personas (3):**
- `hvacadmin@demo.com` — company_admin (HVAC pack)
- `hvactech@demo.com` — technician (mobile view)
- `hvaccustomer@demo.com` — customer (portal view)

Password: `aidemo*!` (per demo registry memory). Restore Supabase session from env, not UI login, per the browser-use guidance.

**Routes covered (~40):**
- Admin: `/dashboard`, `/dashboard/knowledge-base`, `/dashboard/field-ops`, `/dashboard/business-management`, `/dashboard/marketing-sales`, `/dashboard/social-media`, `/dashboard/content-engine`, `/dashboard/web-presence`, `/dashboard/customer-portal`, `/dashboard/analytics`, `/dashboard/ai-operatives`, `/dashboard/specialists`, `/dashboard/communications`, `/dashboard/scheduling`, `/dashboard/settings` (all 7 tabs), `/dashboard/video`, `/dashboard/cyber-sentry`
- Technician: `/technician`, `/technician/install`
- Customer: `/portal`, `/portal/book`, `/portal/invoices`
- Public: `/`, `/pricing`, `/for-business`, `/audit`, `/auth`

**Per route:**
1. Navigate (`domcontentloaded`)
2. Wait 1200ms for React hydration + queries
3. Screenshot → `/tmp/browser/smoke/<persona>-<slug>.png`
4. Capture `page.on("pageerror")` + `console.error` into a JSON log
5. Assert no `Error boundary` / `Something went wrong` text in DOM

### Output
- `/tmp/browser/smoke/report.json` — `{ persona, route, url, errors: [], warnings: [], screenshot }`
- Summary table in chat: route × persona × pass/fail
- Any red rows get a follow-up fix batch in a subsequent turn (not this one)

### Scope guardrails
- Read-only: no forms submitted, no records created
- Skip `/dashboard/demo-seeder` and `/design-preview` (platform-admin only, out of scope)
- Skip external OAuth pop-ups
- Timebox: one Playwright run (~5–8 min). If a route hangs >15s, mark timeout and move on.

### Deliverable
Pass/fail matrix + list of concrete bugs (with stack traces + screenshots) — nothing gets "fixed" this turn; the fix batch is triaged next turn based on severity.

### Technical
- Uses pre-installed Playwright + Chromium (no install needed)
- Restores session via `LOVABLE_BROWSER_SUPABASE_SESSION_JSON` + cookies per browser-use rules
- Viewport 1280×1800; mobile persona also gets a 390×844 pass for technician routes
