
# Fix Text Color on Tavily Integration Pages

## Problem
The accordion content text in the Tavily Setup Guide is using `text-muted-foreground` which is too light/hard to read against the light background (visible in the screenshot showing "Free", "Pro Plan", "Per Search Cost" text).

## Solution
Apply the established **Integration Guides Contrast Standard** which uses `text-foreground/80` instead of `text-muted-foreground` for better readability.

---

## File to Modify

**`src/components/integrations/TavilySetupGuide.tsx`**

| Line | Current | Change To |
|------|---------|-----------|
| 29 | `text-muted-foreground` | `text-foreground/80` |
| 53 | `text-muted-foreground` | `text-foreground/80` |
| 85 | `text-muted-foreground` | `text-foreground/80` |
| 120 | `text-muted-foreground` | `text-foreground/80` |
| 140 | `text-muted-foreground` | `text-foreground/80` |
| 155 | `text-muted-foreground` | `text-foreground/80` |

---

## Technical Details

All 6 `AccordionContent` className updates:
```typescript
// Before
<AccordionContent className="text-sm text-muted-foreground space-y-3">

// After  
<AccordionContent className="text-sm text-foreground/80 space-y-3">
```

And the note text on line 140:
```typescript
// Before
<p className="text-xs text-muted-foreground pt-2 border-t">

// After
<p className="text-xs text-foreground/80 pt-2 border-t">
```

---

## Summary

| Item | Action |
|------|--------|
| `TavilySetupGuide.tsx` | Update 6 instances of `text-muted-foreground` to `text-foreground/80` |

This matches the existing standard used for ElevenLabs, Resend, and CRM setup guides.
