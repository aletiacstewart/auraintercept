---
name: Admin Identity Standard
description: Lovable platform_admin is ai@auraintercept.ai; auraintercept@gmail.com is the GCP/Google identity AND the Aura Intercept tenant company_admin.
type: feature
---

# Admin Identity Standard

Two identities, two completely separate roles. Never merge them.

## ai@auraintercept.ai
- **Lovable platform_admin** — god-mode in this app
- `profiles.company_id = NULL` (platform admins must not be tied to a tenant)
- Used to: manage tenants, run seeders, access platform-admin-gated routes (`/architecture`, `/cyber-sentry-mockup`, `/dashboard/demo-seeder`, etc.)
- Password is **not** managed by any seeder — reset manually via Cloud → Users
- Standard tenant-account password if reset via UI: `aiagent*!`

## auraintercept@gmail.com
- **Aura Intercept tenant company_admin** (`company_id = 04c57cbe-358e-4036-a3ad-b777a55f5be0`)
- **Owns all Google/GCP integrations**: GCP project, Google Workspace, Gmail, Google Calendar OAuth tokens, Google Cloud Console, OAuth client credentials
- Lives at this email specifically because the OAuth grants are bound to this Google account — moving them would require re-authorizing every integration
- Reset by `seed-aura-intercept` edge function (password `aiagent*!`)

## Why the swap (historical context)
The original setup had `auraintercept@gmail.com` as platform_admin and `ai@auraintercept.ai` as the tenant admin. The roles were swapped on 2026-05-02 to keep all the existing 3rd-party OAuth integrations intact (they're tied to the Google identity, not the role).

## Hard rules
- AI agents must NEVER edit `auth.users` directly. Password resets for `ai@auraintercept.ai` must be done by the user via Cloud → Users panel.
- The `seed-aura-intercept` function intentionally excludes `ai@auraintercept.ai` from its persona list.
- Never give `ai@auraintercept.ai` a `company_id`. Never give `auraintercept@gmail.com` a `platform_admin` role.
