

## Fix: Invisible Header Text in Customer Portal

### Problem
The "Customer Portal" text in the sticky header is invisible because the header background is `bg-card` (dark navy, `hsl(208 30% 18%)`) but the text uses the default `text-foreground` color (also dark navy, `hsl(208 30% 15%)`). Dark text on a dark background = invisible unless highlighted.

### Solution
Add `text-card-foreground` to the header elements so the text renders in white/light color against the dark card background.

### Files to Update

**1. `src/pages/CustomerPortalHome.tsx` (line 63)**
- Change the "Customer Portal" span to include `text-card-foreground`

**2. `src/pages/CustomerCompanyPortal.tsx` (line 97)**
- Same fix for the identical header in the company-specific portal page

### What Changes

| Element | Before | After |
|---------|--------|-------|
| Header text | Dark text on dark `bg-card` (invisible) | White `text-card-foreground` on dark `bg-card` (readable) |
| Sign-out icon | Default color (may also be hard to see) | `text-card-foreground` for visibility |

This is a two-line CSS class fix -- no logic changes.

