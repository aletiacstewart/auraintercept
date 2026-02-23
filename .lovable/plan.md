
# Consolidate Into One Unified Content Engine

## What Exists Today (The Problem)

The Social Media console currently has **two completely separate content generation systems** that overlap heavily:

**Social Posts flow (SocialContentWizard):**
- Social-only (Instagram, Facebook, LinkedIn, TikTok, Google Business, SMS)
- Generates per-platform variations with character limits
- Has a 3-step wizard: Topic → Generate → Review & Post
- Saves to `social_content_drafts`

**Content Engine flow (MultiChannelGenerator):**
- Multi-channel: Social, Blog, Email/Campaign, SMS, Website
- Generates all channels from one topic
- Has a simple 2-panel layout: Input → Results
- Has "Copy & Open [Platform]" for social, plus "Schedule Post", "Create Campaign", "Save as Draft", "Push to Web Presence" save actions
- Saves to `scheduled_social_posts`, `marketing_campaigns`, `scheduled_blog_posts`, `sms_templates`, `smart_websites`
- Also has Brand Voice, Dashboard, and Calendar sub-tabs

The wizard is essentially a **subset** of what the Content Engine already does — and it adds extra steps for no reason.

---

## The Solution: Replace the Social Posts Flow with the Content Engine

Remove the "Social Posts" quick action entirely. Replace it with one entry point: **"Create Content"** which opens the **Content Engine** (MultiChannelGenerator) directly. This gives users the ability to generate social + blog + email + SMS + website content from one place.

**Then add the one missing feature** the Social Posts wizard had that the Content Engine lacks:

> The Content Engine's social tab currently just shows post copy and a "Schedule Post" button. It does NOT have the "Copy & Open [Platform]" inline action buttons for each platform (Facebook, Instagram, LinkedIn, etc.).

We add those **"Copy & Open [Platform]"** buttons to the social results section of `MultiChannelGenerator` so users can immediately post to any platform from the results panel.

---

## Detailed Changes

### 1. `SocialMediaAgentConsole.tsx` — Simplify to 2 Quick Actions

**Remove**: `social-posts` quick action and all related state (`showSocialPosts`, `socialPostsTab`, all the nested Social Posts tabs/components)

**Replace with a single**: `create-content` quick action that opens the Content Engine directly on the Generator tab.

New QUICK_ACTIONS:
```
Create Content  →  Opens MultiChannelGenerator (Content Engine Generator tab)
My Posts        →  Opens SocialFeedQueue (view saved drafts/published)
```

This removes:
- `SocialContentWizard` import and usage
- `SocialBatchWizard` import and usage
- `SocialScheduleQueue` import and usage
- `SocialFeedQueue` (or keep for "My Posts")
- `SocialContentCalendar` import and usage
- All the nested `showSocialPosts` state + tab management

The Content Engine tabs (Brand Voice, Generate, Dashboard, Calendar) stay as-is. The Calendar tab of the Content Engine already provides scheduling visibility.

### 2. `MultiChannelGenerator.tsx` — Add "Copy & Open [Platform]" to Social Results

When the `social` channel is selected and results are generated, the per-platform cards currently show just the post text, hashtags, and a copy icon. 

**Add**: A "Copy & Open [Platform]" button per platform that:
1. Copies the post text + hashtags to clipboard (with `document.execCommand` fallback for iframe contexts)
2. Opens the platform deep link via programmatic `<a>` element click (not `window.open`) to bypass popup blockers

Platform deep links (same as the wizard had):
- Facebook → `https://www.facebook.com`
- Instagram → `https://www.instagram.com/create/story/`
- LinkedIn → `https://www.linkedin.com/sharing/share-offsite/?summary=...`
- TikTok → `https://www.tiktok.com/upload`
- Google Business → `https://business.google.com/create-post`

**Also fix**: The existing `copyToClipboard` function uses `navigator.clipboard.writeText` with no fallback — add the `document.execCommand('copy')` fallback here too.

### 3. Keep `SocialFeedQueue` for "My Posts"

The existing `SocialFeedQueue` with `initialFilter="pending"` shows saved drafts. Keep this as the "My Posts" tab in the console. The Content Engine saves social posts to `scheduled_social_posts` which can be filtered here.

---

## New Console Structure

```
Social Media Console
├── Home tab  (AI chat — unchanged)
├── Create Content → Content Engine
│   ├── Brand Voice  (set tone & style)
│   ├── Generate     (MultiChannelGenerator — ALL channels in one place)
│   │                 Social: Instagram, Facebook, LinkedIn, TikTok, Google Business
│   │                 Blog: SEO article → save as draft
│   │                 Email: subject + body → create campaign  
│   │                 SMS: 160-char → save template
│   │                 Website: headlines + CTAs → push to web presence
│   ├── Dashboard    (content history)
│   └── Calendar     (scheduled content)
└── My Posts → SocialFeedQueue (view/manage saved drafts)
```

**Before: 2 confusing overlapping tools with 10+ clicks to post**
**After: 1 unified tool with 3 clicks — enter topic → generate → Copy & Open Platform**

---

## Files Changed

| File | Change |
|---|---|
| `src/components/social/SocialMediaAgentConsole.tsx` | Remove Social Posts flow, simplify to "Create Content" (Content Engine) + "My Posts" |
| `src/components/content-engine/MultiChannelGenerator.tsx` | Add "Copy & Open [Platform]" buttons + clipboard fallback + anchor-click deep links to social results |

## What is Removed / Cleaned Up

- `SocialContentWizard` — no longer needed as a separate entry point (its functionality is fully covered by Content Engine + the new Copy & Open buttons)
- `SocialBatchWizard` — removed from console (rarely used, adds complexity)
- `SocialScheduleQueue` — removed from console (Calendar tab covers this)
- `SocialContentCalendar` — removed from console (Content Engine Calendar tab replaces it)

The component files themselves are not deleted in case they're used elsewhere — they are just removed from the Social Media console's navigation.
