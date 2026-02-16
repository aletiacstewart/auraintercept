

## Fix All Integration URLs to Use Published Domain

### Problem
Multiple integration setup guides and components use `window.location.origin` to generate OAuth callback URLs and webhook URLs. When accessed from the Lovable preview environment, this produces URLs like `https://id-preview--xxxxx.lovable.app/...` which third-party services (Facebook, LinkedIn, TikTok, Google) reject.

### Solution
Replace all `window.location.origin` references in integration-facing URLs with `getPublishedDomain()` from `src/lib/url.ts`, which returns `https://auraintercept.ai`.

### Files to Change

**1. `src/components/integrations/SocialMediaSetupGuide.tsx`** (line 274)
- Change: `window.location.origin` to `getPublishedDomain()`
- Affects: OAuth callback URL shown to users for Facebook, LinkedIn, TikTok, Google Business
- Also add two additional URLs for Facebook's required Deauthorize and Data Deletion callbacks

**2. `src/components/integrations/GoogleCalendarSettings.tsx`** (lines 105, 447)
- Already references `auraintercept.ai` in toast messages -- no functional change needed, but will verify the redirect URI display also uses the published domain consistently

**3. `src/components/widget/DirectLinkCode.tsx`** (line 15)
- Change: Use `getPublishedDomain()` for the direct chat link so the copyable URL always points to production

**4. `src/components/widget/IframeEmbedCode.tsx`** (line 15)
- Change: Use `getPublishedDomain()` for the iframe embed `src` URL

**5. `src/components/widget/PlatformInstallGuide.tsx`** (line 30)
- Change: Use `getPublishedDomain()` for the embed/direct link URLs shown in WordPress/Wix/Squarespace install guides

**6. `src/components/widget/CustomerPortalInstallPrompt.tsx`** (line 20)
- Change: Use `getPublishedDomain()` for the customer portal install URL

**7. `src/pages/CustomerPortalAppInstall.tsx`** (line 22)
- Change: Use `getPublishedDomain()` for the install URL displayed to customers

### What Will NOT Change
- `Auth.tsx` redirect URLs (`emailRedirectTo`) -- these must use `window.location.origin` because the user needs to return to whichever domain they signed up from
- `ForgotPasswordDialog.tsx` -- same reason, password reset must redirect back to current domain
- `FieldOpsAppCard.tsx`, `DispatchFieldOpsAppCard.tsx`, `BusinessMgtOpsAppCard.tsx` -- these already have smart logic using `normalizedPublicBaseUrl` with preview detection fallback
- `OAuthGoogleCalendar.tsx` -- stores return URL for internal navigation, correctly uses current origin

### Technical Detail
All changed files will import `getPublishedDomain` from `@/lib/url` and replace `window.location.origin` with the function call. This ensures every URL shown to users for pasting into third-party developer consoles always points to `https://auraintercept.ai`.

