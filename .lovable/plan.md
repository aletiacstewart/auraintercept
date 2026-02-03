
# Fix Sign Up / Sign In Button Text Visibility

## Problem
The "Sign Up" and "Sign In" tab buttons in the auth page have invisible text unless clicked. This is a color contrast issue where the inactive tab text color (`text-muted-foreground`) blends into the background when the TabsList is inside a dark Card.

## Solution
Update the TabsTrigger styling to use colors that work well in both light and dark contexts, specifically improving the inactive state text visibility.

## Implementation

### File: `src/components/ui/tabs.tsx`

**Change:** Update the TabsTrigger inactive state to use a higher-contrast text color that works inside Card components.

**Current:**
```tsx
"text-muted-foreground hover:text-foreground hover:bg-muted/50",
```

**Updated:**
```tsx
"text-foreground/70 hover:text-foreground hover:bg-muted/50",
```

This changes the inactive text from `text-muted-foreground` (which can be low contrast in card contexts) to `text-foreground/70` which inherits from the parent context and maintains 70% opacity for visual hierarchy while ensuring visibility.

## Alternative Approach (if global change causes issues elsewhere)

If the global change affects other areas negatively, we can apply a specific fix just to the Auth page:

### File: `src/pages/Auth.tsx` (Lines 1091-1094)

**Current:**
```tsx
<TabsList className="w-full mb-6">
  <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
  <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
</TabsList>
```

**Updated:**
```tsx
<TabsList className="w-full mb-6 bg-card-foreground/10">
  <TabsTrigger value="signup" className="flex-1 text-card-foreground/70 data-[state=active]:text-card-foreground">Sign Up</TabsTrigger>
  <TabsTrigger value="login" className="flex-1 text-card-foreground/70 data-[state=active]:text-card-foreground">Sign In</TabsTrigger>
</TabsList>
```

## Recommended Approach
Start with the global fix to `tabs.tsx` as it provides consistent behavior across all tab usages. The `text-foreground/70` approach respects the inherited text color context while maintaining the visual hierarchy between active and inactive tabs.

## Testing
After implementing, verify:
1. Sign Up / Sign In text is clearly visible in inactive state
2. Active tab text remains visible and distinct
3. Other tab usages throughout the app (Calculators, Dashboard pages) still look correct
