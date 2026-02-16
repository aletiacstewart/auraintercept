
# Platform-Wide Audit & Update Plan

## Executive Summary

After a deep review of the entire codebase -- all 7 integration pages, 24 AI operatives, the orchestrator, help center, setup guides, PDF exports, and the centralized documentation config -- here are the issues found and the updates needed.

---

## Part 1: Integration Audit Findings

### Current 3rd-Party Integrations (7 Total)
| Integration | Purpose | Per-Tenant? | Status |
|---|---|---|---|
| SignalWire | Voice & SMS | Yes (per-tenant account) | Good -- well-documented, A2P 10DLC covered |
| ElevenLabs | AI Voice Synthesis | Yes (per-tenant key) | Good -- detailed guide with tool configs |
| Resend | Email Notifications | Yes (per-tenant key) | Good -- webhook + domain setup guide |
| Google Calendar | Calendar Sync | Yes (per-tenant OAuth) | Good -- 3 sync methods (ICS, CalDAV, Google) |
| Stripe | Invoice Payments | Yes (per-tenant) | Good -- required for Logistics+ tiers |
| Social Media (Meta/LinkedIn/TikTok/Google) | Content Publishing | Platform-level OAuth (new) | Just implemented -- needs testing |
| Tavily | AI Web Research | Yes (per-tenant key) | **Issue found** (see below) |

### Integration Issues Found

**1. Tavily is NOT listed in `THIRD_PARTY_INTEGRATIONS` config array**
- `documentationConfig.ts` line 588-638 lists 7 integrations but does NOT include Tavily
- Tavily IS listed in `INTEGRATION_REQUIREMENTS` (lines 748-831) with its own `IntegrationId`
- The `TavilyIntegration.tsx` page and `TavilySetupGuide.tsx` exist and work
- **Fix**: Add Tavily to `THIRD_PARTY_INTEGRATIONS` array

**2. `THIRD_PARTY_INTEGRATIONS` still references "Google Gemini" from old memory**
- Memory file `3rd-party-requirements-standard.md` mentions "Google Gemini" as required for all tiers
- The actual codebase uses Lovable AI gateway (not a per-tenant Google Gemini key)
- There is NO Google Gemini integration page or setup
- **Fix**: Confirm this is handled by Lovable AI and remove from any docs referencing it as a separate integration

**3. Social Media integration config is outdated in `THIRD_PARTY_INTEGRATIONS`**
- Currently listed as "Social Media Accounts" with `requiredFor: 'Core+'`
- After Option A implementation, this should reference the new platform-level OAuth model
- **Fix**: Update description and `requiredFor` to reflect new architecture (Growth+ since `social_content` agent starts at `aura_flow`)

**4. `documentationConfig.ts` `INTEGRATION_REQUIREMENTS` is missing social media as a tracked integration**
- The `IntegrationId` type only includes: `stripe`, `signalwire`, `elevenlabs`, `resend`, `tavily`, `calendar`, `a2p_10dlc`
- Social media is not tracked per-tier in `INTEGRATION_REQUIREMENTS`
- **Fix**: Add `social_media` to `IntegrationId` and populate per-tier requirements

---

## Part 2: AI Agent / Orchestrator Audit Findings

### Orchestrator `AGENT_TYPES` is Missing 7 Agents
The `ai-orchestrator/index.ts` (line 10-37) defines only **17** agent types:
- `triage`, `booking`, `followup`, `review`
- `dispatch`, `route`, `eta`, `checkin`
- `quoting`, `invoice`, `inventory`, `admin`
- `marketing` (consolidated)
- `insights`, `forecast`, `revenue`, `performance`

**Missing from orchestrator** (7 agents):
1. `campaign` -- Campaign Agent (marketing_sales console)
2. `lead` -- Lead Agent (marketing_sales console)
3. `social_content` -- Social Media Agent (social_media console)
4. `social_scheduler` -- Social Scheduler (social_media console)
5. `social_analytics` -- Social Analytics (social_media console)
6. `creative` -- Creative Agent (creative_web_presence console)
7. `web_presence` -- Web Presence Agent (creative_web_presence console)

These 7 agents exist in `documentationConfig.ts` as part of the 24 operatives but the orchestrator cannot route events to them, configure them, or test them.

### EVENT_ROUTING References Non-Existent Agents
The orchestrator's `EVENT_ROUTING` (line 40-57) references agents that don't exist in `AGENT_TYPES`:
- `waitlist` (line 43) -- not a defined agent
- `invoicing` (lines 48-50) -- should be `invoice`
- `predictive` (lines 51, 53) -- not a defined agent

### Missing Event Routes for New Agents
No event routing exists for:
- Marketing stack events (campaign created, lead qualified, etc.)
- Social media events (content generated, post scheduled, post published)
- Creative events (content generated, blog published)
- Web presence events (SEO scan complete, site updated)

---

## Part 3: Help Center & Documentation Issues

### AIHelpCenter System Prompt Inconsistencies
The help center (`AIHelpCenter.tsx` line 70-153) has several mismatches with actual configuration:

1. **Console count**: Says "8 Control Centers" -- should be "7 Control Centers + 1 Management Interface (AI Operatives Hub)"
2. **Tier names don't match**: Uses old names (Starter, Scheduling, Growth, Business, Field Ops, Performance, Command) but actual tier names in `documentationConfig.ts` are (Aura Starter, Aura Connect, Aura Growth, Aura Presence, Aura Logistics, Aura Performance, Aura Command)
3. **Agent counts per tier don't match**: Says "Starter: 1 agent, 0 consoles" but `documentationConfig.ts` says Express has 1 operative and 0 consoles (correct count but wrong name)
4. **Troubleshooting section**: No mention of social media OAuth troubleshooting (new system)
5. **Missing integration paths**: No mention of `/dashboard/integrations/social` for social OAuth or `/dashboard/integrations/tavily` for AI research

### ComprehensiveGuidesPDF and CompanyGuidesPDF
These PDFs are generated from hardcoded guide data inside each component, NOT from `documentationConfig.ts`. This means:
- Any changes to tier names, prices, or agent counts need to be updated in multiple places
- Social media guides in the PDFs still reference the old per-tenant credential model
- The Option A (platform OAuth) flow is not reflected in any PDF

### PlatformGuides Page
- Contains hardcoded guide categories (not from centralized config)
- Social media sections need to reference the new OAuth model
- Integration troubleshooting guides need updating

---

## Part 4: Implementation Plan

### Step 1: Fix Orchestrator -- Add Missing 7 Agents
Update `supabase/functions/ai-orchestrator/index.ts`:
- Add `campaign`, `lead`, `social_content`, `social_scheduler`, `social_analytics`, `creative`, `web_presence` to `AGENT_TYPES`
- Fix `EVENT_ROUTING`: rename `invoicing` to `invoice`, remove `waitlist` and `predictive`, add routes for new agent events
- Add new event types: `content_generated`, `post_scheduled`, `post_published`, `campaign_created`, `lead_qualified`, `blog_published`, `seo_scan_complete`

### Step 2: Update `documentationConfig.ts`
- Add Tavily to `THIRD_PARTY_INTEGRATIONS` array
- Add `social_media` to `IntegrationId` type and populate per-tier requirements
- Update Social Media entry to reflect platform-level OAuth model
- Verify all tier names and prices are consistent

### Step 3: Update AIHelpCenter System Prompt
- Fix console count to "7 Control Centers + AI Operatives Hub management interface"
- Update tier names to match (Aura Starter, Aura Connect, etc.)
- Add social media OAuth troubleshooting
- Add missing integration navigation paths
- Add new agent descriptions for campaign, lead, social content, social scheduler, social analytics, creative, web presence

### Step 4: Update PDF Export Documents
- Update `ComprehensiveGuidesPDF.tsx` social media sections for Option A OAuth model
- Update `CompanyGuidesPDF.tsx` integration sections
- Ensure tier names and prices match `documentationConfig.ts`

### Step 5: Update PlatformGuides Page
- Update social media guide sections for OAuth model
- Add Tavily/AI Research guide section if missing
- Ensure consistency with documentationConfig

### Step 6: Update Setup Guides
- `SocialMediaSetupGuide.tsx` -- Already updated for Option A (verified)
- `ElevenLabsSetupGuide.tsx` -- Good as-is
- `SignalWireSetupGuide.tsx` -- Good as-is
- `ResendSetupGuide.tsx` -- Good as-is
- `TavilySetupGuide.tsx` -- Good as-is

---

## Technical Summary of Files to Modify

| File | Changes |
|---|---|
| `supabase/functions/ai-orchestrator/index.ts` | Add 7 missing agents to AGENT_TYPES, fix EVENT_ROUTING |
| `src/lib/documentationConfig.ts` | Add Tavily to THIRD_PARTY_INTEGRATIONS, add social_media IntegrationId |
| `src/components/help/AIHelpCenter.tsx` | Update system prompt (tier names, console count, new agents, OAuth troubleshooting) |
| `src/components/documentation/ComprehensiveGuidesPDF.tsx` | Update social media + integration sections for Option A |
| `src/components/documentation/CompanyGuidesPDF.tsx` | Update integration references |
| `src/pages/PlatformGuides.tsx` | Update social media guide content |

No new files needed. No database changes needed.
