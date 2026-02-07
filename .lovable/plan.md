
# Update 3rd Party Integration & Onboarding Information on Company Signup Page

## Problem Identified
The company signup page (`Auth.tsx`) has:
1. **Missing details** in the 3rd party integrations grid (e.g., missing "$1.15/number" for Twilio, missing tier requirements like "Required for: Halo, Single-Point, Multi-Track, Command")
2. **Duplicate Concierge Onboarding** sections - one in the left column (line ~1073) and another in the bottom notice cards (line ~1318)
3. **Incomplete information** compared to the homepage's detailed integration cards

## Solution
Align the Auth page's 3rd party integrations section to match the homepage exactly, and remove the duplicate Concierge Onboarding card.

---

## Implementation Details

### 1. Update 3rd Party Integration Cards (Lines 988-1069)
Add the missing details to each integration card to match the homepage format:

| Integration | Missing Details to Add |
|-------------|----------------------|
| Google Calendar | Add "Optional for: Halo, Single-Point, Multi-Track, Command" |
| Resend | Add "Then $20/mo for 50k ($0.0004/email over)" and "Required for: Halo, Single-Point, Multi-Track, Command" |
| ElevenLabs | Add "$99/mo (500k)" tier and "Required for: Halo, Single-Point, Multi-Track, Command (not needed for Core)" |
| Twilio | Add "$1.15/number" and "Required for: Halo, Single-Point, Multi-Track, Command (not needed for Core)" |
| A2P 10DLC | Add "Required for: All SMS features • Prevents carrier filtering" |
| Stripe | Add "Required for: Single-Point, Multi-Track, Command (Invoicing)" |
| Social Media | Add "Required for: Core, Multi-Track, Command • Optional for: Halo, Single-Point" |
| Google Gemini | Add "Powers blog posts, social media, emails & marketing" and "Required for: All tiers" |
| Tavily | Already correct - "Optional for: All tiers" |

### 2. Remove Duplicate Concierge Onboarding (Lines 1311-1322)
The bottom notice section has 3 cards:
- **Concierge Onboarding** (DUPLICATE - remove this one)
- **Billing Requirement** (keep)
- **Invoice Payments** (keep)

Change from 3 cards (`md:grid-cols-3`) to 2 cards (`md:grid-cols-2`) and remove the first Concierge Onboarding card since it's already shown in the left column above the auth form.

---

## Files to Modify
- `src/pages/Auth.tsx` (lines 988-1069 for integrations, lines 1311-1343 for notice cards)

## Visual Result
- 3rd party integration cards will show the same level of detail as the homepage
- Only ONE Concierge Onboarding section will appear (in the left column)
- Bottom notice cards will show only Billing Requirement and Invoice Payments
