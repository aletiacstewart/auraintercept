
# Blog Content Generation System with Tavily Integration

## Overview
Create an AI-powered blog generation system similar to the social media posts wizard, with Tavily research integration. Also integrate Tavily into campaign content generation.

---

## System Architecture

```text
+--------------------+     +-------------------------+     +------------------+
|  BlogContentWizard | --> | generate-blog-content   | --> | Lovable AI       |
|  (Topic + Keywords)|     | (edge function)         |     | (Gemini)         |
+--------------------+     +-------------------------+     +------------------+
                                    |                              ^
                                    v                              |
                           +------------------+             Research context
                           | Tavily API       |             included in prompt
                           | (if configured)  |--------------------+
                           +------------------+

+--------------------+     +-------------------------+     +------------------+
|  Campaign Form     | --> | generate-campaign-      | --> | Lovable AI       |
|  (Email/SMS/Ads)   |     | content (updated)       |     | (Gemini)         |
+--------------------+     +-------------------------+     +------------------+
                                    |                              ^
                                    v                              |
                           +------------------+             Research context
                           | Tavily API       |--------------------+
                           +------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-blog-content/index.ts` | New edge function for AI blog generation with Tavily |
| `src/components/blog/BlogContentWizard.tsx` | Multi-step wizard for blog creation |
| `src/components/blog/BlogTopicInput.tsx` | Topic and keyword input component |
| `src/components/blog/BlogPreview.tsx` | Live preview of generated blog content |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-campaign-content/index.ts` | Add Tavily research integration |
| `src/pages/BlogManagement.tsx` | Add "AI Generate" button, integrate wizard |
| `src/components/marketing/forms/CampaignForm.tsx` | Pass companyId for Tavily lookup |
| `src/pages/Campaigns.tsx` | Pass companyId for Tavily lookup |

---

## 1. New Edge Function: generate-blog-content

### Functionality
- Accept topic, keywords, tone, and companyId
- Fetch Tavily API key from tenant_integrations
- If Tavily configured: research current trends on the topic
- Generate full blog article with:
  - Title
  - SEO-optimized slug
  - Excerpt (meta description)
  - Full HTML content (with proper headings, paragraphs)
  - Suggested featured image description

### Tavily Integration
```typescript
// Check for Tavily API key
const { data: integrations } = await supabase
  .from('tenant_integrations')
  .select('tavily_api_key')
  .eq('company_id', companyId)
  .single();

let researchContext = '';
if (integrations?.tavily_api_key) {
  const tavilyResponse = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: integrations.tavily_api_key,
      query: `${topic} ${keywords.join(' ')} latest trends insights`,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: true
    })
  });
  
  const research = await tavilyResponse.json();
  researchContext = formatResearchForPrompt(research);
}
```

### AI Prompt Structure
```text
=== RESEARCH CONTEXT ===
${researchContext || 'No external research available'}

=== TASK ===
Write a comprehensive blog article about: ${topic}

Keywords to include naturally: ${keywords.join(', ')}
Tone: ${tone}
Target length: ${wordCount} words

Generate:
1. Engaging title (SEO-optimized)
2. URL slug
3. Meta description (150-160 chars)
4. Full article with:
   - Introduction hook
   - 3-5 main sections with H2 headings
   - Practical tips or insights
   - Conclusion with CTA
```

---

## 2. BlogContentWizard Component

### Step 1: Topic & Setup
- Topic input field
- Target keywords (comma-separated)
- Tone selector (professional, casual, educational)
- Target word count (500, 1000, 1500)
- Optional: Featured image upload

### Step 2: AI Generation
- Progress indicator
- Shows research happening (if Tavily configured)
- Generates full blog content

### Step 3: Review & Edit
- Title editor
- Slug editor (auto-generated, editable)
- Excerpt/meta description editor
- Rich text content editor
- Live preview panel
- Publish or Save as Draft options

### UI Pattern
```text
+----------------------------------------------------------+
|  AI Blog Generator                         Step 1 of 3    |
|----------------------------------------------------------+
|                                                           |
|  What would you like to write about?                      |
|  +-----------------------------------------------------+  |
|  | Enter your blog topic...                            |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Target Keywords (optional)                               |
|  +-----------------------------------------------------+  |
|  | HVAC maintenance, energy efficiency, home comfort   |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Tone         [Professional ▼]                            |
|  Word Count   [1000 words ▼]                              |
|                                                           |
|  [Tavily Connected: Will research current trends ✓]       |
|                                                           |
|                              [Cancel]  [Generate Blog →]  |
+----------------------------------------------------------+
```

---

## 3. Update Campaign Content Generation

### Changes to generate-campaign-content/index.ts
- Accept `companyId` parameter
- Fetch Tavily key if companyId provided
- Research relevant trends before generating:
  - Email subjects
  - Email body content
  - SMS messages
  - Campaign ads

### Search Query Logic by Campaign Type
| Campaign Type | Tavily Search Query |
|---------------|---------------------|
| Promotional | "{industry} promotional offers trends" |
| Win-back | "customer re-engagement strategies {industry}" |
| Seasonal | "seasonal marketing {currentSeason} {industry}" |
| Referral | "referral marketing best practices" |

---

## 4. Integration into BlogManagement.tsx

### New Elements
- "AI Generate" button next to "New Post" button
- Triggers BlogContentWizard modal
- On success: opens edit dialog with generated content pre-filled

### Flow
```text
User clicks "AI Generate"
    ↓
BlogContentWizard opens
    ↓
User enters topic + keywords
    ↓
Edge function generates content (with Tavily research)
    ↓
User reviews/edits generated content
    ↓
User saves as draft or publishes
```

---

## Benefits of Tavily Integration

| Feature | Without Tavily | With Tavily |
|---------|----------------|-------------|
| Blog Content | Generic AI writing | Current trends + statistics included |
| Campaign Emails | Standard marketing copy | Industry-specific insights |
| SMS Messages | Basic templates | Timely, relevant messaging |
| Source Citations | None | Can include recent data points |

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `generate-blog-content/index.ts` | Create | New edge function with Tavily |
| `generate-campaign-content/index.ts` | Modify | Add Tavily research integration |
| `BlogContentWizard.tsx` | Create | 3-step blog generation wizard |
| `BlogTopicInput.tsx` | Create | Topic/keyword input component |
| `BlogPreview.tsx` | Create | Live blog preview component |
| `BlogManagement.tsx` | Modify | Add AI Generate button + wizard |
| `CampaignForm.tsx` | Modify | Pass companyId to edge function |
| `Campaigns.tsx` | Modify | Pass companyId to edge function |

---

## Edge Function Config

Add to `supabase/config.toml`:
```toml
[functions.generate-blog-content]
verify_jwt = false
```
