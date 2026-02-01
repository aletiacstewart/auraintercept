

# Content Engine Agent: Unified AI Content Creation

## Overview

Currently, the platform has **7 separate edge functions** handling content generation:
- `generate-website-content` - Web presence copy
- `generate-social-content` - Job completion posts  
- `generate-social-batch` - Batch social media
- `generate-campaign-content` - Marketing campaigns
- `generate-campaign-series` - Campaign sequences
- `generate-blog-content` - Blog posts
- `generate-blog-batch` - Batch blog generation

This fragmentation means there's no unified intelligence coordinating content across channels. We'll create a **Creative Agent** (Content Engine Agent) to unify all AI content creation.

---

## Proposed Architecture

### New AI Operative: Creative Agent

| Attribute | Value |
|-----------|-------|
| ID | `creative` |
| Name | Creative Agent |
| Console | Content Engine |
| Tier | `command` |
| Description | Unified AI content generation for all marketing channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing. |

### New Console: Content Engine

A centralized hub for all AI content generation with:
- **Content Dashboard** - Overview of all generated content across channels
- **Brand Voice Manager** - Enhanced AI Content Profile management
- **Multi-Channel Generator** - Generate content for multiple channels at once
- **Content Calendar** - Unified view of all scheduled content

---

## Implementation Plan

### Phase 1: Backend - Unified Content Edge Function

Create `supabase/functions/content-engine/index.ts`:

```text
┌─────────────────────────────────────────────────────────┐
│                    Content Engine                        │
├─────────────────────────────────────────────────────────┤
│  Input:                                                  │
│  - channel: website | social | campaign | blog | lead   │
│  - contentType: specific type per channel               │
│  - context: company profile, topic, tone                │
│                                                          │
│  Processing:                                             │
│  1. Load AI Content Profile (brand voice, tone, USPs)   │
│  2. Fetch Tavily research (if connected)                │
│  3. Route to channel-specific prompt builder            │
│  4. Generate via Lovable AI Gateway                     │
│  5. Return formatted content                            │
│                                                          │
│  Output:                                                 │
│  - content: generated text                               │
│  - variations: platform-specific versions (social)       │
│  - metadata: tokens used, research sources              │
└─────────────────────────────────────────────────────────┘
```

### Phase 2: Frontend - Content Engine Console

Create new console page at `/dashboard/content-engine`:

**Components:**
1. **ContentEngineConsole.tsx** - Main console layout
2. **ContentDashboard.tsx** - Overview metrics (content generated this month, by channel)
3. **MultiChannelGenerator.tsx** - Generate content for multiple channels from one topic
4. **ContentCalendar.tsx** - Unified calendar view
5. **BrandVoiceManager.tsx** - Enhanced AI Content Profile editor

### Phase 3: Configuration Updates

**Files to update:**
- `src/lib/documentationConfig.ts` - Add Creative Agent to AI_OPERATIVES (bringing total to 24)
- `src/lib/subscriptionAgentConfig.ts` - Add to command tier agents
- `src/pages/AIAgentsHub.tsx` - Add AGENT_NAMES mapping
- `src/hooks/useAIAgentOrchestrator.ts` - Add agent config
- `src/App.tsx` - Add route for Content Engine Console

---

## Agent Definition

```typescript
// In documentationConfig.ts
{
  id: 'creative',
  name: 'Creative Agent',
  description: 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing with consistent voice and messaging.',
  console: 'content_engine',
  tier: 'command',
  dependencies: [],
  isCore: true,
  worksAlone: true,
}
```

---

## Multi-Channel Generation Flow

When a user enters a topic like "Spring AC Maintenance Special":

```text
User Input: "Spring AC Maintenance Special - 20% off"
                           │
                           ▼
              ┌────────────────────────┐
              │    Creative Agent      │
              │  (Content Engine)      │
              └────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │  Social  │     │  Email   │     │   Blog   │
   │  Posts   │     │ Campaign │     │   Post   │
   └──────────┘     └──────────┘     └──────────┘
         │                 │                 │
         ▼                 ▼                 ▼
   Instagram         Subject Line      SEO Title
   Facebook          Body Copy         Content
   LinkedIn          CTA Button        Excerpt
   TikTok
   GMB
   SMS
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/content-engine/index.ts` | Unified content generation edge function |
| `src/pages/ContentEngineConsole.tsx` | Main console page |
| `src/components/content-engine/ContentDashboard.tsx` | Overview metrics |
| `src/components/content-engine/MultiChannelGenerator.tsx` | Multi-channel content wizard |
| `src/components/content-engine/ContentCalendar.tsx` | Unified calendar |
| `src/components/content-engine/BrandVoiceManager.tsx` | AI Content Profile editor |

## Files to Update

| File | Changes |
|------|---------|
| `src/lib/documentationConfig.ts` | Add Creative Agent, add content_engine console |
| `src/lib/subscriptionAgentConfig.ts` | Add creative to command tier |
| `src/hooks/useAIAgentOrchestrator.ts` | Add Creative Agent config |
| `src/pages/AIAgentsHub.tsx` | Add AGENT_NAMES entry |
| `src/App.tsx` | Add /dashboard/content-engine route |
| `src/components/dashboard/DashboardSidebar.tsx` | Add Content Engine nav item |

---

## Key Features

### 1. Brand Consistency
All content pulls from the unified `company_ai_content_profiles` table ensuring:
- Consistent tone across all channels
- Brand voice adherence
- Keyword inclusion/avoidance
- Target audience alignment

### 2. Research-Enhanced Content
Tavily integration provides:
- Real-time industry trends
- Competitor insights
- Seasonal relevance
- Statistics and data points

### 3. Multi-Channel Efficiency
Generate content for all channels from a single topic:
- One input → 6+ platform-specific outputs
- Automatic character limit optimization
- Platform-specific hashtags and formatting

### 4. Content Analytics
Track content performance:
- Generation counts by channel
- Engagement metrics (when connected)
- Top-performing content types

---

## Result After Implementation

- **AI Operatives**: 23 → 24 (Creative Agent added)
- **Consoles**: 7 → 8 (Content Engine Console added)
- **Unified content generation** across all marketing channels
- **Single source of truth** for brand voice and content style

