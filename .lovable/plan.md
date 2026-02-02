
# Add Report Issue Link to Message Aura Chat Widget

## Overview
Add a "Report Issue" link at the bottom of the floating chat widget that opens the existing `ReportIssueDialog`, allowing visitors to report bugs or request features directly to the platform admin dashboard.

---

## Technical Implementation

### 1. Update `FloatingChatWidget.tsx`

Add the Report Issue link at the bottom of the chat panel, visible when the widget is open:

```typescript
import { ReportIssueDialog } from '@/components/error/ReportIssueDialog';
import { AlertTriangle } from 'lucide-react';

// Inside the chat panel div, after the content area:
<div className="px-3 py-2 border-t border-border/30 bg-muted/30">
  <ReportIssueDialog
    trigger={
      <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
        <AlertTriangle className="w-3 h-3" />
        Report Issue
      </button>
    }
  />
</div>
```

### 2. Component Structure Update

The chat panel layout will be:

```text
┌─────────────────────────────────┐
│  [X] Close button               │
├─────────────────────────────────┤
│                                 │
│  UnifiedCustomerConsole         │
│        or                       │
│  LandingAIChat                  │
│                                 │
├─────────────────────────────────┤
│  ⚠ Report Issue                 │  ← NEW footer link
└─────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/FloatingChatWidget.tsx` | Add ReportIssueDialog with custom trigger at bottom of chat panel |

---

## Behavior

- Link appears at the bottom of the chat widget whenever it's open
- Clicking opens the existing Report Issue dialog
- Reports go to the `platform_issues` table
- Platform admins can view all reports in `/dashboard/platform-issues`
- Works for both authenticated and unauthenticated visitors
