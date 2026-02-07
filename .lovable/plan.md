
# Add Google Calendar Email Matching Notice to Company Signup

## Problem
When companies sign up for Aura Intercept, they may use a different email address than their Google account. This causes issues when they try to connect Google Calendar because the OAuth system requires email matching for proper calendar sync functionality.

## Solution
Add a clear, informative notice near the email field in the Company Signup form explaining that the signup email should match their Google account email if they plan to use Google Calendar integration.

---

## Implementation Details

### Location
Add the notice in `src/pages/Auth.tsx`, specifically within the company signup form section, positioned near the email input field (around line 1172).

### Design Approach
Use an inline info box (similar to the employee registration code notice pattern) that appears only for company mode signups. The notice will:
- Use a subtle info styling (blue/cyan color scheme to match the existing design)
- Include a Calendar icon to visually connect it to the Google Calendar feature
- Be concise but clear about the requirement

### Code Changes

**File: `src/pages/Auth.tsx`**

Add a conditional info notice that appears only for company mode, placed immediately before or after the email input field:

```tsx
{mode === 'company' && (
  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
    <div className="flex items-start gap-2">
      <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-foreground">
        <span className="font-medium">Google Calendar Integration:</span>{' '}
        Use the same email as your Google account to enable calendar sync.
      </p>
    </div>
  </div>
)}
```

### Visual Placement
The notice will appear in the signup form, positioned after the email input field label and before the input itself (or as a helper text below the email field), making it contextually relevant.

---

## Alternative Approaches Considered

1. **Tooltip on email field** - Less visible, users might miss it
2. **Bottom info cards** - Already have 3 cards, adding a 4th disrupts the grid layout
3. **Modal on signup** - Too intrusive for a non-blocking requirement

The inline notice approach provides the best balance of visibility and non-intrusiveness.

---

## Expected Outcome
- Users will see a clear notice when signing up for a company account
- The notice explains the Google Calendar email matching requirement upfront
- Reduces support requests and user confusion when setting up calendar integration
