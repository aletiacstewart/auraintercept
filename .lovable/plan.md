
# Remove Duplicate Voice Button from SmartWebsite

## Problem
There are two voice buttons on the SmartWebsite page:
1. **Mic icon in chat widget header** (inside UnifiedCustomerConsole) - opens voice dialog
2. **Separate floating mic button** (SmartWebsiteVoiceButton component at bottom-right)

These are duplicates providing the same functionality.

## Solution
Remove the separate `SmartWebsiteVoiceButton` from the SmartWebsite page since the voice feature is already accessible through the chat widget header.

---

## Changes

### File: `src/pages/SmartWebsite.tsx`

**Remove the import (line 12):**
```typescript
// DELETE: import { SmartWebsiteVoiceButton } from '@/components/smartwebsite/SmartWebsiteVoiceButton';
```

**Remove the component rendering (lines 602-611):**
```typescript
// DELETE entire block:
{/* Voice Widget - only for paid tiers or trial */}
{canShowVoice && (
  <SmartWebsiteVoiceButton
    websiteId={website.id}
    companyId={website.company_id}
    companyName={website.company_name}
    visitorFingerprint={visitorFingerprint}
    primaryColor={primaryColor}
  />
)}
```

**Optionally remove the unused variable (line 211):**
```typescript
// DELETE: const canShowVoice = website?.show_voice_widget && (isInTrial || isPaidTier);
```

---

## Result
After this change, only the voice button in the chat widget header will remain. Users will:
1. Click the chat button → Opens chat popup
2. Click mic icon in header → Opens voice chat dialog

No functionality is lost - voice chat is still fully accessible through the chat widget.
