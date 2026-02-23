

# Streamline Social Media Posting — Fewer Steps, Same Power

## The Problem

The current flow requires navigating through **3 separate screens** to post content:
1. Wizard Step 3 (Review) -- click "Approve & Ready to Post"
2. Navigate to Scheduled tab -- find the post -- click "Post This"
3. SocialPublishBridge dialog -- Copy, Open, Mark Posted per platform

Users just want: **generate content, copy it, open the platform, done.**

---

## The Solution: Merge the Bridge into Wizard Step 3

Embed the Copy + Open Platform actions **directly into Step 3** of the Content Wizard so users never need to leave the wizard to post. The flow becomes:

```text
Step 1: Topic & Platforms  -->  Step 2: AI Generating...  -->  Step 3: Review & Post
```

**Step 3 now includes per-platform:**
- Content preview (editable, same as now)
- "Copy & Open [Platform]" single button (copies content to clipboard AND opens the deep link in one click)
- "Mark Posted" checkbox per platform
- A "Save as Draft" secondary option for users who want to post later

---

## Detailed Changes

### 1. `SocialContentWizard.tsx` — Step 3 Redesign

**Remove** the separate "Quick Actions" row (Copy to All / Regenerate / Preview) and the 3-button action bar (Back / Schedule / Approve & Ready to Post).

**Replace with** a streamlined per-platform card that includes:

For each platform tab content:
- Editable textarea (same as now)
- Hashtags input (same as now, for platforms that support them)
- Reword button (same as now)
- **NEW: "Copy & Open [Platform]" primary button** -- single click does both: copies content+hashtags to clipboard, then opens the platform deep link
- **NEW: Small "Mark as Posted" toggle** per platform

Bottom action bar becomes:
- "Back" (go to step 1)
- "Save Draft" (secondary -- saves to social_content_drafts with status pending, for posting later)
- "Done -- All Posted" (primary -- only enabled when at least 1 platform is marked posted; saves record as published)

**Clipboard fallback**: Add `document.execCommand('copy')` textarea fallback for when `navigator.clipboard` is unavailable (iframe contexts).

**Deep link method**: Use programmatic `<a>` element click instead of `window.open()` to bypass popup blockers in iframe.

### 2. `SocialPublishBridge.tsx` — Fix Clipboard and Deep Links

Even though the wizard now handles the primary flow, the Bridge is still used from the Schedule Queue for posts saved as drafts. Apply the same fixes:

- `handleCopy`: Add clipboard API existence check + `document.execCommand('copy')` fallback
- `handleOpenPlatform`: Replace `window.open()` with anchor element `.click()` approach
- **NEW: Add a "Copy & Open" combo button** that does both in one click (same as wizard)

### 3. `SocialContentWizard.tsx` — Fix Invisible Text

All `text-card-foreground/70` label classes changed to `text-muted-foreground` for guaranteed visibility. Button variants changed from `outline` to `secondary` where needed for contrast.

### 4. `SocialScheduleQueue.tsx` — Minor Update

The "Post This" button on the schedule queue stays as-is -- it opens the (now-fixed) SocialPublishBridge for posts that were saved as drafts earlier.

---

## New User Flow (After Changes)

```text
1. Click "Social Posts"
2. Enter topic, pick platforms, click "Generate Content"
3. AI generates... 
4. Review content per platform tab:
   - Edit if needed
   - Click "Copy & Open Facebook"  -->  content copied + Facebook opens
   - Paste on Facebook, come back, check "Posted"
   - Click "Copy & Open LinkedIn"  -->  content copied + LinkedIn opens
   - Paste on LinkedIn, come back, check "Posted"
5. Click "Done - All Posted"
```

**Before: 8+ clicks across 3 screens. After: 3-4 clicks on 1 screen.**

---

## Files Changed

| File | Change |
|---|---|
| `src/components/social/SocialContentWizard.tsx` | Redesign Step 3 with inline Copy & Open buttons, mark-posted toggles, clipboard fallback, anchor-click deep links, text visibility fixes |
| `src/components/social/SocialPublishBridge.tsx` | Fix clipboard fallback, anchor-click deep links, add combo "Copy & Open" button |

---

## What Stays the Same

- Step 1 (topic + platforms) -- unchanged
- Step 2 (AI generation loading) -- unchanged
- Schedule Queue -- still available for drafts saved for later
- Batch Wizard -- unchanged
- Content Engine -- unchanged
- All backend/edge functions -- unchanged

