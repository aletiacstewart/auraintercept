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

## Tiers (4 + free) — Beta Pricing (ACTIVE)

Originals are struck through; beta price is what the customer pays.
Onboarding = 25% OFF original one-month price, invoiced on day 31 of the 60-Day Live Trial. First monthly plan fee is charged on day 61.

- **Aura Core** (`starter`) **$497/mo** (was $697) · **$370** onboarding (was $497)
  — 5 operatives: AI Receptionist, Customer Journey, Outreach, Creative
  Content, Web Presence. Consoles: Customer Portal, Outreach & Sales
  Console, Creative & Web Presence, Social Media, Analytics & Reports,
  AI Operatives Hub. 10 employees.
- **Aura Boost** (`connect`) **$994/mo** (was $1,394) · **$750** onboarding (was $994)
  — Core + Dispatch + Field Navigation. Adds Field Operations Console.
  25 employees.
- **Aura Pro** (`performance`) **$1,988/mo** (was $2,788) · **$1,490** onboarding (was $1,988)
  — Boost + Business Finance + Analytics Intelligence + Admin. Adds
  Business Management. 50 employees.
- **Aura Elite** (`command`) **$3,979/mo** (was $5,576) · **$2,980** onboarding (was $3,979)
  — All 10 operatives + industry specialists + all 8 consoles including
  AI Operatives Hub. Unlimited employees.

## 7 Consoles (canonical DISPLAY names — no trailing "Console")

Per Voice & Style Sheet v2 — one canonical display name per console. Route
paths keep their slugs; only the human-facing label is standardized.

Source of truth: `src/lib/canonicalNames.ts` (`CONSOLE_NAMES`).

| Key                      | Canonical display |
|--------------------------|-------------------|
| `customer_portal`        | Customer Portal   |
| `field_operations`       | Field Operations Console |
| `business_management`    | Business Management |
| `marketing_sales`        | Outreach & Sales Console |
| `social_media`           | Social Media      |
| `creative_web_presence`  | Creative & Web Presence |
| `analytics_reports`      | Analytics & Reports |
| `ai_operatives_hub`      | AI Operatives Hub |

Forbidden variants: "Business Operations" · "Service Management" ·
"Outreach & Sales Ops" · "Marketing & Sales Console" (use
"Outreach & Sales Console") · "Smart Website" as a console header (use
"Creative & Web Presence") · adding trailing "Console" to consoles that
don't carry it above (Customer Portal, Social Media, Creative & Web
Presence, Analytics & Reports, AI Operatives Hub, Business Management).

## Agent naming

Every named unit is `[Function] Agent`. Sole exception: **AI Receptionist**
(flagship first-contact product, no `Agent` suffix). "Operative" is a
collective/narrative word only ("24 AI operatives", "the operative
network") — never a per-unit label.

## Plain-English Customer Labels (`agentStyles.ts`)

Front Desk · On The Way · Office/Billing · Marketing · Social Posts ·
Reports · Website. Customer-facing rollups for chat & dashboards.

## Trial & Pricing Copy

- **60-Day Live Trial**. **First 30 days = concierge onboarding window,
  remaining 30 days = full live use.** Onboarding fee invoiced on day 31;
  first monthly plan fee charged on day 61. Trial honors the selected tier
  (no Elite preview). Reminders at 7/3/1 days remaining.
- **All** 3rd-party providers (SignalWire, ElevenLabs, Resend, Tavily,
  Stripe, A2P 10DLC, social) require the CUSTOMER'S OWN ACCOUNT + card on
  file. Each provider invoices the customer DIRECTLY and SEPARATELY from
  the Aura plan fee. Aura never resells, marks up, or invoices 3rd-party
  usage. Never use "bundled" / "overage" / "absorbed" /
  "included in your tier" copy for 3rd-party usage.
