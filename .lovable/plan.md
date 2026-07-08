## Status vs. audit prompt

Confirmed by grep across `supabase/functions/*/index.ts`: only **`crm-sync-leads`** already imports `authorizeInternalRequest`. The other **15** functions listed in the audit have no ownership check today. Fix all 15 with the same shared helper.

## Fix pattern (identical everywhere)

```ts
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const authz = await authorizeInternalRequest(req, targetCompanyId);
if (!authz.ok) {
  return new Response(JSON.stringify({ error: authz.error }), {
    status: authz.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

Service-role callers pass the fast path automatically; dashboard JWTs are checked against `profiles.company_id`; `platform_admin` bypasses.

## Tier 1 — real writes / third-party actions

| Function | Body field | Where to insert the check |
|---|---|---|
| `generate-blog-batch` | `companyId` | right after parse, before company lookup |
| `generate-social-batch` | `companyId` | right after parse |
| `parse-faq-document` | `companyId` | after `if (!content || !companyId)` |
| `parse-inventory-document` | `companyId` | after `if (!documentContent || !companyId)` |
| `sync-company-workspace` | `body?.company_id` | after existing `company_id required` guard |
| `initialize-company-agents` | `body?.company_id` (optional) | inside the `if (companyId)` branch. **Additionally** gate the "all companies" branch (when `companyId` is absent) to service-role or `platform_admin` only — otherwise any logged-in user can trigger a bulk re-init across every tenant |
| `google-calendar-sync` | `companyId` (may be backfilled from `appointmentId`) | **after** the existing backfill (`if (!companyId && appointment) companyId = appointment.company_id`) and after the `!companyId` guard, before the connection lookup |
| `sms-diagnostic` | `companyId` | after `if (!companyId)` guard, before mode branch |

## Tier 2 — read-only AI generation (data exfil + gateway cost)

Same pattern, right after `companyId` is parsed:

- `generate-campaign-content`
- `generate-website-content`
- `generate-knowledge-base`
- `generate-content-image`
- `generate-campaign-series`

## Tier 3 — job-scoped

Both derive `company_id` from `lead_import_jobs`, so the check goes **after** the job is loaded:

- `lead-import-parse` — after `const { data: job } = ... .eq("id", job_id).single()`, gate on `job.company_id` before setting status to `parsing`.
- `lead-import-commit` — same placement, before setting status to `importing`.

## Notes / recommendations beyond the audit

1. **`initialize-company-agents` bulk mode is a real hole the audit under-specified.** When `company_id` is omitted the function currently iterates every company. Restrict that branch to `authz.ctx.isService || authz.ctx.roles.includes("platform_admin")`.
2. **`google-calendar-sync` ordering matters** — the check must come after the appointment backfill, otherwise a caller who only sends `appointmentId` gets a false 403. The plan places it correctly.
3. **`lead-import-parse` internally fires `lead-import-commit`** via `fetch` with a bearer. Verified it currently forwards the incoming caller's authorization header, so the child call will pass the new check as the same user. No extra work needed.
4. **`sync-company-workspace` invokes `initialize-company-agents`** via `supabase.functions.invoke` on a service-role client — hits the service fast path, no regression.
5. **No `crm-sync-leads` change** — already correct.

## Deploy set

After edits, deploy the 15 modified functions in one batch:

`generate-blog-batch, generate-social-batch, parse-faq-document, parse-inventory-document, sync-company-workspace, initialize-company-agents, google-calendar-sync, sms-diagnostic, generate-campaign-content, generate-website-content, generate-knowledge-base, generate-content-image, generate-campaign-series, lead-import-parse, lead-import-commit`

## Verification (spot-check, not exhaustive)

- Unauthenticated `curl` to one Tier 1 (`generate-blog-batch`) and one Tier 2 (`generate-campaign-content`) → 401.
- Authenticated `curl` as preview user with a forged foreign `companyId` on `sms-diagnostic` → 403.
- `google-calendar-sync` with `appointmentId` only (no `companyId`) as the owning user → still succeeds (backfill + check ordering correct).
- `lead-import-parse` with someone else's `job_id` → 403; own job → still parses and chains into commit.

## Files touched

15 files under `supabase/functions/<name>/index.ts` (one small addition each: import + 6-line check block). No frontend, schema, or shared-lib changes.
