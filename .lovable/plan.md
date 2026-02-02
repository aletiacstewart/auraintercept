
# Complete Warranty Feature Removal Plan

## Overview
This plan removes **every mention of warranty** from the entire platform, including UI components, AI agents, backend functions, database tables, voice navigation, help guides, legal documents, PDF exports, and configuration files.

---

## Summary of Files to Update

| Category | Files | Changes |
|----------|-------|---------|
| Dashboard Components | 4 files | Remove warranty stats, cards, queries |
| AI Agent Components | 6 files | Remove warranty agent references |
| Edge Functions | 3 files | Remove warranty tools and agent logic |
| Navigation & Voice | 3 files | Remove warranty routes and commands |
| Pages (Guides/Help) | 5 files | Remove warranty mentions from text |
| Documentation PDFs | 3 files | Remove warranty from exports |
| Hooks & Utilities | 3 files | Remove from permissions, colors, detection |
| Configuration | 2 files | Remove feature color definitions |
| Database | 3 tables | Drop warranty_records, warranty_policies, warranty_claims |

**Total: ~32 files + 3 database tables**

---

## Technical Implementation

### 1. Dashboard Components

**CompanyAdminDashboard.tsx**
- Remove `warranty_policies` query from Promise.all (line 69)
- Remove `warrantyCount` calculation (line 125)
- Remove "Warranties" stat card (lines 268-276)
- Remove "Warranties" quick action (line 324)
- Remove `Shield` icon import if unused

**PlatformAdminDashboard.tsx**
- Remove `warranty_policies` query (line 53)
- Remove `warranties` from stats calculation (line 119)
- Remove "Warranties" stat card (lines 261-267)
- Remove `Shield` icon import if unused

**DashboardSetupNav.tsx**
- Remove `warranty_policies` query (line 63)

**SetupProgressBar.tsx**
- Remove warranty policies count query (lines 63-67)

---

### 2. AI Agent Components

**AgentHowToGuide.tsx**
- Remove entire warranty guide entry (lines 385-396)

**AgentTestConsole.tsx**
- Remove warranty test prompts array (lines 155-159)

**OperativeDependencyGraph.tsx**
- Remove `warranty: 'Warranty'` from mapping (line 50)
- Remove `warranty: []` from dependencies (line 77)

**AgentWorkflowMonitor.tsx**
- Remove `warranty: Briefcase` icon mapping (line 48)

**BatchAgentActivation.tsx**
- Remove `'warranty'` from business_operations agents array (line 45)
- Remove `'warranty'` from HIDDEN_AGENTS (line 66)

**AuraAgentPulse.tsx**
- Remove `warranty: { icon: Shield, label: 'Warranty' }` (line 37)

---

### 3. Edge Functions

**ai-orchestrator/index.ts**
- Remove warranty agent definition (line 27)
- Remove warranty case handler (lines 670-684)

**ai-agent-chat/index.ts**
- Remove warranty mentions from system prompt (line 795)
- Remove `'warranty'` from target_agent enum (line 822)
- Remove WARRANTY TOOLS section and handlers (lines 4363-4460+)

**generate-social-content/index.ts**
- Remove warranty_policies query (lines 115-116)

---

### 4. Navigation & Voice

**voiceNavigation.ts**
- Remove `'warranties': '/dashboard/warranties'` (line 93)

**useUnifiedAura.ts**
- Remove `/dashboard/warranties` context description (line 57)

**auraIntentDetection.ts**
- Remove `warranties?` from BUSINESS_ENTITIES regex (line 7)
- Remove `warranties?` from all pattern regexes (lines 29-34)

---

### 5. Pages (Guides, Help, Legal)

**Help.tsx**
- Remove warranty mentions from pricing tier descriptions (line 699)

**PlatformGuides.tsx**
- Remove warranty mentions from job tracking tips (line 557)
- Remove warranty tab mention from business ops guide (line 604)
- Remove warranty from document upload descriptions (line 982)
- Remove 'Warranty Management' and 'Warranty Policies' from EXCLUDED_TABS (lines 1022-1023)

**AIAgentsHub.tsx**
- Remove `'warranty'` from billing role agents (line 121)
- Remove `'warranty'` from inventory role agents (line 124)
- Remove `'warranty'` from HIDDEN_AGENTS (line 237)

**Auth.tsx**
- Remove "warranty lookups" mention from feature description (line 606)

**TermsOfService.tsx**
- Keep as-is OR reword legal disclaimer (this is a legal "without warranty" clause - different context)

---

### 6. Documentation PDFs

**AIAgentGuidesPDF.tsx**
- Remove 'Handle Warranties' from feature list (line 469)

**PricingSummaryPDF.tsx**
- Remove "warranties" from Business Operations Console description (line 959)

**IndustryMarketingKitPDF.tsx**
- Remove "warranty coverage" from post-service check-in template (lines 702-703)
- Replace "3-year warranty" with "quality guarantee" or similar (line 560)

---

### 7. Hooks & Utilities

**useRolePermissions.ts**
- Remove `'warranty'` from customer_service agents (line 129)
- Remove `'warranty'` from manager agents (line 130)
- Remove `'warranty'` from billing agents (line 131)
- Remove `'warranty'` from inventory agents (line 133)

**featureColors.ts**
- Remove entire `warranties` color definition (lines 66-72)

**helpContentConfig.ts**
- Remove "warranty administration" from description (line 137)
- Remove "Warranty claims and policy tracking" feature (line 154)
- Remove warranty example command (line 165)
- Remove "Warranty claims tracking" from tier features (line 440)

---

### 8. Configuration Files

**page-header.tsx**
- Remove `| 'warranties'` from FeatureColor type (line 15)
- Remove warranties entry from featureColorClasses (line 47)

**tailwind.config.lov.json**
- Remove all `"warranties": "hsl(var(--feature-warranties))"` entries (multiple theme sections)

---

### 9. Database Changes (Migration)

```sql
-- Drop warranty-related tables
DROP TABLE IF EXISTS warranty_claims CASCADE;
DROP TABLE IF EXISTS warranty_records CASCADE;
DROP TABLE IF EXISTS warranty_policies CASCADE;

-- Drop related functions if any
DROP FUNCTION IF EXISTS get_company_warranty_policies(uuid);
```

---

## Verification Checklist

After implementation:
1. Search codebase for "warranty" - should return 0 results (except possible comments)
2. Test voice navigation - warranty commands should not be recognized
3. Test AI agent chat - warranty requests should be handled gracefully
4. Verify dashboards load without warranty stats
5. Check PDF exports render without warranty content
6. Confirm database tables are removed

---

## Impact Assessment

- **AI Operative Count**: 23 to 22 (removing Warranty Agent)
- **Stat Cards**: Reduced by 1 on both Company and Platform dashboards
- **Quick Actions**: Reduced by 1
- **Voice Commands**: Warranty-related commands removed
- **Database Tables**: 3 tables dropped (warranty_records, warranty_policies, warranty_claims)
