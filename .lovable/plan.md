
# Fix Knowledge Base Setup Button Visibility

## Issue
The "Knowledge Base Setup" button text is not visible due to low contrast with the `bg-accent/20 text-accent-foreground` color scheme.

---

## Solution
Change the button styling to use a more visible color scheme that matches the visual distinction from the "3rd Party Setup" button while ensuring readable text.

**File:** `src/pages/Settings.tsx` (line 90)

**Current styling:**
```typescript
className="... bg-accent/20 text-accent-foreground hover:bg-accent/30 border border-accent/40 ..."
```

**New styling (using teal/emerald theme for Knowledge Base):**
```typescript
className="... bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 ..."
```

This will provide:
- Clear visual distinction from the primary-colored "3rd Party Setup" button
- Strong text contrast with emerald/teal coloring
- Consistent with the Knowledge Base feature color palette
