

# Fix Text Visibility on Customer Portal App Install Page

## Problem
The text on the Customer Portal App Install page has low contrast and is difficult to read. The white text (`text-white`, `text-white/70`, `text-white/60`) is not visible against the card backgrounds in the current theme.

---

## Solution
Update the text color classes to use semantic theme tokens that provide proper contrast in both light and dark modes.

---

## Changes

**File:** `src/pages/CustomerPortalAppInstall.tsx`

### 1. Customer Portal PWA Card (lines 46-78)
| Current | Updated |
|---------|---------|
| `text-white/70` (CardDescription) | `text-muted-foreground` |
| `text-white` (headings) | `text-foreground` |
| `text-white/70` (list items) | `text-muted-foreground` |
| `bg-slate-700/50` (feature badges) | `bg-muted/50` |

### 2. QR Code & Install Link Cards (lines 108-169)
| Current | Updated |
|---------|---------|
| `text-white/70` (CardDescription) | `text-muted-foreground` |
| `bg-slate-700/50` (URL container) | `bg-muted/50` |
| `border-slate-600/50` | `border-border/50` |
| `text-white` (headings) | `text-foreground` |
| `text-white/70` (list text) | `text-muted-foreground` |

### 3. Customer Journey Card (lines 187-205)
| Current | Updated |
|---------|---------|
| `text-white/70` (CardDescription) | `text-muted-foreground` |
| `text-white` (step titles) | `text-foreground` |
| `text-white/60` (step descriptions) | `text-muted-foreground` |
| `text-white/30` (arrows) | `text-muted-foreground/50` |

---

## Technical Details

This change replaces hardcoded white color classes with semantic theme tokens:
- `text-foreground` - Primary readable text
- `text-muted-foreground` - Secondary text with proper contrast
- `bg-muted/50` - Subtle background that works in all themes
- `border-border/50` - Theme-aware borders

This ensures consistent readability across light/dark modes and follows the project's Modern Surface System standard.

