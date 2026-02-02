

# Change Knowledge Base Default Tab to AI Profile

## Summary
Update the Knowledge Base page so it opens to the **AI Profile** tab instead of the **Services** tab by default.

---

## Change Details

**File:** `src/pages/KnowledgeBase.tsx`

**Line 23 - Current:**
```typescript
const defaultTab = searchParams.get('tab') || 'services';
```

**Updated to:**
```typescript
const defaultTab = searchParams.get('tab') || 'ai-profile';
```

---

## Impact
- When navigating to `/dashboard/knowledge`, the AI Profile tab will be shown first
- Links that explicitly specify `?tab=services` (or other tabs) will continue to work correctly
- The "Knowledge Base Setup" button from Quick Setup will now land users on the AI Profile tab

