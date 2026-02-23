

# Platform-Wide Audit & Synchronization Update

## Summary of Issues Found

After a deep audit across backend edge functions, frontend guides, demo pages, help center, and configuration files, I identified **23 discrepancies** that need fixing across documentation, guides, and "how to use" content to match the actual system state after the recent handoff/routing updates.

---

## Category 1: Pricing & Agent Count Discrepancies (Backend vs Frontend)

### Issue 1: Command Tier Price Mismatch
- **ai-agent-chat/index.ts line 2590**: Says `$5,497/mo` for Command
- **subscriptionAgentConfig.ts line 124**: Says `$3,497/mo`
- **documentationConfig.ts line 186**: Says `$3,497/mo`
- **Fix**: Update backend comment to `$3,497/mo` (the config files are the source of truth)

### Issue 2: Performance Tier Agent Count Mismatch
- **ai-agent-chat/index.ts lines 2579-2589**: Performance tier has 23 agents (includes `analytics` agent)
- **subscriptionAgentConfig.ts line 86-96**: Performance tier has 22 agents (no `analytics` agent)
- **documentationConfig.ts line 167**: Says "22 AI Operatives"
- **AI Help Center line 130**: Says "22 agents"
- **Fix**: The `analytics` agent in the backend is an extra/legacy agent not in the official 24-operative roster. Either remove it from the backend tier list, or align. Recommend keeping the frontend as source of truth (22 agents for Performance) and noting `analytics` is a utility agent, not a numbered operative.

### Issue 3: Command Tier Agent Count
- **ai-agent-chat/index.ts line 2599**: Says "25 agents" (includes `analytics`)
- **subscriptionAgentConfig.ts/documentationConfig.ts**: Says "24 agents"
- **Fix**: Same issue as above -- `analytics` is the 25th agent in the backend but the marketed count is 24.

---

## Category 2: Social Media Console Tab Names (Outdated Documentation)

### Issue 4: Social Media Ops Console Tabs
- **documentationConfig.ts line 540**: Tabs listed as `['Home', 'Social Posts', 'Analytics']`
- **Actual SocialMediaAgentConsole.tsx**: Tabs are `Home`, `Create Content`, `My Posts`
- **Platform Guides line 494**: Says "Tabs: Home, Social Posts, Analytics" (wrong)
- **Platform Guides line 1121**: Says "Quick Action Tabs: Home, Templates, Compose, Schedule, Analytics" (completely wrong)
- **Fix**: Update all references to `['Home', 'Create Content', 'My Posts']`

---

## Category 3: Platform Guides - Outdated Content

### Issue 5: Social Media Console Guide (line 1117-1141)
- References "3-Step Content Wizard", "Templates", "Compose", "Schedule" tabs
- Actual system uses `MultiChannelGenerator` with `AI Suggest` and `Industry Templates`
- **Fix**: Rewrite to describe the actual flow: Home (AI Chat), Create Content (MultiChannelGenerator with AI Suggest, Industry Templates, Manual Bridge posting), My Posts (SocialFeedQueue for drafts/published)

### Issue 6: Platform Guides Social Config (line 1143-1154)
- Says "Platform admin configures global OAuth credentials" and "Tenants click Connect"
- **Actual**: Manual Bridge is default; Own API Credentials is advanced option; Platform-level OAuth is "Coming Soon"
- **Fix**: Update to match dual-mode posting strategy (Manual Bridge default, Own API advanced)

### Issue 7: Customer Portal Guide Tabs (line 436-445)
- Lists tabs as: "Chat, Voice, Services, Hours, Feedback, Track, Billing"
- **Actual**: AIAgentConsole uses standardized tabs: "AI Assistant, Services, Appointments (tier-aware), Voice AI (feature-enabled), Contact, Hours"
- **Fix**: Update tab list to match actual implementation

### Issue 8: Business Ops Console Guide (line 929)
- Says "Inventory tab requires Command tier"
- **subscriptionAgentConfig.ts**: `inventory` agent is in `performance` tier
- **documentationConfig.ts**: inventory agent tier is `command`
- **Fix**: Align -- inventory is in `performance` tier per subscriptionAgentConfig (the runtime gatekeeper)

### Issue 9: "8 Control Centers Overview" (line 160)
- Lists "8 Control Centers" including AI Operatives Hub
- **Actual**: 7 Control Centers + 1 Management Interface (AI Operatives Hub is not a console)
- **Fix**: Change to "7 Control Centers + AI Operatives Hub (Management Interface)"

---

## Category 4: AI Help Center System Prompt Outdated

### Issue 10: Social Media Console Description
- Help Center line 43-47: References "Manual Bridge posting" correctly but console tab names are not mentioned
- **Fix**: Add actual tab names (Home, Create Content, My Posts)

### Issue 11: Navigation Paths Missing New Agent Handoffs
- No mention of agent handoff capabilities in troubleshooting
- **Fix**: Add note about cross-console handoffs (booking to followup, inventory to quoting, etc.)

---

## Category 5: Missing `handoff_to_agent` System Prompt Instructions

### Issue 12: forecast agent prompt (line 618-636)
- Has no handoff instructions despite having a handoff tool with targets `insights` and `performance`
- **Fix**: Add: "After generating forecasts, use handoff_to_agent to share with insights or performance agents"

### Issue 13: revenue agent prompt (line 638-657)
- Has no handoff instructions despite having a handoff tool with targets `forecast` and `insights`
- **Fix**: Add: "After revenue analysis, use handoff_to_agent to share findings with forecast or insights agents"

### Issue 14: performance agent prompt (line 659-680)
- Has no handoff instructions despite having a handoff tool with targets `revenue` and `forecast`
- **Fix**: Add: "For deeper financial analysis, use handoff_to_agent to hand off to revenue or forecast agents"

### Issue 15: campaign agent prompt (line 682-701)
- Has no handoff instructions despite having a handoff tool with targets `marketing` and `lead`
- **Fix**: Add: "After campaign analysis, use handoff_to_agent to feed results back to marketing for segmentation or lead for scoring"

### Issue 16: web_presence agent has no system prompt
- `web_presence` has a handoff tool (targets: `social_content`) but no entry in AGENT_PROMPTS
- **Fix**: Add a web_presence system prompt with instruction to hand off published content to social_content

### Issue 17: social_content agent prompt has no handoff instruction
- social_content has tools shared via `social` key which includes handoff to `social_content, social_scheduler, insights, web_presence`
- But the prompt doesn't mention using handoffs
- **Fix**: Add instruction to hand off to social_scheduler for scheduling and web_presence for cross-publishing

### Issue 18: creative agent has no system prompt
- No `creative` entry in AGENT_PROMPTS
- **Fix**: Add a creative agent prompt describing multi-channel content generation

---

## Category 6: Backend Route Agent Missing Handoff Target

### Issue 19: route agent handoff targets
- **Plan said**: Add `checkin` to route agent targets
- **Current**: route agent tool has `enum: ['eta', 'dispatch']` (line 1327-1342 area)
- The plan was implemented for most agents but need to verify route has checkin
- **Fix**: Verify and add `checkin` to route agent handoff enum if missing

---

## Category 7: documentationConfig.ts Stale Console Tabs

### Issue 20: Social Media tabs in CONSOLES array
- Line 540: `tabs: ['Home', 'Social Posts', 'Analytics']`
- **Actual**: `['Home', 'Create Content', 'My Posts']`
- **Fix**: Update

### Issue 21: Customer Portal tabs
- Line 504: `tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Feedback', 'Track', 'Billing']`
- **Actual**: `['AI Assistant', 'Services', 'Appointments', 'Voice AI', 'Contact', 'Hours']`
- **Fix**: Update

---

## Category 8: Platform Guides Navigation Routes

### Issue 22: Stale navigation routes (lines 33-81)
- Several routes are wrong:
  - `'AI Agents Hub'` points to `/dashboard/ai-agents-hub` (should be `/dashboard/ai-operatives-hub`)
  - `'Field Operations'` points to `/dashboard/ai-consoles/field-ops` (should be `/dashboard/ai-consoles/field-operations`)
  - `'Business Ops Hub'` points to `/dashboard/ai-consoles/business-ops` (should be `/dashboard/ai-consoles/business-mgt-ops`)
  - `'Outreach & Sales Ops'` points to `/dashboard/ai-consoles/marketing` (should be `/dashboard/ai-consoles/outreach-sales`)
  - `'Analytics & Reports Ops'` points to `/dashboard/ai-consoles/analytics` (should be `/dashboard/ai-consoles/analytics-reports`)
- **Fix**: Correct all navigation routes to match actual router paths

---

## Files to Modify

| File | Changes |
|---|---|
| `supabase/functions/ai-agent-chat/index.ts` | Fix price comment, add missing system prompts (web_presence, creative), add handoff instructions to forecast/revenue/performance/campaign/social_content prompts, verify route agent handoff enum |
| `src/lib/documentationConfig.ts` | Update Social Media console tabs, Customer Portal console tabs |
| `src/pages/PlatformGuides.tsx` | Fix navigation routes, update Social Media guide, update Customer Portal tabs, fix "8 Control Centers" to "7+1", update console tab lists throughout |
| `src/components/help/AIHelpCenter.tsx` | Update Social Media console tab references in system prompt |

## Implementation Order

1. Fix backend agent prompts and comments (ai-agent-chat/index.ts)
2. Update documentationConfig.ts console tabs
3. Update PlatformGuides.tsx navigation routes and guide content
4. Update AIHelpCenter.tsx system prompt

