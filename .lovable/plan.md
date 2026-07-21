## Problem
The embedded Aura chat greeting in `LandingAIChat.tsx` uses an unconditional article:

> "follow up with customers for a ${industryHint} business"

When `industryHint` is set to a value like `"your"`, the message renders as:

> "follow up with customers for a your business"

This is the typo the user is seeing.

## Plan
1. Update the assistant greeting in `src/components/landing/LandingAIChat.tsx` to remove the stray article.
   - Change the interpolated greeting from:
     ```ts
     `Hi! I'm Aura. Ask me how I'd answer calls, book jobs, and follow up with customers for a ${industryHint} business — or anything else about the platform.`
     ```
   - To:
     ```ts
     `Hi! I'm Aura. Ask me how I'd answer calls, book jobs, and follow up with customers for your ${industryHint} business — or anything else about the platform.`
     ```
   - This removes the "a" and makes the sentence read naturally for any industry hint.

2. Verify the change by running the typecheck/test suite to ensure no regressions.

## Out of scope
- The similar marketing copy in `src/pages/ForBusiness.tsx` ("See how she'd handle a real customer for a {content.label} business") is not a message from Aura and is not changed unless requested.
- No backend or prompt changes are needed; this is a single UI string fix.