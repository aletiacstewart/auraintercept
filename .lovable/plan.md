
# Tavily AI Integration Setup

## Overview
Add Tavily as a new 3rd party integration for AI-powered web research with **1,000 free searches per month**. This follows the established pattern used for Resend, Twilio, and ElevenLabs integrations.

---

## What is Tavily?
Tavily is an AI-optimized search API specifically designed for AI agents. Key benefits:
- **1,000 free searches/month** - no credit card required
- Returns structured, AI-ready data (not raw HTML)
- Includes citations and sources
- Perfect for enhancing social media content with current industry trends

---

## Technical Implementation

### 1. Database Migration
Add `tavily_api_key` column to the `tenant_integrations` table:

```sql
ALTER TABLE tenant_integrations 
ADD COLUMN tavily_api_key TEXT;
```

### 2. New Files to Create

| File | Purpose |
|------|---------|
| `src/components/integrations/TavilySetupGuide.tsx` | Step-by-step accordion guide |
| `src/pages/integrations/TavilyIntegration.tsx` | Dedicated integration page |

### 3. Files to Modify

| File | Change |
|------|--------|
| `src/pages/integrations/index.ts` | Add export for TavilyIntegration |
| `src/App.tsx` | Add route `/dashboard/integrations/tavily` |
| `src/components/dashboard/DashboardLayout.tsx` | Add "AI Research" nav item |
| `src/pages/Integrations.tsx` | Add Tavily card to overview |

---

## Setup Guide Structure

The TavilySetupGuide component will include these accordion sections:

| Step | Title | Content |
|------|-------|---------|
| 1 | What is Tavily? | AI-optimized search API explanation |
| 2 | Create Free Account | Sign up at tavily.com (no credit card) |
| 3 | Get API Key | Navigate to dashboard and copy key |
| 4 | Free Tier Details | 1,000 searches/month, $5/1,000 after |
| 5 | How It's Used | Integration with social media content generation |

---

## Navigation Updates

Add to "3rd Party Integrations" section in sidebar:
```typescript
{ 
  label: 'AI Research', 
  icon: Search,  // from lucide-react
  href: '/dashboard/integrations/tavily', 
  roles: ['platform_admin', 'company_admin'], 
  featureColor: 'text-feature-integrations' 
}
```

---

## Integration Card for Overview Page

```typescript
{
  id: 'tavily',
  name: 'Tavily AI',
  description: 'AI-powered web research for content enhancement.',
  icon: Search,
  color: 'bg-cyan-500',
  docsUrl: 'https://tavily.com',
  fields: [
    { 
      key: 'tavily_api_key', 
      label: 'API Key', 
      placeholder: 'tvly-...', 
      type: 'password', 
      required: true 
    }
  ],
  checkConnection: (data) => !!data.tavily_api_key,
  note: '1,000 free searches/month. Enhances social content with current trends.'
}
```

---

## Component Preview

```text
+----------------------------------------------------------+
|  Tavily AI Setup Guide                       [AI Research]
|  Configure AI-powered web search for content enhancement
+----------------------------------------------------------+
|
|  [1] What is Tavily?
|      > AI-optimized search API built for AI agents
|      > Returns structured data with citations
|      > Perfect for finding current industry trends
|
|  [2] Create Free Account
|      > Go to tavily.com and sign up
|      > No credit card required for free tier
|      > Verify your email
|
|  [3] Get Your API Key
|      > Go to dashboard.tavily.com
|      > Copy your API key (starts with tvly-)
|
|  [4] Free Tier (1,000 searches/month)
|      > Free: 1,000 API calls per month
|      > Pro: $5 per 1,000 additional calls
|      > No usage tracking needed on our end
|
|  [5] How It Works
|      > When generating social content, Tavily
|        searches for current trends on your topics
|      > Results include sources and citations
|      > AI uses this to write more relevant posts
|
+----------------------------------------------------------+
```

---

## Summary of Changes

| Item | Action | Notes |
|------|--------|-------|
| Database migration | Add column | `tavily_api_key` to tenant_integrations |
| `TavilySetupGuide.tsx` | Create | 5-step accordion guide |
| `TavilyIntegration.tsx` | Create | Full integration page |
| `pages/integrations/index.ts` | Modify | Add export |
| `App.tsx` | Modify | Add route |
| `DashboardLayout.tsx` | Modify | Add nav item |
| `Integrations.tsx` | Modify | Add to overview grid |

---

## Cost Comparison

| Service | Free Tier | Paid Rate |
|---------|-----------|-----------|
| **Tavily** | 1,000/month | $0.005/search |
| Perplexity | None | $0.005-0.02/search |
| Brave Search | 2,000/month | $0.003/search |

Tavily offers the best balance of free tier + AI-optimized responses for this use case.
