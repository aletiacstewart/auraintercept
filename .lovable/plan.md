
# Homepage Social Media Content Update

## Overview

Update all public-facing homepage and landing page content to accurately describe the new dual-mode Social Media Ops features — the **Manual Bridge** (available now) and the **Own API** (advanced option) — while correctly representing the "Platform-Level Auto-Post" as Coming Soon. This keeps the homepage in sync with what's actually in the product.

---

## Files to Update

### 1. `src/pages/Index.tsx` — Main Homepage

**`agentCategories` array — Social Media Ops category (lines 122–138):**

Update the 3 agent descriptions in the `social` category:

| Agent | Current | Updated |
|---|---|---|
| Social Media Agent | "AI-powered content creation for all social platforms" | "AI-powered content creation for Facebook, Instagram, LinkedIn, TikTok, Google Business & SMS" |
| Social Media Scheduler | "Automated post scheduling across 6 platforms" | "Content queue and calendar management across 6 platforms. One-click Manual Bridge posting — copy & open platform composer" |
| Social Media Analytics | "Engagement metrics and performance tracking" | "Engagement metrics, reach analysis, and content performance tracking across all connected platforms" |

**`agentConsoles` array — Social Media Console entry (lines 195–202):**

| Field | Current | Updated |
|---|---|---|
| description | "AI content creation and scheduling across all platforms." | "AI content creation, scheduling, and guided manual posting across 6 platforms." |
| features | `['AI content generation', 'Multi-platform scheduling', 'Analytics dashboard', 'Brand voice consistency']` | `['AI content generation', 'Manual Bridge posting', 'Multi-platform scheduling', 'Analytics dashboard']` |

**`platformFeatures` array — Social Media entry (lines 240–243):**

| Field | Current | Updated |
|---|---|---|
| description | "AI-powered content creation and scheduling across all major social platforms." | "AI generates on-brand content for 6 platforms. Copy with one click and post via the Manual Bridge. Own API auto-posting also available." |

---

### 2. `src/components/landing/PricingComparisonTable.tsx` — Pricing Tooltips

**`featureDescriptions` object:**

| Key | Current | Updated |
|---|---|---|
| `'Social Media Agent'` | "AI-powered content creation for all social platforms." | "AI-powered content creation for Facebook, Instagram, LinkedIn, TikTok, Google Business, and SMS. Generates platform-optimized captions, hashtags, and image prompts." |
| `'Social Media Scheduler'` | "Content scheduling and calendar management across 6 platforms. Post with one click using the Manual Bridge. Automatic publishing coming soon." | "Content calendar management across 6 platforms. AI generates ready-to-post content. Use the Manual Bridge to copy content and open the platform composer with one click. Own API credentials can be configured for automatic posting." |
| `'Social Media Analytics'` | "Engagement metrics and performance tracking." | "Engagement tracking, reach analysis, and content performance insights across all 6 platforms. Tracks manual and API-posted content." |
| `'Social Media Console'` | "Unified dashboard to create, schedule, and manage social content across 6 platforms. Uses guided manual posting via Manual Bridge. Own API or automatic posting coming soon." | "Unified control center to create, schedule, approve, and post social content across 6 platforms. Includes the Manual Bridge (copy + open platform composer) and Own API setup for companies who want automatic posting. Platform-level auto-posting coming soon." |

**`featureDescriptions` — Social Media Accounts integration entry (line 191 context):**
The `'Social Media Accounts'` row in the integrations section currently has `Optional`/`Required` values — these don't need tooltip description changes, but add a note to the tooltip if one exists.

---

### 3. `src/pages/AgentDetailPage.tsx` — Agent Detail Descriptions

**`social_content` agent (lines 369–388):**
- `description`: Change from "Creates engaging social media content optimized for each platform." → "Creates platform-optimized content for Facebook, Instagram, LinkedIn, TikTok, Google Business, and SMS. Content is ready to copy and post via the Manual Bridge or auto-publish via your own API credentials."
- `capabilities`: Update to include `'Manual Bridge one-click posting'` and `'Own API auto-publish support'`; remove or update vague items

**`social_scheduler` agent (lines 390–414):**
- `description`: Change from "Optimizes posting times and manages the content queue across platforms." → "Manages the content calendar and queue across 6 platforms. Sets posts to 'Ready to Post' status so your team can use the Manual Bridge or auto-publish via configured API credentials."
- `capabilities`: Add `'Ready to Post queue management'` and `'Manual Bridge guided posting'`

**`social_analytics` agent (lines 416–440):**
- `description`: Change from "Tracks social media performance and provides actionable insights." → "Tracks engagement, reach, and content performance across all 6 platforms. Provides actionable insights and content optimization recommendations."

---

### 4. `src/components/landing/CompetitiveDifferentiation.tsx` — Comparison Table

**Generic CRM comparison row (line 53):**

| Row | Current Aura value | Updated |
|---|---|---|
| `'Social Media Included'` | `true` (just a checkmark) | Change aura value to `'Manual Bridge + Own API'` (descriptive string instead of boolean true) |

This way the comparison card says "Manual Bridge + Own API" instead of just a plain checkmark, making it more informative.

---

## Summary of Changes

| File | What Changes |
|---|---|
| `src/pages/Index.tsx` | Social media agent descriptions, console features list, platform feature description |
| `src/components/landing/PricingComparisonTable.tsx` | Tooltip descriptions for Social Media Agent, Scheduler, Analytics, and Console |
| `src/pages/AgentDetailPage.tsx` | Agent detail descriptions and capabilities for all 3 social media agents |
| `src/components/landing/CompetitiveDifferentiation.tsx` | CRM comparison "Social Media Included" aura value |

---

## What Does NOT Change

- Pricing tier availability (which tiers include social media) — stays the same
- The `Social Media Accounts` integration row values in the pricing table
- Any backend/dashboard components
- Agent configuration fields in `AgentDetailPage.tsx`
- The `howItWorks` steps — general enough to not need updating
- The hero stats (24 AI Operatives, 7 Consoles, etc.)
