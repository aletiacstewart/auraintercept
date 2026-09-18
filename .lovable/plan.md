# Fix the password-reset link flow

## Confirmed issue
- The reset email successfully opens the app and creates a recovery session.
- The current `/auth?mode=reset` handler immediately redirects to the ordinary sign-in page.
- No screen currently asks for and saves a new password, so the reset cannot be completed.
- `auraintercept@gmail.com` is a confirmed account with platform-admin access, so its password can be reset through this repaired flow.

## Implementation
1. Add a dedicated password-reset page with **New password** and **Confirm password** fields, validation, loading state, and clear expired-link handling.
2. Preserve the recovery session from the email link and use it to securely save the new password.
3. Change the reset-email destination to the dedicated reset page on the same site.
4. Keep compatibility with already-issued `/auth?mode=reset` links by forwarding them to the new reset page without discarding the recovery URL data.
5. After success, sign out the temporary recovery session and return the user to Platform Admin sign-in with a confirmation message.

## Verification
- Request a reset for `auraintercept@gmail.com`.
- Confirm the email link opens the new-password screen rather than ordinary sign-in.
- Confirm matching valid passwords update successfully, expired/invalid links show recovery guidance, and the new password signs in.
- Check desktop and mobile layouts and confirm the app builds without errors.
