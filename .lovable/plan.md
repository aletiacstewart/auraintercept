
# Remove Warranty Agent from Platform

## Summary
Complete removal of the Warranty Agent and all warranty-related functionality from the platform. This affects 20+ files across configuration, UI components, settings, edge functions, and documentation.

---

## Files to Delete (7 files)

| File | Purpose |
|------|---------|
| `src/pages/Warranties.tsx` | Standalone warranties page |
| `src/components/settings/WarrantySettings.tsx` | Warranty settings tab component |
| `src/components/knowledge/WarrantiesManager.tsx` | Main warranty management UI |
| `src/components/warranties/WarrantyPoliciesList.tsx` | Policy list component |
| `src/components/warranties/WarrantyPolicyForm.tsx` | Policy creation form |
| `src/components/warranties/WarrantyReportForm.tsx` | Report form |
| `src/components/billing/forms/WarrantyForm.tsx` | Warranty creation form |
| `src/components/billing/forms/WarrantyLookupForm.tsx` | Warranty lookup form |

---

## Configuration Files to Update

### 1. src/lib/agentStyles.ts
- Remove `warranty` from `AGENT_STYLES` object
- Remove `'warranty'` from `businessOperations` array in `AGENT_CATEGORIES`

### 2. src/lib/documentationConfig.ts
- Remove warranty agent object from `AI_OPERATIVES` array
- Update `business_management` console `agentCount` from 5 to 4
- Remove "Warranty claims tracking" from command tier highlights

### 3. src/lib/subscriptionAgentConfig.ts
- Remove `'warranty'` from command tier agents array
- Update comment "Business Operations (5)" → "Business Operations (4)"
- Remove `'can_access_warranties'` from `TIER_FEATURE_CONFIG.command`

---

## Page Updates

### 4. src/pages/Settings.tsx
- Remove `WarrantySettings` import
- Remove `'warranties'` from `VALID_TABS` array
- Remove `<TabsTrigger value="warranties">` element
- Remove `<TabsContent value="warranties">` block

### 5. src/pages/AgentDetailPage.tsx
- Remove `warranty` object from `AGENT_DEFINITIONS`
- Remove `'warranty'` from `PLATFORM_ADMIN_ONLY_AGENTS` array

### 6. src/pages/Index.tsx
- Remove Warranty Agent from business operations agents list
- Remove "Warranty management" from Business Management Console features

### 7. src/pages/KnowledgeBase.tsx
- Remove `WarrantiesManager` import
- Remove warranties tab (`TabsTrigger` and `TabsContent`)

### 8. src/pages/PlatformGuides.tsx
- Remove "Warranty Agent" from training content
- Remove "Warranty Management" and "Warranty Policies" sections
- Remove warranty references from tips and descriptions

---

## Component Updates

### 9. src/components/billing/BusinessOpsAgentConsole.tsx
- Remove `WarrantiesManager` import
- Remove `showWarrantiesManager` state
- Remove warranty handler in `handleQuickAction`
- Remove warranty from `isShowingForm` check
- Remove warranty section from render

### 10. src/components/businessops/BusinessOpsHubTabs.tsx
- Remove `WarrantiesManager` import
- Remove warranty `AccordionItem` sections (2 occurrences)

---

## Edge Function Updates

### 11. supabase/functions/ai-agent-chat/index.ts
- Remove `warranty` system prompt from `AGENT_PROMPTS`
- Remove "Warranty Check/Claim" from admin prompt
- Remove `'warranty'` from `TIER_AGENTS.command` array
- Remove `warranty` tools from `AGENT_TOOLS`
- Remove `check_warranty` from admin tools
- Remove `check_warranty` and `submit_warranty_claim` tool handlers

### 12. supabase/functions/generate-social-variations/index.ts
- Remove `warranty_policies` query from knowledge base fetch

---

## Summary of Changes

| Category | Files Affected |
|----------|----------------|
| Delete files | 8 |
| Configuration | 3 |
| Pages | 5 |
| Components | 2 |
| Edge functions | 2 |
| **Total** | **20 files** |

---

## Result After Changes

- Business Operations Console will have **4 agents**: Admin, Quoting, Invoice, Inventory
- No warranty-related UI, settings, or documentation
- Edge functions will no longer process warranty requests
- Agent count updates from 24 to 23 total operatives
