
# Dynamic Page Title for Ask Aura Modal

## Problem
The Ask Aura modal (AuraUnifiedModal) has a hardcoded title "Analytics & Reports" regardless of which page the user is currently on.

## Solution
Pass the current page title through the component chain and display it dynamically in the modal header.

---

## Technical Changes

### 1. Update `AuraUnifiedModal.tsx`

Add a `pageTitle` prop and use it in the header:

```typescript
interface AuraUnifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageTitle?: string; // NEW
}

export function AuraUnifiedModal({ open, onOpenChange, pageTitle }: AuraUnifiedModalProps) {
  // ...
  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {/* icon */}
          <span>{pageTitle || 'Ask Aura'}</span>  {/* Use pageTitle with fallback */}
          {/* badges */}
        </DialogTitle>
      </DialogHeader>
    </Dialog>
  );
}
```

### 2. Update `AuraFloatingButton.tsx`

Add a `pageTitle` prop and pass it to the modal:

```typescript
interface AuraFloatingButtonProps {
  className?: string;
  pageTitle?: string; // NEW
}

export function AuraFloatingButton({ className, pageTitle }: AuraFloatingButtonProps) {
  // ...
  return (
    <>
      {/* floating button */}
      <AuraUnifiedModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        pageTitle={pageTitle}  // NEW
      />
    </>
  );
}
```

Also update the tooltip to use the pageTitle:
```typescript
<TooltipContent side="left">
  <p className="font-medium">{pageTitle || 'Ask Aura'}</p>
  <p className="text-xs text-muted-foreground">Click to chat • Hold for voice</p>
</TooltipContent>
```

### 3. Update `DashboardLayout.tsx`

Derive the current page title from the pathname and pass it to `AuraFloatingButton`:

```typescript
// Add helper function to get page title from current path
const getCurrentPageTitle = () => {
  const pathname = location.pathname;
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href === pathname) {
        return item.label;
      }
    }
  }
  return 'Ask Aura'; // Default fallback
};

// In render:
<AuraFloatingButton pageTitle={getCurrentPageTitle()} />
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/aura/AuraUnifiedModal.tsx` | Add `pageTitle` prop, use in header |
| `src/components/aura/AuraFloatingButton.tsx` | Add `pageTitle` prop, pass to modal + tooltip |
| `src/components/dashboard/DashboardLayout.tsx` | Derive current page title, pass to floating button |

---

## Result

When user opens Ask Aura from:
- Dashboard → Title shows "Dashboard"
- Web Presence Manager → Title shows "Web Presence Manager"
- Analytics & Reports Ops → Title shows "Analytics & Reports Ops"
- Any other page → Falls back to "Ask Aura"
