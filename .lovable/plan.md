

# Rewrite Meta (Facebook/Instagram) Setup Guide to Match Actual Developer Portal

## Problem
The current setup instructions in `SocialMediaSetupGuide.tsx` don't accurately reflect the current Meta Developer Portal (developers.facebook.com/apps) layout, navigation, and workflow. Steps reference outdated flows (e.g., selecting "Other" then "Business" app type) and don't match the portal's sidebar structure.

## What Changes

### Facebook Steps (Complete Rewrite - 13 Steps)

The steps will be reordered and rewritten to match the actual portal sidebar navigation and the use-case-based app creation flow:

1. **Register as a Meta Developer** -- Go to developers.facebook.com, register, verify account
2. **Create a New App** -- Click "Create App", select use cases (checkboxes):
   - "Authenticate and request data from users with Facebook Login"
   - "Manage everything on your Page"
   - "Engage with customers on Messenger from Meta"
   - Enter app name, contact email, link Business Portfolio, click Create
3. **App Dashboard -- Overview** -- Note App ID at top, see added use cases and products
4. **Settings -- Basic** -- Copy App ID and App Secret, set App Domains, Privacy Policy URL, Terms of Service URL, paste Data Deletion Request URL and Deauthorize Callback URL, Save Changes
   - URLs embedded: `dataDeletion`, `deauthorize`
5. **Settings -- Advanced** -- Review server IP allowlists, API version settings (optional)
6. **Use Cases -- Customize Facebook Login** -- Click Customize on "Authenticate and request data from users with Facebook Login", go to Facebook Login > Settings, paste Valid OAuth Redirect URI, Save
   - URLs embedded: `oauth`
7. **Use Cases -- Customize Page Permissions** -- Click Customize on "Manage everything on your Page", add permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `pages_read_user_content`, `pages_manage_metadata`
8. **Use Cases -- Customize Messenger** -- Click Customize on "Engage with customers on Messenger from Meta":
   - Configure webhooks: paste Callback URL, set Verify Token, click Verify and Save
   - Generate access tokens: Add Page, grant permissions, Add Subscriptions (messages, messaging_postbacks, messaging_optins), Generate token
   - URLs embedded: `webhook`
9. **Webhooks (Global Sidebar)** -- Select "Page" object, subscribe to fields: `feed` (required), `messages`, `messaging_postbacks`, `messaging_optins`. Leave all metadata fields (affiliation, attire, parking, etc.) unsubscribed. Use v24.0.
   - URLs embedded: `webhook`
10. **App Roles -- Roles** -- Add People (Admin/Developer/Tester), testers must accept invitation. Only role holders can use app in Development mode.
11. **Exchange for Long-Lived Token** -- API call to exchange short-lived token:
    ```
    GET https://graph.facebook.com/v24.0/oauth/access_token
      ?grant_type=fb_exchange_token
      &client_id=YOUR_APP_ID
      &client_secret=YOUR_APP_SECRET
      &fb_exchange_token=SHORT_LIVED_TOKEN
    ```
12. **App Review -- Requests** -- Submit each permission for review with descriptions and screencast demo (2-5 min). Review takes 1-5 business days.
13. **Go Live** -- Settings > Basic > toggle App Mode to "Live". Final checklist: permissions approved, webhook active, long-lived token stored, Privacy/ToS URLs accessible, Data Deletion and Deauthorize URLs configured, OAuth Redirect URI set.

### Instagram Steps (Minor Update)
- Update prerequisite to reference the new Facebook app creation flow
- Clarify that the use case to add is "Manage messaging and content on Instagram" during app creation or later via Use Cases sidebar
- Keep existing permission and webhook steps (already accurate)

### Technical Details
- File to edit: `src/components/integrations/SocialMediaSetupGuide.tsx`
- Only the `facebook.steps` and `instagram.steps` arrays in `PLATFORM_CONFIG` will be rewritten
- The `SetupStep` interface (`title`, `content`, `urls`) and rendering logic remain unchanged
- All URLs continue using the existing `urlMap` with `oauth`, `webhook`, `deauthorize`, `dataDeletion` keys

