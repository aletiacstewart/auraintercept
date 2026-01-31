
# Social Media Batch Generation & Schedule Queue System

## Overview
Add batch generation and approval queue functionality to social media, mirroring the blog system. This allows generating posts for multiple scheduled dates at once, with each date creating unique content for all configured platforms.

---

## Current State vs Proposed

| Feature | Blog System | Social Media (Current) | Social Media (Proposed) |
|---------|-------------|------------------------|------------------------|
| Batch Generation | `BlogBatchWizard` | None | `SocialBatchWizard` |
| Approval Queue | `BlogScheduleQueue` | None | `SocialScheduleQueue` |
| Edge Function | `generate-blog-batch` | `generate-social-variations` (single) | `generate-social-batch` |
| Queue Table | `scheduled_blog_posts` | Uses `social_content_drafts` | `scheduled_social_posts` (new) |

---

## Architecture

```text
+----------------------+     +---------------------------+     +------------------+
|  SocialBatchWizard   | --> | generate-social-batch     | --> | Lovable AI       |
|  (Topics + Platforms)|     | (edge function)           |     | (Gemini)         |
+----------------------+     +---------------------------+     +------------------+
         |                            |                               ^
         |                            v                               |
         |                   +------------------+              Research context
         |                   | Tavily API       |-------------------+
         |                   | (if configured)  |
         |                   +------------------+
         v
+---------------------------+
| scheduled_social_posts    |  <-- New table
| (pending/approved/published)|
+---------------------------+
         |
         v
+----------------------+
| SocialScheduleQueue  |  <-- Approval workflow
+----------------------+
```

---

## Database Changes

### New Table: `scheduled_social_posts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `company_id` | uuid | Company reference |
| `topic` | text | Original topic/prompt |
| `platforms` | text[] | Selected platforms |
| `content_json` | jsonb | Platform-specific content variations |
| `image_url` | text | Optional shared image |
| `scheduled_for` | timestamptz | When to publish |
| `timezone` | text | User timezone |
| `status` | text | pending/approved/published/rejected/failed |
| `batch_id` | uuid | Groups posts from same batch |
| `ai_research_used` | boolean | Whether Tavily was used |
| `approved_by` | uuid | Who approved |
| `approved_at` | timestamptz | When approved |
| `published_at` | timestamptz | When published |

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-social-batch/index.ts` | Batch generation edge function |
| `src/components/social/SocialBatchWizard.tsx` | Multi-step wizard for batch setup |
| `src/components/social/SocialScheduleQueue.tsx` | Approval queue with actions |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/social/SocialMediaAgentConsole.tsx` | Add "Batch Generate" and "Schedule Queue" quick actions |
| `supabase/config.toml` | Register new edge function |

---

## Component Details

### 1. SocialBatchWizard (3 Steps)

**Step 1: Schedule Settings**
- Start date picker
- Posting frequency (daily, twice weekly, weekly, etc.)
- Number of posts to generate (2-12)
- Default platforms to target (Instagram, Facebook, LinkedIn, etc.)
- Tavily status badge

**Step 2: Topics**
- Bulk topic entry (one per line)
- Individual topic + keywords per scheduled slot
- Editable scheduled dates
- Platform selection per topic (optional override)

**Step 3: Generation**
- Progress indicator with Tavily research phase
- Generates unique content for each topic
- Each topic gets platform-optimized variations
- Saves to `scheduled_social_posts` as "pending"

### 2. SocialScheduleQueue

**Stats Dashboard**
- Pending Review count
- Approved count  
- Published count
- Total scheduled

**Post List with Actions**
- Status filter (All/Pending/Approved/Published/Rejected)
- Preview modal showing all platform variations
- Edit modal for tweaking content
- Approve / Reject buttons for pending posts
- Publish Now for approved posts
- Delete option

**Platform Preview**
- Tabs for each platform's content
- Character count indicators
- Hashtag display for Instagram/TikTok

### 3. generate-social-batch Edge Function

**Input**
```typescript
{
  topics: [{
    topic: string,
    keywords: string[],
    scheduledFor: string,
    platforms?: string[]  // Optional override
  }],
  defaultPlatforms: string[],
  companyId: string,
  timezone: string
}
```

**Process**
1. Fetch company info and AI profile
2. Check for Tavily API key, perform research if available
3. Loop through topics:
   - Call existing variation generation logic
   - Generate platform-specific content
   - Store results with scheduled timestamp
4. Insert all into `scheduled_social_posts`
5. Return batch summary

---

## UI Integration

### SocialMediaAgentConsole Updates

Add new quick actions:
```typescript
{ id: 'batch', label: 'Batch Generate', icon: Sparkles, message: 'Open batch generator' },
{ id: 'queue', label: 'Schedule Queue', icon: ListChecks, message: 'Open schedule queue' },
```

Add new tab handlers to show:
- `SocialBatchWizard` when "Batch Generate" is clicked
- `SocialScheduleQueue` when "Schedule Queue" is clicked

---

## Workflow Summary

```text
User opens Social Media Console
    ↓
Clicks "Batch Generate"
    ↓
SocialBatchWizard Step 1: Configure schedule (dates, frequency, platforms)
    ↓
Step 2: Enter topics for each scheduled slot
    ↓
Step 3: AI generates content (with Tavily research if connected)
    ↓
Posts saved to scheduled_social_posts as "pending"
    ↓
User clicks "Schedule Queue"
    ↓
Reviews pending posts, previews platform content
    ↓
Approves or edits each post
    ↓
Uses "Publish Now" or waits for auto-publish (future cron)
```

---

## Key Differences from Blog Batch

| Aspect | Blog | Social Media |
|--------|------|--------------|
| Content per slot | 1 blog post | Multiple platform variations |
| Output format | HTML article | Platform-optimized text |
| Storage | Single content field | JSON with platform keys |
| Preview | Single HTML view | Tabbed platform view |
| Character limits | None | Per-platform limits |
| Hashtags | None | Instagram/TikTok only |

---

## Summary of Changes

| Item | Type | Description |
|------|------|-------------|
| `scheduled_social_posts` | Database | New table for scheduled social content |
| `generate-social-batch` | Edge Function | Batch generation with Tavily |
| `SocialBatchWizard.tsx` | Component | 3-step wizard UI |
| `SocialScheduleQueue.tsx` | Component | Approval queue with preview/edit |
| `SocialMediaAgentConsole.tsx` | Update | Add batch and queue actions |
| `supabase/config.toml` | Update | Register new function |
