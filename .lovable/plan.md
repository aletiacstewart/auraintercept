
# Comprehensive Platform Consistency Audit

## Summary of Issues Found
I identified **25+ inconsistencies** across the platform involving naming conventions, agent counts, tier configurations, and outdated references.

---

## Critical Issues

### 1. Agent Naming Inconsistencies (HIGH PRIORITY)

| Agent ID | Should Be (Per Memory) | Found Variations |
|----------|------------------------|------------------|
| `marketing` | Marketing Agent | "Promo Agent" (Index.tsx line 122-126, subscriptionAgentConfig.ts line 86) |
| `social_content` | Social Media Signal Agent | "Social Content Agent" (AgentTestConsole, useAIAgentOrchestrator), "Signal Creator" (TierComparisonCards) |
| `social_scheduler` | Signal Scheduler | "Social Scheduler Agent" (useAIAgentOrchestrator) |
| `social_analytics` | Signal Analytics | "Social Analytics Agent" (useAIAgentOrchestrator) |

**Files affected:**
- `src/pages/Index.tsx` - Marketing section shows "Promo Agent" (line 122-126)
- `src/lib/subscriptionAgentConfig.ts` - Uses `promo` not `marketing` (line 86)
- `src/hooks/useAIAgentOrchestrator.ts` - Incorrect social agent names (lines 71-73)
- `src/components/agents/TierComparisonCards.tsx` - Uses "Signal Creator" instead of "Social Media Signal Agent"
- `src/components/ai/agents/AgentTestConsole.tsx` - Uses old social agent names

---

### 2. Halo Tier Agent Count Mismatch (HIGH PRIORITY)

The Halo tier has **conflicting agent counts**:

| File | Agent Count |
|------|-------------|
| `documentationConfig.ts` | operatives: **4** |
| `subscriptionAgentConfig.ts` | agents array has **3** (triage, booking, followup) |
| `Subscription.tsx` | agentCount: **3** |
| `audit/types.ts` | agentCount: **3** |
| `PricingSummaryPDF.tsx` | operatives: **4** AND comparison table shows **4** |
| `AIAgentGuidesPDF.tsx` | agentCount: **4** |

**Resolution needed:** Determine if Halo has 3 or 4 agents, then synchronize across all files.

---

### 3. Voice Feature Naming Inconsistencies (MEDIUM PRIORITY)

Per branding standard (memory: style/branding-naming-standard-v4):
- "Talk to Aura (Voice)" - Correct
- "Ask Aura AI" - Used on landing page but should be "Talk to Aura (Voice)"
- "Proxy Voice Chat" - Legacy name found in PDFs and documentation

**Files with legacy naming:**
- `src/pages/Index.tsx` line 265-267: Uses "Ask Aura AI" instead of "Talk to Aura (Voice)"
- `src/pages/Settings.tsx` line 77: Tab labeled "Ask Aura" 
- `src/components/documentation/SalesPitchDataPDF.tsx`: Uses "Proxy Voice Chat"
- `src/components/documentation/PlatformDocumentPDF.tsx`: Uses "Proxy Voice Chat"

---

### 4. Marketing & Sales Agent Mismatch (MEDIUM PRIORITY)

The Marketing & Sales console has inconsistent agent lists:

| Source | Agents Listed |
|--------|---------------|
| documentationConfig.ts | campaign, marketing (2 agents) |
| subscriptionAgentConfig.ts | campaign, lead, promo (3 agents using old names) |
| Index.tsx agentCategories | Campaign, Lead, Promo (3 agents) |
| helpContentConfig.ts | Campaign Agent, Marketing Agent (2 agents) |

**Per memory (ai-operatives/marketing-agent-standardization):** Should be Campaign Agent, Lead Agent, Marketing Agent (3 agents total).

---

### 5. Landing Page Missing Express, Flow, Halo in Main Pricing Grid (MEDIUM PRIORITY)

The main pricing grid on Index.tsx (lines 707-938) shows only 4 tiers:
- Core, Single-Point, Multi-Track, Command

The industry-specific packages (Express, Flow, Halo) are shown separately below (lines 941-1100).

**Issue:** The "See More Details" comparison modal may not include all 7 tiers properly.

---

## Moderate Issues

### 6. subscriptionAgentConfig.ts Uses Legacy Agent IDs

The `command` tier lists legacy agent IDs that don't match the standardized naming:
```typescript
// Line 86 - uses 'promo' instead of 'marketing'
'campaign', 'lead', 'promo',
```

Should be:
```typescript
'campaign', 'lead', 'marketing',
```

---

### 7. useAIAgentOrchestrator.ts Has Wrong Agent Names

```typescript
// Lines 69-73 - wrong names
{ type: 'promo', name: 'Promo Agent', ... }
{ type: 'social_content', name: 'Social Content Agent', ... }
{ type: 'social_scheduler', name: 'Social Scheduler Agent', ... }
{ type: 'social_analytics', name: 'Social Analytics Agent', ... }
```

Should be:
```typescript
{ type: 'marketing', name: 'Marketing Agent', ... }
{ type: 'social_content', name: 'Social Media Signal Agent', ... }
{ type: 'social_scheduler', name: 'Signal Scheduler', ... }
{ type: 'social_analytics', name: 'Signal Analytics', ... }
```

---

### 8. AIAgentsHub.tsx AGENT_NAMES Missing Updates

Line 142-143 shows:
```typescript
lead: 'Lead Agent',
promo: 'Promo Agent',
```

Per memory, `promo` should be `marketing: 'Marketing Agent'`

---

### 9. Index.tsx agentCategories Uses Promo Agent

Lines 122-126:
```typescript
{
  name: 'Promo Agent',
  description: 'Manages promotional codes, discounts, and referral programs',
  icon: Gift
}
```

Should be:
```typescript
{
  name: 'Marketing Agent',
  description: 'Manages customer segments, promo codes, referral programs, and win-back automation',
  icon: Megaphone
}
```

---

## Documentation Issues

### 10. PricingSummaryPDF Still References Legacy Agent Count for Halo

The PDF shows Halo with 4 operatives but other sources show 3.

### 11. SalesPitchDataPDF Uses "Proxy Voice Chat" 

Multiple references to legacy "Proxy Voice Chat" terminology instead of "Talk to Aura (Voice)".

### 12. WebsiteCopyPDF Has Inconsistent Pricing

Line 589 shows "$497/mo" but there is no $497 tier in the current pricing structure.

---

## Files Requiring Updates

### High Priority (Core Functionality)

| File | Changes Required |
|------|-----------------|
| `src/lib/subscriptionAgentConfig.ts` | Replace `promo` with `marketing` in command tier agents |
| `src/hooks/useAIAgentOrchestrator.ts` | Fix agent names for marketing and social media agents |
| `src/pages/Index.tsx` | Update Promo Agent to Marketing Agent |
| `src/pages/AIAgentsHub.tsx` | Update AGENT_NAMES mapping |

### Medium Priority (Consistency)

| File | Changes Required |
|------|-----------------|
| `src/components/agents/TierComparisonCards.tsx` | Fix social_content name |
| `src/components/ai/agents/AgentTestConsole.tsx` | Fix social agent names |
| `src/pages/Settings.tsx` | Rename "Ask Aura" tab |

### Low Priority (Documentation)

| File | Changes Required |
|------|-----------------|
| `src/components/documentation/SalesPitchDataPDF.tsx` | Update "Proxy Voice Chat" references |
| `src/components/documentation/PlatformDocumentPDF.tsx` | Update "Proxy Voice Chat" references |
| `src/components/documentation/WebsiteCopyPDF.tsx` | Fix pricing reference |
| `src/components/documentation/PricingSummaryPDF.tsx` | Verify Halo agent count |

---

## Halo Agent Count Resolution

**Decision Required:** The Halo tier needs a definitive agent count.

**Option A (4 agents):** AI Receptionist, Scheduling Agent, Follow-up Agent + Voice Chat capabilities counted as an agent.

**Option B (3 agents):** AI Receptionist, Scheduling Agent, Follow-up Agent (Voice is a feature, not an agent).

**Recommendation:** Go with **3 agents** since Voice is a communication channel/feature, not a standalone AI agent. This aligns with the subscriptionAgentConfig.ts definition.

---

## Implementation Sequence

1. **Phase 1:** Resolve Halo agent count (decision needed)
2. **Phase 2:** Update agent naming across all config files
3. **Phase 3:** Update frontend components (Index.tsx, AIAgentsHub.tsx, etc.)
4. **Phase 4:** Update PDF documentation exports
5. **Phase 5:** Test audit recommendations and tier comparisons

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Naming inconsistencies | 8 |
| Agent count mismatches | 4 |
| Legacy terminology | 6 |
| Documentation errors | 4 |
| **Total issues** | **22** |

**Estimated effort:** 2-3 hours for implementation
