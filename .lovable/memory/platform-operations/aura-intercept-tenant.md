---
name: Aura Intercept Tenant
description: Aura Intercept is Tenant #1 on its own platform — Elite tier, saas_platform vertical, company id 04c57cbe-358e-4036-a3ad-b777a55f5be0. Seed via /dashboard/demo-seeder.
type: feature
---

# Aura Intercept Tenant (Dogfooded)

The platform owner runs its own SaaS business as a tenant on Aura Intercept.

## Identity
- Company: `Aura Intercept` · slug `aura-intercept` · id `04c57cbe-358e-4036-a3ad-b777a55f5be0`
- Tier: `command` (Elite — all 10 AI Operatives / 24 agents)
- Industry vertical: `saas_platform` (19th pack, cluster `booking`)
- `is_demo = false` · `public_app_url = https://auraintercept.ai`

## Account split (CRITICAL — never merge)
| Email | Role | Purpose |
|---|---|---|
| `ai@auraintercept.ai` | `platform_admin` only, no `company_id` | God-mode: manage tenants, run seeders, edit platform |
| `auraintercept@gmail.com` | `company_admin` of Aura Intercept | Run the SaaS business; **owns all Google/Gmail/Calendar OAuth integrations** (which is why it lives here, not as platform admin) |
| `support@auraintercept.ai` | `employee` + `technician` | Support persona |
| `sales@auraintercept.ai` | `employee` + `technician` | Sales persona |

Tenant-account password: `aiagent*!` (reset on every reseed run for `auraintercept@gmail.com`, `support@`, `sales@`). The platform_admin `ai@auraintercept.ai` is **not** touched by the seeder — its password is managed manually.

## GCP / Google identity (separate from Lovable platform_admin)
- `auraintercept@gmail.com` is the **Google account** that owns the GCP project, Google Workspace, Gmail, and the Google Calendar OAuth tokens used by tenant integrations. This identity stays put forever — moving it would invalidate all OAuth grants.
- `ai@auraintercept.ai` is the **Lovable platform_admin** (god-mode in this app). It has no Google/GCP role.

## Re-seed
`/dashboard/demo-seeder` → "Seed Aura Intercept Tenant" (platform-admin gated). Calls edge function `seed-aura-intercept` — idempotent. Seeds `auraintercept@gmail.com`, `support@`, `sales@`. Does NOT touch `ai@auraintercept.ai`.

## Public contact surfaces
- Chat widget: `/widget?company=aura-intercept`
- Public booking: `/book/aura-intercept`
- Customer portal: `/portal/aura-intercept`
- Voice: `dispatch_phone` + `ai_voice_greeting` + `ai_agent_prompt` (SaaS receptionist)
