
# Combining Analytics & Reports into Business Mgt Ops Overview

## Current State

| Page | Route | Contains |
|------|-------|----------|
| Business Mgt Ops Overview | `/dashboard/business-operations` | Overview tab + Operations Hub tab |
| Analytics & Reports | `/dashboard/analytics-reports` | AuraTabs with Revenue, Performance, Insights, All Reports |

## Proposed Change

Add a third tab **"Analytics & Reports"** to the Business Mgt Ops Overview page, consolidating all business management tools into one unified dashboard.

```text
Business Mgt Ops Overview
├── Tab: Overview (metrics dashboard)
├── Tab: Operations Hub (sales, appointments, inventory, people)
└── Tab: Analytics & Reports (revenue, performance, insights, reports) ← NEW
```

---

## Implementation Steps

### 1. Update BusinessOperations.tsx

Add the AuraTabs component as a third tab:
- Import AuraTabs and BarChart3 icon
- Add "Analytics & Reports" TabsTrigger
- Add TabsContent that renders AuraTabs

### 2. Update Route Configuration

In `src/App.tsx`:
- Redirect `/dashboard/analytics-reports` to `/dashboard/business-operations` (with query param to auto-select analytics tab)
- Or: Keep route but redirect internally

### 3. Update Sidebar Navigation

In `src/components/dashboard/DashboardLayout.tsx`:
- Remove the separate "Analytics & Reports" menu item from sidebar
- Single entry point through "Business Mgt Ops Overview"

### 4. Update Voice Navigation

In `src/lib/voiceNavigation.ts`:
- Update any references to `/dashboard/analytics-reports`

---

## Technical Changes

| File | Change |
|------|--------|
| `src/pages/BusinessOperations.tsx` | Add Analytics & Reports tab with AuraTabs |
| `src/App.tsx` | Add redirect from `/analytics-reports` to `/business-operations?tab=analytics` |
| `src/components/dashboard/DashboardLayout.tsx` | Remove Analytics & Reports sidebar item |
| `src/lib/voiceNavigation.ts` | Update navigation targets |
| `src/contexts/VoiceContext.tsx` | Update onAuraActivate destination |
| `src/components/aura/AuraQuickResponsePopup.tsx` | Update handleViewFull destination |

---

## Result

**Before**: Two separate pages in sidebar under Business Management
**After**: One unified page with three tabs

```text
┌─────────────────────────────────────────────────────────────┐
│  Business Mgt Ops Overview                                   │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Operations Hub] [Analytics & Reports]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  When "Analytics & Reports" tab is selected:                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [$ Revenue] [~ Performance] [👥 Insights] [📊 All]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ $ Revenue           ▼                               │   │
│  │ ~ Forecast          ▼                               │   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
