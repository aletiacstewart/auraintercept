
# Move Aura Intelligence to Knowledge Base

## Overview
Relocate the Aura Intelligence settings from the Quick Setup page to the Knowledge Base page, where it logically belongs alongside other AI training content.

---

## Changes Required

### 1. Update Knowledge Base Page
**File:** `src/pages/KnowledgeBase.tsx`

Add a new "Aura Intelligence" tab with Brain icon:

```text
Current Tabs:
- AI Profile
- Services  
- FAQs
- Hours
- Documents
- Smart Links
- Inventory (admin only)

New Tab Order:
- AI Profile
- Aura Intelligence ← NEW (after AI Profile makes sense)
- Services  
- FAQs
- Hours
- Documents
- Smart Links
- Inventory (admin only)
```

Changes:
- Import `AuraIntelligenceSettings` component
- Import `Brain` icon from lucide-react
- Add new TabsTrigger for "aura-intelligence"
- Add new TabsContent rendering `<AuraIntelligenceSettings />`

### 2. Remove from Quick Setup Page
**File:** `src/pages/Settings.tsx`

Remove:
- The "aura-intelligence" tab trigger
- The TabsContent for aura-intelligence
- The import for `AuraIntelligenceSettings` component
- The `Brain` icon import (if no longer used)
- Remove from `VALID_TABS` array

---

## Result

The Knowledge Base will become the single hub for all AI configuration:

| Tab | Purpose |
|-----|---------|
| AI Profile | Content tone & personality |
| **Aura Intelligence** | Master logic, brand tone, emergency protocols |
| Services | What the company offers |
| FAQs | Common Q&A pairs |
| Hours | Business schedule |
| Documents | Reference materials |
| Smart Links | Proactive URL sharing |

---

## Files to Modify
1. `src/pages/KnowledgeBase.tsx` - Add Aura Intelligence tab
2. `src/pages/Settings.tsx` - Remove Aura Intelligence tab
