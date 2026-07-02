---
name: Canonical Naming Registry
description: Single source of truth for tier names, console titles, AI agent IDs and consolidated operative model — prevents naming drift across UI, edge functions, and demos
type: feature
---
# Canonical Naming Registry

Source-of-truth files (DO NOT drift from these):
- Tier IDs/labels/prices/operatives: `src/lib/subscriptionAgentConfig.ts` (`TIER_AGENT_CONFIG`)
- Plain-English customer rollup labels: `src/lib/agentStyles.ts` (`AGENT_STYLES`)
- Edge-function tier maps must mirror `TIER_AGENT_CONFIG`:
  - `supabase/functions/initialize-company-agents/index.ts`
  - `supabase/functions/seed-demo-accounts-v2/index.ts`

## Canonical operative model (24 AI agents organized into 10 Operatives)

**Canonical phrasing:** "24 AI agents organized into 10 Operatives".
Cards/marketing use operative counts (Core 5 · Boost 7 · Pro 10 · Elite 10).
PDFs may add the platform-wide agent count (24) for clarity.

The UI and tier gating are driven by the **10 consolidated operatives**.
Legacy 24-agent IDs (booking/lead/route/etc.) are accepted as input aliases
via `LEGACY_AGENT_MAP` and normalized to a consolidated operative before any
tier check or "Active" computation.

| Consolidated operative      | Legacy aliases                                  |
|-----------------------------|------------------------------------------------|
| `triage` (AI Receptionist)  | —                                              |
| `customer_journey`          | `booking`, `followup`, `review`                |
| `outreach`                  | `lead`, `marketing`, `campaign`                |
| `creative_content`          | `creative`, `social_content`, `social_scheduler`, `social_analytics` |
| `web_presence`              | —                                              |
| `dispatch`                  | —                                              |
| `field_navigation`          | `route`, `eta`, `checkin`                      |
| `business_finance`          | `quoting`, `invoice`, `inventory`              |
| `analytics_intelligence`    | `insights`, `revenue`, `forecast`              |
| `admin`                     | —                                              |

## Tiers (4 + free)

- **Aura Core** (`starter`) $697/mo · $349 onboarding — 5 operatives: AI Receptionist, Customer
  Journey, Outreach, Creative Content, Web Presence. Consoles: Customer
  Portal, Outreach & Sales, Creative & Web Presence. 10 employees.
- **Aura Boost** (`connect`) $1,097/mo · $549 onboarding — Core + Dispatch + Field Navigation.
  Adds Field Operations + Social Media consoles. 25 employees.
- **Aura Pro** (`performance`) $1,997/mo · $999 onboarding — Boost + Business Finance + Analytics
  Intelligence + Admin. 50 employees.
- **Aura Elite** (`command`) $3,997/mo (launch sale $2,997) · $1,549 onboarding — All 10 operatives + industry
  specialists + AI Operatives Hub console. Unlimited employees.

## 7 Consoles (canonical DISPLAY names — no trailing "Console")

Per Voice & Style Sheet v2 — one canonical display name per console. Route
paths keep their slugs; only the human-facing label is standardized.

Source of truth: `src/lib/canonicalNames.ts` (`CONSOLE_NAMES`).

| Key                      | Canonical display |
|--------------------------|-------------------|
| `customer_portal`        | Customer Portal   |
| `field_operations`       | Service Management |
| `business_management`    | Business Operations |
| `marketing_sales`        | Outreach & Sales  |
| `social_media`           | Social Media      |
| `creative_web_presence`  | Creative & Web Presence |
| `analytics_reports`      | Analytics & Reports |
| `ai_operatives_hub`      | AI Operatives Hub |

Forbidden variants: any of the above with a trailing "Console" or "Ops" in
display copy · "Business Management" (use "Business Operations") ·
"Outreach & Sales Ops" / "Outreach & Sales Console" · "Smart Website" as a
console header (use "Creative & Web Presence") · "Field Operations Console"
in display (use "Service Management") · "Marketing & Sales Console" (use
"Outreach & Sales").

## Agent naming

Every named unit is `[Function] Agent`. Sole exception: **AI Receptionist**
(flagship first-contact product, no `Agent` suffix). "Operative" is a
collective/narrative word only ("24 AI operatives", "the operative
network") — never a per-unit label.

## Plain-English Customer Labels (`agentStyles.ts`)

Front Desk · On The Way · Office/Billing · Marketing · Social Posts ·
Reports · Website. Customer-facing rollups for chat & dashboards.

## Trial & Pricing Copy

- 90-Day Live Trial, no credit card. **First 30 days = onboarding window, remaining 60 days = full live use.** **Trial honors the selected tier** (no
  Elite preview). Reminders at 30/7/1 days remaining.
- 3rd-party usage (SignalWire/ElevenLabs/Resend/Tavily) = "Included in your tier".
- A2P 10DLC and Stripe transaction fees = paid directly to provider.
