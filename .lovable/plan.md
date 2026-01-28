
# Fix Google Calendar OAuth "Blocked" Error

## Problem Summary
The "accounts.google.com is blocked" error persists because the **Lovable preview environment** (`id-preview--*.lovable.app`) serves all requests through a proxy layer. Google's OAuth pages detect this and refuse to load due to security restrictions—regardless of whether you open a new tab or try to break out of an iframe.

This is **not a code bug**—it's an environment limitation. OAuth flows to Google will not work from the preview URL.

---

## Solution

### Publish the App and Test from the Published URL

1. **Publish the project** using the "Publish" button in Lovable. This will create a public URL (e.g., `your-project.lovable.app`).

2. **Update Google Cloud Console** to include the published domain:
   - Go to **APIs & Services → Credentials → Your OAuth Client**
   - Add your published URL (e.g., `https://your-project.lovable.app`) to **Authorized JavaScript origins**
   - Confirm the **Authorized redirect URI** is still:
     ```
     https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/google-calendar-auth?action=callback
     ```
     (This stays the same—it's the backend callback URL)

3. **Test from the published URL**, not the preview URL. The OAuth flow will work correctly from the published domain.

---

## Why This Works

| URL Type | Behavior |
|----------|----------|
| **Preview URL** (`id-preview--*.lovable.app`) | Routed through Lovable's development proxy, which Google blocks |
| **Published URL** (`your-app.lovable.app`) | Standard HTTPS domain that Google allows for OAuth |

The backend callback URL (`*.supabase.co/functions/v1/...`) does not change—it's already a standard domain.

---

## Quick Steps

1. Click **Publish** in Lovable
2. Copy the new published URL
3. Add it to Google Cloud Console → Credentials → **Authorized JavaScript origins**
4. Open the published URL and test "Connect Google Calendar"

---

## Technical Note

The existing code is correct. No changes are needed. The auto-redirect logic in `OAuthGoogleCalendar.tsx` and the breakout attempts in `GoogleCalendarSettings.tsx` are good fallbacks, but they cannot overcome the proxy-level blocking in the preview environment.
