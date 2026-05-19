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

## Canonical operative model (10 consolidated operatives)

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

- **Aura Core** (`starter`) $197/mo — 5 operatives: AI Receptionist, Customer
  Journey, Outreach, Creative Content, Web Presence. Consoles: Customer
  Portal, Outreach & Sales, Creative & Web Presence. 10 employees.
- **Aura Boost** (`connect`) $497/mo — Core + Dispatch + Field Navigation.
  Adds Field Operations + Social Media consoles. 25 employees.
- **Aura Pro** (`performance`) $997/mo — Boost + Business Finance + Analytics
  Intelligence + Admin. 50 employees.
- **Aura Elite** (`command`) $1,997/mo — All 10 operatives + industry
  specialists + AI Operatives Hub console. Unlimited employees.

## 7 Consoles (canonical display titles)

Customer Portal Console · Field Operations Console · Business Management
Console · Outreach & Sales Console · Social Media Console · Creative & Web
Presence Console · Analytics & Reports Console (+ AI Operatives Hub on Elite).

Forbidden variants: "Mgt Ops", "Business Ops Hub", "Technician-Field Ops",
"Analytics & Reports Ops", "Social Media Ops", "Outreach & Sales Ops",
"Field Ops + Dispatch Operative".

## Plain-English Customer Labels (`agentStyles.ts`)

Front Desk · On The Way · Office/Billing · Marketing · Social Posts ·
Reports · Website. Customer-facing rollups for chat & dashboards.

## Trial & Pricing Copy

- 90-Day Live Trial, no credit card. **First 30 days = onboarding window, remaining 60 days = full live use.** **Trial honors the selected tier** (no
  Elite preview). Reminders at 30/7/1 days remaining.
- 3rd-party usage (SignalWire/ElevenLabs/Resend/Tavily) = "Included in your tier".
- A2P 10DLC and Stripe transaction fees = paid directly to provider.
