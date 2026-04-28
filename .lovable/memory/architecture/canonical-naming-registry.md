---
name: Canonical Naming Registry
description: Single source of truth for tier names, console titles, and AI agent display names — prevents naming drift across UI, PDFs, and guides
type: feature
---
# Canonical Naming Registry

Source-of-truth files (DO NOT drift from these):
- Tier IDs/labels/prices: src/lib/subscriptionAgentConfig.ts (TIER_AGENT_CONFIG)
- Plain-English customer rollup labels: src/lib/agentStyles.ts (AGENT_STYLES)

## Tiers (4 + free)
- starter = Aura Core $197/mo, $0 impl, 8 agents / 3 consoles
- connect = Aura Boost $497/mo, $299 impl, 12 agents / 5 consoles
- performance = Aura Pro $997/mo, $599 impl, 16 agents / 5 consoles
- command = Aura Elite $1,997/mo, $999 impl, 24 agents / 7 consoles + AI Hub

## 7 Consoles (canonical display titles — do not abbreviate)
Customer Portal Console · Field Operations Console · Business Management Console · Outreach & Sales Console · Social Media Console · Creative & Web Presence Console · Analytics & Reports Console (+ AI Operatives Hub on Elite).

Forbidden variants: "Mgt Ops", "Business Ops Hub", "Technician-Field Ops", "Analytics & Reports Ops", "Social Media Ops", "Outreach & Sales Ops", "Field Ops + Dispatch Operative".

## 24 AI Agents (canonical display names)
- Customer Portal: AI Receptionist, Booking Agent, Follow-Up Agent, Review Agent
- Field Operations: Dispatch Agent, Route Agent, ETA Agent, Check-In Agent
- Business Management: Admin Agent, Quoting Agent, Invoice Agent, Inventory Agent
- Outreach & Sales: Lead Agent, Marketing Agent, Campaign Agent, Outreach Agent
- Creative & Web: Creative Content Agent, Web Presence Agent
- Social Media: Social Scheduler Agent, Social Analytics Agent
- Analytics & Reports: Insights Agent, Performance Agent, Revenue Agent, Forecast Agent

Forbidden variants: "Scheduling Agent" (use Booking Agent), "Social Feed Queue" (use Social Scheduler Agent), "Customer Insights Agent" (use Insights Agent).

## Plain-English Customer Labels (agentStyles.ts — keep, do not change)
Front Desk · On The Way · Office/Billing · Marketing · Social Posts · Reports · Website. Customer-facing rollups for chat & dashboards.

## Trial & Pricing Copy
- 90-day free trial, no credit card. Trial reminders at 30/7/1 days remaining.
- 3rd-party usage (SignalWire, ElevenLabs, Resend, Tavily) = "Included in your tier".
- A2P 10DLC and Stripe transaction fees = paid directly to provider.
