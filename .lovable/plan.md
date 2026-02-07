
# Fix Google Calendar OAuth for Custom Domain

## Problem Analysis
The `ERR_BLOCKED_BY_RESPONSE` error occurs because:
1. You're testing from the **Lovable preview domain** (`99d7b46d-c78f-4a80-b304-345e37b67f40.lovableproject.com`)
2. Google blocks OAuth from loading in any iframe/proxy context
3. The preview domain cannot complete OAuth flows due to its proxy architecture

## Solution
Implement domain detection to guide users to the correct testing environment and provide a more robust OAuth flow for custom domains.

---

## Technical Implementation

### Step 1: Update OAuthGoogleCalendar.tsx
Add detection for preview domains and show a clear message directing users to test from their published site.

**Changes:**
- Add `isPreviewDomain()` detection function that checks for `lovableproject.com` or `id-preview--` patterns in the hostname
- If on preview domain, display an informative message with a direct link to the published site's OAuth page
- For custom domains (like `auraintercept.ai`), proceed with the OAuth flow normally

```text
New logic flow:
1. Detect if on preview domain (lovableproject.com or id-preview--)
2. If preview: Show message with link to https://auraintercept.ai/oauth/google-calendar
3. If custom domain: Proceed with normal OAuth flow
```

### Step 2: Update GoogleCalendarSettings.tsx
Improve the connect button behavior to detect the environment and guide users appropriately.

**Changes:**
- Add preview domain detection
- If on preview, show a toast/message explaining they need to test from the published site
- Provide a direct link to open the OAuth page on the custom domain

### Step 3: Add Helper Function for Domain Detection
Create a shared utility in `src/lib/url.ts` (already has some URL utilities).

**New function:**
```typescript
export function isLovablePreviewDomain(): boolean {
  const host = window.location.hostname;
  return host.endsWith('.lovableproject.com') || host.includes('id-preview--');
}

export function getPublishedDomain(): string {
  // For this project, the custom domain is auraintercept.ai
  // Could also be read from environment or configuration
  return 'https://auraintercept.ai';
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/url.ts` | Add `isLovablePreviewDomain()` helper |
| `src/pages/OAuthGoogleCalendar.tsx` | Add preview detection and redirect guidance |
| `src/components/integrations/GoogleCalendarSettings.tsx` | Add preview warning before OAuth attempt |

---

## User Experience Flow

### When on Preview Domain (lovableproject.com)
1. User clicks "Connect Google Calendar"
2. System detects preview domain
3. Shows message: "Google Calendar OAuth must be tested from your published site"
4. Provides button: "Open on auraintercept.ai" which opens `https://auraintercept.ai/dashboard/integrations/calendar` in a new tab

### When on Custom Domain (auraintercept.ai)
1. User clicks "Connect Google Calendar"
2. Opens `/oauth/google-calendar` page
3. Fetches auth URL and navigates to Google OAuth
4. Google OAuth completes successfully
5. Redirects back to callback, stores tokens, redirects to calendar settings

---

## Required Google Cloud Console Settings
Ensure these are configured in your Google Cloud Console:

**Authorized JavaScript Origins:**
- `https://auraintercept.ai`
- `https://www.auraintercept.ai` (if using www)

**Authorized Redirect URIs:**
- `https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/google-calendar-auth?action=callback`

---

## Testing Instructions
After implementation:
1. **Publish the changes** to your custom domain
2. Open `https://auraintercept.ai` directly in your browser (not through Lovable preview)
3. Navigate to Dashboard > Integrations > Calendar
4. Click "Connect Google Calendar"
5. Complete the Google OAuth flow
6. Verify connection shows as "Connected"
