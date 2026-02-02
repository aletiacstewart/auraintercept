
# Plan: Separate Creative & Web Presence as Its Own Console

## Current Issue
On the homepage, the **Creative Agent** and **Web Presence Agent** are incorrectly grouped under "Social Media & Web Presence" instead of being in their own dedicated console category.

## Required Changes

### File: `src/pages/Index.tsx`

**1. Update `agentCategories` array (lines 121-147)**

Split the current "Social Media & Web Presence" category into two separate categories:

- **Social Media Signal Ops** - Contains only:
  - Social Media Signal Agent
  - Signal Scheduler
  - Signal Analytics

- **Creative & Web Presence** (NEW) - Contains:
  - Creative Agent
  - Web Presence Agent

**2. Update `agentConsoles` array (lines 189-203)**

Replace the separate "Social Media Signal Console" and "Web Presence Console" entries with properly labeled consoles:

- Keep **Social Media Signal Console** (for social media signal operations)
- Replace **Web Presence Console** with **Creative & Web Presence Console** (consolidating Creative Agent + Web Presence Agent functions)

## Technical Details

```typescript
// agentCategories - Split into two categories:

// Category 1: Social Media Signal Ops
{
  id: 'social',
  name: 'Social Media Signal Ops',
  icon: Send,
  color: 'from-pink-500 to-rose-500',
  agents: [
    { name: 'Social Media Signal Agent', ... },
    { name: 'Signal Scheduler', ... },
    { name: 'Signal Analytics', ... }
  ]
}

// Category 2: Creative & Web Presence (NEW)
{
  id: 'creative_web_presence',
  name: 'Creative & Web Presence',
  icon: Palette,
  color: 'from-teal-500 to-cyan-500',
  agents: [
    { name: 'Creative Agent', ... },
    { name: 'Web Presence Agent', ... }
  ]
}
```

## Result
- Homepage will display **7 distinct console categories** as intended
- "Creative & Web Presence" will be its own section with Creative Agent and Web Presence Agent
- "Social Media Signal Ops" will contain only the social media-specific agents
- Aligns with the platform architecture standard from memory

## Files to Modify
- `src/pages/Index.tsx`
