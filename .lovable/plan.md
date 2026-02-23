

# Update AI Agent Demo to Showcase All 24 AI Operatives

## Overview
The current demo only shows 4 scenes with a handful of agents (Triage, Booking, Follow-up, Dispatch). This update will expand it into a comprehensive, multi-scene walkthrough covering all 24 AI operatives organized by their 7 consoles, showing their flows, dependencies, and features.

## Current State
- 4 scenes covering only ~6 agents (Customer, Triage, Booking, Follow-up, Dispatch)
- Scenes focus on a simplified customer journey
- Missing 18+ agents across Marketing, Social Media, Business Ops, Analytics, and Creative consoles

## Proposed Scene Structure (10 Scenes)

**Scene 1 -- Customer Reaches Out** (keep existing, minor polish)
- Customer connects to AI Receptionist (Triage) via Call/Chat/SMS

**Scene 2 -- Customer Portal Console** (expanded)
- Shows all 4 Customer Portal agents: Triage, Booking, Follow-up, Review
- Flow: Triage routes to Booking and Follow-up; Follow-up triggers Review
- Features highlighted: 24/7 coverage, calendar sync, SMS reminders, Google/Yelp reviews

**Scene 3 -- Outreach and Sales Console**
- Campaign, Lead, Marketing agents
- Flow: Campaign creates outreach, Lead qualifies responses, Marketing manages segments and promos
- Features: Email/SMS campaigns, lead scoring, promo codes, referral tracking, win-back

**Scene 4 -- Social Media Console**
- Social Content, Social Scheduler, Social Analytics agents
- Flow: Content creates posts for 6 platforms, Scheduler queues them, Analytics tracks performance
- Features: Multi-platform posting, content calendar, engagement metrics

**Scene 5 -- Creative and Web Presence Console**
- Creative and Web Presence agents
- Flow: Creative generates content for all channels, Web Presence manages SEO and blog publishing
- Features: On-brand content generation, SEO optimization, auto-publishing

**Scene 6 -- Field Operations Console**
- Dispatch, Route, ETA, Check-in agents
- Flow: Dispatch assigns technician, Route optimizes path, ETA updates customer, Check-in logs arrival
- Features: Skills-based assignment, traffic-aware routing, real-time ETA updates

**Scene 7 -- Business Operations Console**
- Admin, Quoting, Invoice, Inventory agents
- Flow: Quoting creates estimates, Invoice generates bills, Inventory tracks stock, Admin manages settings
- Features: Multi-line quotes, payment tracking, low-stock alerts

**Scene 8 -- Analytics and Reports Console**
- Insights, Performance, Revenue, Forecast agents
- Flow: Insights answers questions, Performance tracks KPIs, Revenue analyzes financials, Forecast predicts demand
- Features: Natural language queries, KPI dashboards, revenue trends, demand prediction

**Scene 9 -- The Full Network** (new overview scene)
- Shows all 24 agents in a connected network view with consoles as clusters
- Lines show cross-console dependencies (e.g., Follow-up triggers Review triggers Campaign)
- Demonstrates how the entire system works together

**Scene 10 -- Everyone Benefits** (keep existing scene 4, enhanced)
- Company, Customer, Employee benefit summary with updated stats reflecting all 24 agents

## Technical Approach

1. **Pull agent data from `documentationConfig.ts`** -- Import `AI_OPERATIVES` and `CONSOLES` as the source of truth for agent names, descriptions, and dependencies, rather than hardcoding
2. **Refactor scene data** -- Replace the 4-scene hardcoded array with 10 scenes, each with properly positioned nodes using the existing coordinate system
3. **Add console color coding** -- Each console's agents share a color (matching the existing `agentStyles.ts` color scheme)
4. **Enhance narration** -- Each scene narration describes the console's purpose and the agents' features
5. **Update script download** -- The exported script text will include all 10 scenes
6. **Keep all existing UI** -- Top bar, controls, auto-play (adjust timer per scene), progress dots all stay the same

## Files to Modify
- `src/pages/AIAgentFlowDemo.tsx` -- Main and only file; replace scene data, import from documentationConfig for agent metadata in narrations

