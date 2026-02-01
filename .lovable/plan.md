
# Fix: Batch Posts Tab Not Showing Content

## Problem
When clicking the "Batch Posts" tab, the content area is blank because:
1. `handleTabChange('batch')` sets `activeTab` to `'batch'`
2. `handleQuickAction('batch')` sets `showBatchWizard = true` but doesn't reset `activeTab` to `'chat'`
3. The rendering only handles `activeTab === 'feed'` or `activeTab === 'chat'`
4. Since `activeTab === 'batch'`, nothing renders

## Solution
Add `setActiveTab('chat')` to the batch action handler, similar to how other actions handle this.

---

## Code Change

**File**: `src/components/social/SocialMediaAgentConsole.tsx`

**Line 118-122** - Update batch handler:
```typescript
// Before
if (actionId === 'batch') {
  hideAllForms();
  setShowBatchWizard(true);
  return;
}

// After
if (actionId === 'batch') {
  hideAllForms();
  setShowBatchWizard(true);
  setActiveTab('chat');  // Add this line
  return;
}
```

---

## Why This Works
- The `SocialBatchWizard` component renders inside the `activeTab === 'chat'` block (lines 247-256)
- By setting `activeTab` to `'chat'`, the batch wizard will be visible
- This matches the pattern used by other actions like `'create'`, `'scheduled'`, and `'calendar'`
