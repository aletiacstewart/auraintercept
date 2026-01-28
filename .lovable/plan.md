
# Fix Google Calendar OAuth "Blocked" Error

## Problem Analysis

The error "accounts.google.com is blocked - ERR_BLOCKED_BY_RESPONSE" occurs because Google's OAuth login page cannot be displayed inside an iframe. Google sets `X-Frame-Options: DENY` headers on their authentication pages for security.

### Current Flow

1. User clicks "Connect Google Calendar" in the settings
2. Code detects if running in an iframe
3. If in iframe: Opens `/oauth/google-calendar` in a new tab
4. The `/oauth/google-calendar` page calls the edge function and redirects to Google

### The Issue

The current implementation has a timing/flow problem:
- The `OAuthGoogleCalendar` page immediately tries to redirect with `window.location.href = data.authUrl`
- When this page is opened from an embedded preview, it may still be subject to iframe restrictions
- Additionally, the popup approach with `window.opener.postMessage` expects a popup window, not a new tab

---

## Implementation Plan

### Step 1: Update OAuthGoogleCalendar Page

**File:** `src/pages/OAuthGoogleCalendar.tsx`

Make this page a true intermediate landing page that:
1. Shows a clear "Connect to Google" button instead of auto-redirecting
2. User manually clicks to redirect (bypasses popup blocker issues)
3. Handles the callback properly by storing state in localStorage

Changes:
- Remove the auto-redirect `useEffect`
- Add a visible button that users click to go to Google
- Add better error handling and user feedback
- Store the origin URL so the callback knows where to redirect back

### Step 2: Update GoogleCalendarSettings Component

**File:** `src/components/integrations/GoogleCalendarSettings.tsx`

Improve the popup/new-tab flow:
- Store the company context in localStorage before opening the new window
- Add a message listener for when OAuth completes
- Refresh the connection status after successful auth

Changes:
- Add `window.addEventListener('message', ...)` to listen for OAuth completion
- Store `returnUrl` in localStorage for the OAuth page to use
- Invalidate query cache when connection succeeds

### Step 3: Update Edge Function Callback HTML

**File:** `supabase/functions/google-calendar-auth/index.ts`

The callback currently uses `window.opener.postMessage` which only works for popup windows. Update to:
- Try `postMessage` first (for popup flow)
- Fall back to localStorage + redirect (for new tab flow)
- Provide a "Return to app" button if automatic close fails

---

## Technical Details

### New OAuthGoogleCalendar Flow

```text
User in iframe
      |
      v
Clicks "Connect Google Calendar"
      |
      v
Opens /oauth/google-calendar in NEW TAB
      |
      v
User sees landing page with "Continue to Google" button
      |
      v
User clicks button → Redirects to accounts.google.com (top-level, no iframe)
      |
      v
User completes Google OAuth
      |
      v
Google redirects to edge function callback
      |
      v
Edge function stores tokens, returns success HTML
      |
      v
Success page: attempts postMessage, then redirects back to app
      |
      v
Original page refreshes and shows "Connected" status
```

### Key Code Changes

**OAuthGoogleCalendar.tsx:**
```typescript
// Instead of auto-redirect, show a button
const [authUrl, setAuthUrl] = useState<string | null>(null);

// Fetch the auth URL on mount
useEffect(() => {
  fetchAuthUrl().then(setAuthUrl);
}, []);

// Render a button user must click
return (
  <Button onClick={() => window.location.href = authUrl}>
    Continue to Google
  </Button>
);
```

**Edge function callback HTML:**
```html
<script>
  // Try popup close approach
  if (window.opener) {
    window.opener.postMessage({type: 'google-calendar-success'}, '*');
    window.close();
  } else {
    // New tab approach - redirect back to app
    const returnUrl = localStorage.getItem('gcal-return-url') || '/dashboard/integrations/calendar';
    localStorage.removeItem('gcal-return-url');
    window.location.href = returnUrl;
  }
</script>
```

---

## Files to Modify

1. `src/pages/OAuthGoogleCalendar.tsx` - Convert to button-based flow
2. `src/components/integrations/GoogleCalendarSettings.tsx` - Add message listener and localStorage handling
3. `supabase/functions/google-calendar-auth/index.ts` - Update callback HTML for both popup and new-tab flows

---

## Testing Checklist

- Test OAuth flow from Lovable preview (iframe)
- Test OAuth flow from published URL (direct browser)
- Verify tokens are stored correctly
- Verify connection status updates after auth
- Test error handling when user cancels Google auth
