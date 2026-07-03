## Goal
Close the unauthenticated cross-tenant action-execution hole in `supabase/functions/agent-action-executor/index.ts`. Every path (`propose`, `approve`, `reject`) must verify the caller's JWT and confirm they belong to the target `company_id` (platform_admin bypasses).

## Approach
Use the existing `supabase/functions/_shared/internal-auth.ts` helper (already used elsewhere) rather than re-implementing auth inline. It handles:
- Bearer JWT verification via `getClaims`
- Service-role bearer fast-path (real server-to-server, replaces the fictional `X-Internal-Token` comment)
- Resolves `userId`, `companyId`, `roles`
- Optional `requiredCompanyId` enforcement with platform_admin bypass

## Changes

### 1. `supabase/functions/agent-action-executor/index.ts`
- Remove misleading top-of-file comment about `X-Internal-Token`.
- Import `authorizeInternalRequest` from `../_shared/internal-auth.ts`.
- **Propose path**: parse body first to get `company_id`, then call `authorizeInternalRequest(req, body.company_id)`. Return its 401/403 response on failure. Service-role callers pass through (needed if orchestrator functions ever call this internally).
- **Approve path**: load the existing action row → call `authorizeInternalRequest(req, existing.company_id)` → then run `applyAction`. Additionally require `roles` includes `company_admin` OR `platform_admin` OR `service_role`.
- **Reject path**: same as approve — load row first for `company_id`, authorize with company scope, require `company_admin`/`platform_admin`/`service_role`.

### Role-gate decision (open question)
Claude's plan requires `company_admin` for approve/reject. I recommend **same-company match only** (any authenticated same-company user), because non-admin staff use `PendingAuraDraftsPanel`. **Need user confirmation** — see question below the plan.

### 2. No frontend changes
All existing callers (`PendingAuraDraftsPanel.tsx`, `Automation.tsx`, `useRunWorkflowChain.ts`) invoke via `supabase.functions.invoke(...)`, which auto-attaches the user JWT. No client changes needed.

### 3. No config changes
Function already deploys with `verify_jwt = false` (required so we can hand-authorize with `getClaims` and support the service-role bypass). Leave as-is.

## Acceptance
- Unauthenticated `propose` → 401.
- Same-company `propose`/`approve`/`reject` → works as before.
- Cross-company `propose`/`approve`/`reject` (Company A user targeting Company B) → 403, no DB writes.
- Existing dashboard flows (`PendingAuraDraftsPanel`, `Automation`, `useRunWorkflowChain`) unaffected for legitimate same-company use.
- Service-role bearer (from other edge functions, if ever added) still works.

## Question before I build
Approve/reject role gate: **(A)** any authenticated same-company user (my recommendation, matches current UX), or **(B)** `company_admin`+ only (Claude's proposal, stricter)?
