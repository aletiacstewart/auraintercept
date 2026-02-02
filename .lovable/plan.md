
# Complete Platform Consistency & Compliance Overhaul

## Executive Summary

This audit identified **120+ critical inconsistencies** including missing agents, incorrect console counts, terminology chaos, and structural data gaps. The user requires the format **"Control Centers (Consoles)"** and all content must be organized and complete.

---

## Critical Missing Content

### 1. MISSING AGENTS - Creative Agent & Web Presence Agent

These 2 agents are **completely missing** from major documentation:

| File | Issue |
|------|-------|
| `helpContentConfig.ts` Social Media section | Only shows 3 agents, missing Creative Agent & Web Presence Agent |
| `AIAgentGuidesPDF.tsx` CONSOLES array | Missing entire Social Media & Web Presence console section |
| `AIAgentGuidesPDF.tsx` CONSOLES array | Social Media Signal Agent incorrectly placed under "Outreach & Sales Ops" |
| `ComprehensiveGuidesPDF.tsx` | No guides for Creative Agent or Web Presence Agent |
| `PlatformGuides.tsx` AI Agents section | No dedicated guide for Creative Agent or Web Presence Agent |

**Total Agent Count in documentationConfig.ts**: 24 operatives organized as:
- Customer Portal: 4 (Triage, Booking, Follow-up, Review)
- Field Operations: 4 (Dispatch, Route, ETA, Check-in)
- Business Operations: 4 (Admin, Quoting, Invoice, Inventory)
- Outreach & Sales Ops: 3 (Campaign, Lead, Marketing)
- Social Media & Web Presence: 5 (Social Content, Social Scheduler, Social Analytics, **Creative**, **Web Presence**)
- Analytics & Reports: 4 (Insights, Performance, Revenue, Forecast)

### 2. MISSING CONSOLE - Social Media & Web Presence

**AIAgentGuidesPDF.tsx Table of Contents** (lines 810-821) only shows 5 consoles:
```text
Current (WRONG):
- Console 1: Customer Portal
- Console 2: Field Operations
- Console 3: Business Management
- Console 4: Outreach & Sales Ops
- Console 5: Analytics & Reports
```

**Missing from TOC**:
- Console 6: Social Media & Web Presence
- Console 7: AI Operatives Hub

---

## Terminology Standardization

**Required Format**: "Control Centers (Consoles)" - per user request

### Files Requiring Terminology Updates:

| File | Line | Current | Required |
|------|------|---------|----------|
| `PlatformGuides.tsx` | 174 | "6 Control Centers" | "7 Control Centers (Consoles)" |
| `ComprehensiveGuidesPDF.tsx` | 261 | "6 Control Centers" | "7 Control Centers (Consoles)" |
| `AIAgentGuidesPDF.tsx` | 783 | "Control Centers" | "Control Centers (Consoles)" |
| `AIAgentGuidesPDF.tsx` | 841 | "control centers" | "Control Centers (Consoles)" |
| `TierComparisonCards.tsx` | 135 | "Control Centers" | "Control Centers (Consoles)" |
| `Index.tsx` | 411 | "Control Centers" | "Control Centers (Consoles)" |
| `TermsOfService.tsx` | 37 | "seven Control Centers" | "seven Control Centers (Consoles)" |
| `Help.tsx` | 654 | "7 Control Centers" | "7 Control Centers (Consoles)" |
| `AIAgentGuide.tsx` | 142-147 | "Control Centers" | "Control Centers (Consoles)" |
| `landing-chat/index.ts` | 12 | "7 Control Centers" | "7 Control Centers (Consoles)" |

---

## Cover Page Stats Errors

### AIAgentGuidesPDF.tsx Cover Page (lines 781-796):

| Stat | Current | Required |
|------|---------|----------|
| Control Centers | 7 | 7 ✓ |
| AI Operatives | **23** | **24** |
| Integrations | 5 | 5 ✓ |
| Pricing Tiers | **5** | **7** |

---

## Console Organization Issues

### AIAgentGuidesPDF.tsx - Social Media Signal Agent Misplaced

**Line 539-544**: Social Media Signal Agent is listed under "Outreach & Sales Ops" console agents.

**Should be**: Under new "Social Media & Web Presence" console with:
- Social Media Signal Agent
- Signal Scheduler
- Signal Analytics
- Creative Agent
- Web Presence Agent

### Index.tsx Landing Page - Creative Agent Misplaced

**Lines 120-123**: Creative Agent listed under "Outreach & Sales Ops" category.

**Should be**: Under "Social Media Signal Ops" category with Web Presence Agent.

---

## Complete File-by-File Remediation

### Phase 1: Core Configuration (3 files)

**1.1 `src/lib/helpContentConfig.ts`**

Update Social Media console (lines 203-237) to add missing agents:

```typescript
agents: [
  { name: 'Social Media Signal Agent', tier: 'command' },
  { name: 'Signal Scheduler', tier: 'command' },
  { name: 'Signal Analytics', tier: 'command' },
  { name: 'Creative Agent', tier: 'command' },      // ADD
  { name: 'Web Presence Agent', tier: 'command' },  // ADD
],
```

Also add description update:
```typescript
description: 'AI-powered social media signal management, content engine, and web presence with content creation for 6 platforms, scheduling, and visual content calendar.',
```

**1.2 `src/lib/documentationConfig.ts`**

Verify data is correct (it is the source of truth). Current counts:
- 24 AI Operatives ✓
- 7 Consoles ✓
- 7 Subscription Tiers ✓

### Phase 2: Platform Guides (1 file, major content add)

**2.1 `src/pages/PlatformGuides.tsx`**

**A) Fix terminology (line 174)**:
```text
Before: 'View all 24 AI agents organized by 6 Control Centers'
After:  'View all 24 AI operatives organized across 7 Control Centers (Consoles)'
```

**B) Add missing agent guides after "Analytics & Reporting Agents" (around line 299)**:

```typescript
{
  title: 'Creative Agent (Content Engine)',
  duration: '10 min',
  steps: [
    'Creative Agent is the unified AI content generation hub',
    'Access via Social Media & Web Presence Console → Content Engine tab',
    'Enter a single topic to generate content for all channels',
    'Generates: Social posts, Blog content, Email campaigns, SMS templates, Website copy',
    'All content uses your Brand Voice from AI Content Profile',
    'Push content directly to Web Presence, Blog, or Outreach campaigns',
    'Requires Aura Pro Command tier'
  ],
  tips: ['Set up AI Content Profile first for best results', 'Generate from one topic for consistent messaging across channels']
},
{
  title: 'Web Presence Agent',
  duration: '8 min',
  steps: [
    'Web Presence Agent manages your AI-powered website and blog',
    'Access via Social Media & Web Presence Console → Web Presence tab',
    'Auto-optimizes SEO for all pages and blog posts',
    'Monitors site performance and suggests improvements',
    'Auto-publishes blog posts from the Content Engine',
    'Manages custom domain verification and SSL',
    'Requires Aura Pro Command tier',
    'Has dependency on Creative Agent being enabled'
  ],
  tips: ['Connect custom domain for professional branding', 'Enable auto-publish for hands-off content management']
}
```

**C) Implement Table of Contents navigation** with URL hash updates and scroll-spy.

### Phase 3: PDF Documents (4 files, major content add)

**3.1 `src/components/documentation/AIAgentGuidesPDF.tsx`**

**A) Fix cover stats (lines 786-795)**:
```typescript
// Line 786
<Text style={styles.coverStatNumber}>24</Text>  // Was 23
// Line 795
<Text style={styles.coverStatNumber}>7</Text>   // Was 5
```

**B) Add missing console to TOC (after line 817)**:
```typescript
{ title: 'Console 5: Social Media & Web Presence', page: '9' },
{ title: 'Console 6: Analytics & Reports', page: '10' },
{ title: 'Console 7: AI Operatives Hub', page: '11' },
```

**C) Move Social Media Signal Agent from Outreach & Sales Ops to new Social Media console**

**D) Add new "Social Media & Web Presence" console section to CONSOLES array with all 5 agents**:
```typescript
{
  name: 'Social Media & Web Presence',
  color: colors.pink,
  colorLight: colors.pinkLight,
  description: 'Content creation, social media signal management, website builder, and blog publishing.',
  features: [
    'Multi-platform content creation (6 platforms)',
    'Content Engine for unified messaging',
    'Smart Website Manager',
    'Blog Management with auto-publish',
    'SEO optimization',
    'Content calendar',
  ],
  agents: [
    {
      name: 'Social Media Signal Agent',
      description: 'AI-generated content for 6 platforms (Instagram, Facebook, LinkedIn, TikTok, GMB, SMS).',
      isCore: true,
      worksAlone: true,
      requires: [],
    },
    {
      name: 'Signal Scheduler',
      description: 'Queues and publishes social media content at optimal times.',
      isCore: false,
      worksAlone: false,
      requires: ['Social Media Signal Agent'],
    },
    {
      name: 'Signal Analytics',
      description: 'Tracks engagement metrics across all social platforms.',
      isCore: false,
      worksAlone: false,
      requires: ['Social Media Signal Agent'],
    },
    {
      name: 'Creative Agent',
      description: 'Unified AI content generation for all channels. Creates on-brand content for web, social, campaigns, and blogs.',
      isCore: true,
      worksAlone: true,
      requires: [],
    },
    {
      name: 'Web Presence Agent',
      description: 'AI-powered website and blog management. Auto-optimizes SEO, monitors performance, auto-publishes blogs.',
      isCore: true,
      worksAlone: true,
      requires: ['Creative Agent'],
    },
  ],
},
```

**E) Add AI Operatives Hub console section**:
```typescript
{
  name: 'AI Operatives Hub',
  color: colors.indigo,
  colorLight: colors.indigoLight,
  description: 'Central management console for configuring, monitoring, and analyzing all 24 AI operatives.',
  features: [
    'Operative configuration and activation',
    'Quick Start batch activation',
    'Real-time workflow monitoring',
    'Analytics dashboard',
    'Conversation history browser',
  ],
  agents: [], // Management console - no dedicated agents
},
```

**F) Update all "Control Centers" to "Control Centers (Consoles)"**

**3.2 `src/components/documentation/ComprehensiveGuidesPDF.tsx`**

**A) Fix line 261**:
```text
Before: 'View all 24 specialized agents organized by 6 Control Centers'
After:  'View all 24 AI operatives organized across 7 Control Centers (Consoles)'
```

**B) Add missing agent guides for Creative Agent and Web Presence Agent**

**3.3 `src/components/documentation/PricingSummaryPDF.tsx`**

Already has 7-Tier, 24 operatives - verify terminology changes to "Control Centers (Consoles)"

**3.4 `src/components/documentation/CompanyGuidesPDF.tsx`**

**A) Fix "5 AI Control Centers" to "7 Control Centers (Consoles)"**

### Phase 4: Landing Page & UI (4 files)

**4.1 `src/pages/Index.tsx`**

**A) Move Creative Agent from "Outreach & Sales Ops" to "Social Media Signal Ops"**

**B) Add Web Presence Agent to "Social Media Signal Ops" category (lines 126-146)**:
```typescript
{
  name: 'Web Presence Agent',
  description: 'AI-powered website and blog management with SEO optimization',
  icon: Globe
}
```

**C) Update stat labels to "Control Centers (Consoles)"**

**4.2 `src/components/agents/TierComparisonCards.tsx`**

Line 135: Change "Control Centers" to "Control Centers (Consoles)"

**4.3 `src/pages/Help.tsx`**

Line 654: Change "7 Control Centers" to "7 Control Centers (Consoles)"

**4.4 `src/pages/AIAgentGuide.tsx`**

Lines 142-147: Update "Control Centers" terminology

### Phase 5: Edge Function (1 file)

**5.1 `supabase/functions/landing-chat/index.ts`**

Line 12: Change to "7 Control Centers (Consoles)"

### Phase 6: Legal (1 file)

**6.1 `src/pages/TermsOfService.tsx`**

Line 37: Change "seven Control Centers" to "seven Control Centers (Consoles)"

---

## Complete Agent Guide Content (For Platform Guides)

The AI Agents section should have these 14 guides:

1. AI Agents Hub Overview
2. AI Agent Workflow Guide
3. AI Receptionist (Triage)
4. Scheduling Agent
5. Follow-up & Review Agents
6. Field Operations Agents (Dispatch, Route, ETA, Check-in)
7. Business Operations Agents (Admin, Quoting, Invoice, Inventory)
8. Outreach & Sales Ops Agents (Campaign, Lead, Marketing)
9. Social Media Signal Agents (Social Content, Scheduler, Analytics)
10. **Creative Agent (Content Engine)** ← ADD
11. **Web Presence Agent** ← ADD
12. Analytics & Reporting Agents
13. Talk to Aura (Voice)
14. Knowledge Base AI Generator

---

## Verification Checklist

After implementation:
- [ ] All files show "24 AI Operatives"
- [ ] All files show "7 Control Centers (Consoles)"
- [ ] All files show "7 Subscription Tiers"
- [ ] Creative Agent documented in helpContentConfig.ts
- [ ] Web Presence Agent documented in helpContentConfig.ts
- [ ] Creative Agent guide in PlatformGuides.tsx
- [ ] Web Presence Agent guide in PlatformGuides.tsx
- [ ] Social Media & Web Presence console in AIAgentGuidesPDF.tsx
- [ ] AI Operatives Hub console in AIAgentGuidesPDF.tsx
- [ ] Social Media Signal Agent moved to correct console in AIAgentGuidesPDF.tsx
- [ ] Creative Agent moved to Social Media category on Index.tsx
- [ ] TOC navigation works with URL hash updates

---

## Files to Modify (Total: ~15 files)

| Priority | File | Changes |
|----------|------|---------|
| HIGH | `src/lib/helpContentConfig.ts` | Add Creative Agent, Web Presence Agent to social_media console |
| HIGH | `src/pages/PlatformGuides.tsx` | Add 2 agent guides, fix terminology, implement TOC navigation |
| HIGH | `src/components/documentation/AIAgentGuidesPDF.tsx` | Add 2 consoles, fix stats, move Social Signal Agent, add agents |
| HIGH | `src/components/documentation/ComprehensiveGuidesPDF.tsx` | Add 2 agent guides, fix terminology |
| MEDIUM | `src/pages/Index.tsx` | Move Creative Agent, add Web Presence Agent, fix terminology |
| MEDIUM | `src/components/documentation/CompanyGuidesPDF.tsx` | Fix console count and terminology |
| MEDIUM | `src/components/agents/TierComparisonCards.tsx` | Fix terminology |
| MEDIUM | `src/pages/Help.tsx` | Fix terminology |
| MEDIUM | `src/pages/AIAgentGuide.tsx` | Fix terminology |
| MEDIUM | `src/pages/TermsOfService.tsx` | Fix terminology |
| LOW | `supabase/functions/landing-chat/index.ts` | Fix terminology |
| LOW | Other PDF files | Verify terminology consistency |

---

## Technical Notes

1. **Single Source of Truth**: `documentationConfig.ts` has correct data (24 operatives, 7 consoles, 7 tiers). Other files must import/reference this data.

2. **Console-Agent Mapping** (per documentationConfig.ts):
   - `social_media` console has 5 agents: social_content, social_scheduler, social_analytics, creative, web_presence
   - This mapping must be reflected in all documentation

3. **Terminology Format**: Always use "Control Centers (Consoles)" - never just "Control Centers" or just "Consoles"

4. **TOC Navigation**: Will use `id` attributes, smooth scrolling, and `window.history.pushState` for URL hash updates
