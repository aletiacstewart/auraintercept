
# Rename: Marketing & Sales → Outreach & Sales Ops + Segments → Marketing

## Summary
Two naming changes across the platform:
1. **"Segments" → "Marketing"** in the console tabs
2. **"Marketing & Sales" → "Outreach & Sales Ops"** platform-wide

---

## Changes Required

### Console Component Updates

| File | Change |
|------|--------|
| `src/components/marketing/MarketingSalesAgentConsole.tsx` | Change `label: 'Segments'` to `label: 'Marketing'` in QUICK_ACTIONS |
| `src/pages/ai-consoles/MarketingSalesConsole.tsx` | Change page title to "Outreach & Sales Ops" |

### Navigation & Configuration

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Change sidebar label from "Marketing & Sales Ops" to "Outreach & Sales Ops" |
| `src/lib/voiceNavigation.ts` | Add "outreach" voice command aliases |
| `src/lib/documentationConfig.ts` | Update console name and feature descriptions |

### Agent Configuration

| File | Change |
|------|--------|
| `src/lib/subscriptionAgentConfig.ts` | Update comment from "Marketing & Sales" to "Outreach & Sales" |
| `src/lib/agentStyles.ts` | Update comment header |
| `src/hooks/useAIAgentOrchestrator.ts` | Update category references |

### Documentation PDFs

| File | Change |
|------|--------|
| `src/components/documentation/PlatformDocumentPDF.tsx` | Update category header |
| `src/components/documentation/CompanyGuidesPDF.tsx` | Update console references |
| `src/components/documentation/ComprehensiveGuidesPDF.tsx` | Update console name |

### Edge Functions

| File | Change |
|------|--------|
| `supabase/functions/ai-agent-chat/index.ts` | Update comment |
| `supabase/functions/ai-orchestrator/index.ts` | Update comment |

---

## Key Code Changes

### MarketingSalesAgentConsole.tsx (Line 26)
```typescript
// Before
{ id: 'customers', label: 'Segments', icon: Users, ... }

// After  
{ id: 'customers', label: 'Marketing', icon: Users, ... }
```

### MarketingSalesConsole.tsx (Line 24)
```typescript
// Before
title="Marketing & Sales Ops"

// After
title="Outreach & Sales Ops"
```

### DashboardLayout.tsx Sidebar
```typescript
// Before
{ label: 'Marketing & Sales Ops', ... }

// After
{ label: 'Outreach & Sales Ops', ... }
```

---

## Result After Changes

- Console tabs will show: **Campaign | Leads | Marketing**
- Sidebar and headers will show: **Outreach & Sales Ops**
- Documentation will be updated consistently
