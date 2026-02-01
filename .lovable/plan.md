# Marketing & Sales Console: Agent Clarification Fix

## ✅ COMPLETED

Fixed the Marketing & Sales Console to have **3 distinct agents** with clear, non-overlapping purposes.

## Changes Made

### 1. documentationConfig.ts ✅
- Updated comment from "2 agents" to "3 agents"
- Added Lead Agent definition
- Clarified Campaign Agent description: "Creates and sends email/SMS campaigns"
- Clarified Marketing Agent description: "Manages customer segments, promo codes, referral tracking"

### 2. Index.tsx ✅
- Campaign Agent: "Creates and schedules email and SMS marketing campaigns with performance analytics"
- Lead Agent: "Qualifies and scores leads with automated follow-up sequences"
- Marketing Agent: "Manages customer segments, promo codes, and referral programs"
- Changed Marketing Agent icon from Megaphone to Target for visual distinction

### 3. ai-agent-chat Edge Function ✅
- Renamed `promo` agent prompt to `marketing`
- Updated INTERNAL_AGENTS list: `promo` → `marketing`
- Updated TIER_AGENTS.command list: `promo` → `marketing`
- Removed duplicate tools entry

## Result

Marketing & Sales Console now has **3 clearly distinct agents**:

| Agent ID | Name | Distinct Purpose |
|----------|------|------------------|
| `campaign` | Campaign Agent | **Execution** - Creates and sends email/SMS campaigns, manages campaign scheduling and performance analytics |
| `lead` | Lead Agent | **Pipeline** - Qualifies incoming leads, scores them based on engagement, automates follow-up sequences |
| `marketing` | Marketing Agent | **Segmentation** - Manages customer segments, promo codes, referral tracking, and win-back targeting |

Total AI Operatives: **23** (matching the "23 Specialized AI Operatives" marketing messaging)
