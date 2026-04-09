

# Add Beta Testing Banner + FCC 10DLC SMS Notice

## What We're Adding

1. **Beta banner on the Homepage** — placed directly below the pricing section's existing "30-day free trial" text (around line 941-944 of Index.tsx), a prominent styled card announcing the beta program with free 30-day access for testers, and the FCC/10DLC SMS registration notice.

2. **Beta + 10DLC notice on the Sign Up page** — added to the company signup left column in Auth.tsx (below the existing "30-Day Free Trial — Full Access" banner around line 702), a compact info card with the same beta messaging and SMS compliance details.

## Content

**Beta Message:**
> We are currently in Beta. All users who join during the beta period receive 30 days of free access for testing. All we ask is your honest feedback to help us improve the platform.

**FCC 10DLC Notice:**
> Our SMS system is currently undergoing FCC approval. 10DLC (10-Digit Long Code) is the US carrier registration standard for business SMS. Without 10DLC registration, messages sent over standard long-code numbers are likely to be filtered or blocked by carriers. SMS features will be fully activated once our registration is approved (typically 2-4 weeks).

## Files to Edit

1. **`src/pages/Index.tsx`** (~line 940-945)
   - Insert a styled beta announcement card after the existing "30-day free trial" line and before the 3rd party integrations section
   - Card with cyan/teal gradient border, beta badge, beta message, and an FCC/10DLC compliance sub-section with a shield icon

2. **`src/pages/Auth.tsx`** (~line 712, after the free trial banner in company mode)
   - Add a compact info card with beta badge and messaging
   - Add a separate small 10DLC/FCC notice card with amber warning styling (consistent with the existing registration code warning card style)

## Visual Style
- Matches existing dark theme cards with gradient borders
- Uses existing icon imports (Shield, AlertTriangle or similar)
- Beta badge in cyan/teal to match brand
- 10DLC notice in amber/warning style to draw attention to the regulatory requirement

