
# Fix Google OAuth Email Attribution

## Problem
The email `aibotcompany.ai@gmail.com` appears in the Google OAuth consent popup because the OAuth credentials (Client ID and Secret) were originally created by that account. Google tracks who created the credentials, not just project ownership.

## Solution
Create new OAuth credentials under the `auraintercept@gmail.com` account and update them in Lovable.

---

## Step 1: Create New OAuth Credentials in Google Cloud Console

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Web application** as the application type
4. Set a name like "Aura Intercept OAuth"
5. Under **Authorized JavaScript origins**, add:
   - `https://auraintercept.ai`
   - `https://auraintercept.lovable.app`
6. Under **Authorized redirect URIs**, add:
   - `https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/google-calendar-auth?action=callback`
7. Click **CREATE**
8. Copy the new **Client ID** and **Client Secret**

---

## Step 2: Update Secrets in Lovable

Once you have the new credentials, I will:
1. Update the `GOOGLE_CLIENT_ID` secret with your new Client ID
2. Update the `GOOGLE_CLIENT_SECRET` secret with your new Client Secret

---

## Step 3: Delete Old Credentials (Optional but Recommended)

In Google Cloud Console → Credentials:
1. Find the old OAuth 2.0 Client ID (the one created by aibotcompany.ai@gmail.com)
2. Click the trash icon to delete it

---

## Technical Details

| Item | Current Value |
|------|---------------|
| Edge Function | `supabase/functions/google-calendar-auth/index.ts` |
| Redirect URI | `https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/google-calendar-auth?action=callback` |
| Existing Secrets | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (configured) |

---

## Expected Outcome
After updating the credentials:
- The OAuth consent popup will show `auraintercept@gmail.com` as the developer
- Google Calendar integration will work correctly
- No code changes required - only secret updates

---

## Next Steps After You Create the Credentials
1. Share the new Client ID and Client Secret
2. I will update the secrets in Lovable Cloud
3. Test the Google Calendar connection from `https://auraintercept.ai`
