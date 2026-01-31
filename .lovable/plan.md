
# Display Batch Posts Form Inline in Console

## Overview
Convert the `SocialBatchWizard` from a modal dialog to an inline component that displays within the console content area, matching how the Single Post form (`SocialContentWizard`) works.

---

## Current vs Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Wrapper | `<Dialog>` component (modal) | No dialog, inline card |
| Trigger | `open` / `onOpenChange` props | `companyId`, `onCancel`, `onSuccess` props |
| Display | Overlays the console | Renders inside console content area |
| Close | Dialog X button | Cancel button calls `onCancel` |

---

## Files to Modify

### 1. `src/components/social/SocialBatchWizard.tsx`

**Changes:**
- Remove the `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` wrappers
- Change props from `open`/`onOpenChange` to match `SocialContentWizard` pattern:
  ```typescript
  interface SocialBatchWizardProps {
    companyId: string;
    onCancel: () => void;
    onSuccess?: () => void;
  }
  ```
- Wrap content in a `Card` component instead of Dialog
- Add close button (X) in header like Single Post form
- Use `companyId` prop instead of getting it from `useAuth`
- Replace `handleClose` with direct `onCancel()` calls
- On generation success, call `onSuccess()` then `onCancel()`

### 2. `src/components/social/SocialMediaAgentConsole.tsx`

**Changes:**
- Remove the `SocialBatchWizard` Dialog render at the bottom (lines 308-316)
- Add `showBatchWizard` to the `isShowingForm` check
- Render `SocialBatchWizard` inline in the forms section alongside `SocialContentWizard`:
  ```tsx
  {showBatchWizard && effectiveCompanyId && (
    <SocialBatchWizard
      companyId={effectiveCompanyId}
      onCancel={handleHome}
      onSuccess={() => {
        hideAllForms();
        setShowScheduleQueue(true);
      }}
    />
  )}
  ```
- Update `getActiveLabel()` to return 'Batch Posts' when `showBatchWizard` is true

---

## Component Structure After Changes

```text
SocialMediaAgentConsole
├── GlassHeader
├── MobileTabNav
└── Content Area
    ├── WelcomeScreen (when no forms/messages)
    ├── SocialContentWizard (inline - Single Post)
    ├── SocialBatchWizard (inline - Batch Posts) ← NEW inline render
    ├── SocialContentCalendar (inline)
    ├── SocialScheduleQueue (inline)
    └── Chat Messages
```

---

## UI Layout for Inline SocialBatchWizard

The inline version will use a Card layout similar to SocialContentWizard:

```text
┌─────────────────────────────────────────────────┐
│ [Sparkles] Batch Posts Generator        [X]     │
│ Step 1 of 3: Schedule & Platforms               │
├─────────────────────────────────────────────────┤
│ [Tavily Status Badge]                           │
│                                                 │
│ Start Date          Posting Frequency           │
│ [Date Picker]       [Select Dropdown]           │
│                                                 │
│ Number of Posts                                 │
│ [Select Dropdown]                               │
│                                                 │
│ Target Platforms                                │
│ ┌──────────┐ ┌──────────┐                       │
│ │Instagram │ │ Facebook │                       │
│ └──────────┘ └──────────┘                       │
│ ┌──────────┐ ┌──────────┐                       │
│ │ LinkedIn │ │  TikTok  │                       │
│ └──────────┘ └──────────┘                       │
│                                                 │
│            [Cancel]  [Configure Topics →]       │
└─────────────────────────────────────────────────┘
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `SocialBatchWizard.tsx` | Refactor | Remove Dialog wrapper, use Card, update props interface |
| `SocialMediaAgentConsole.tsx` | Update | Render wizard inline, update form visibility logic |
