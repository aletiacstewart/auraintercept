# Make Upload-Post the only social setup path

Today the Social Media integrations page asks every client to register their own developer app on Facebook, LinkedIn, TikTok and Google, paste App IDs and secrets, then connect through OAuth. Now that Upload-Post handles all of that, that form is redundant and confusing.

## What changes on screen

The Social Media setup page becomes a single, simple path:

1. **Connect your accounts (Upload-Post)** — the same panel that's in the Social Media console moves to the top of this page: paste a key (or use the platform key), click Connect accounts, link Facebook, Instagram, LinkedIn, TikTok, YouTube, Google Business and more, and flip the two switches (Publish through Upload-Post / Post automatically).
2. **Copy & Post (manual bridge)** — kept as the no-setup fallback, with the link to the Social Media console.
3. The five per-platform tabs, the "Own API Credentials" cards, the developer setup guides, and the App ID / Client Secret / Client Key forms are removed from the page.

Anyone who already linked an account the old way keeps working: if a company still has live direct connections, a small **Previously connected accounts** list shows them with a Disconnect button, plus a note that new connections go through Upload-Post. Companies with no old connections never see it.

The platform-wide developer credentials card (visible only to you as platform admin) stays, since it still backs those grandfathered connections.

## Technical notes

- `src/pages/integrations/SocialMediaIntegration.tsx` is rewritten: drop the `Tabs` per-platform layout, the `tenant_integrations` credential lookup, `handleConnect`/OAuth popup listener, and the `SocialMediaSetupGuide` + `TenantSocialCredentialsForm` imports. Render `UploadPostPanel` (needs `companyId`, optional `companyLogoUrl` from the company record) plus the manual-bridge card.
- Keep the `social_accounts` query for the legacy list and the existing disconnect mutation.
- `PlatformCredentialsSettings` stays mounted (platform-admin only).
- `TenantSocialCredentialsForm.tsx` and `SocialMediaSetupGuide.tsx` are left on disk but no longer routed to; `social-oauth` edge function and the `tenant_integrations` credential columns are untouched so existing tokens keep refreshing. No database change.
- Update the page header copy to describe Upload-Post rather than "connect your own developer app".
