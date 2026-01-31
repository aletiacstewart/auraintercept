
# Add Tavily AI Research & AI Generate Buttons Across All Pages

## Overview
Add consistent AI generation capabilities with Tavily research integration across Blog posts, Social Media wizard, and Web Presence pages. This includes adding inline "AI Generate" buttons to form fields and showing Tavily connection status.

---

## Current State Analysis

| Feature | AI Generate Buttons | Tavily Integration | Tavily Status Shown |
|---------|--------------------|--------------------|---------------------|
| Campaign Forms | ✅ Yes (inline) | ✅ Yes | ❌ No |
| Blog Wizard | ✅ Yes (separate) | ✅ Yes | ✅ Yes |
| Blog Dialog (New Post) | ❌ No | ❌ No | ❌ No |
| Social Media Wizard | ❌ No (auto-generates) | ❌ No | ❌ No |
| Web Presence | ✅ Yes (AIContentButton) | ❌ No | ❌ No |

---

## Implementation Plan

### 1. Create Reusable Tavily Status Component
Create a small component that shows if Tavily is connected and can be reused across all pages.

**New File:** `src/components/ai/TavilyStatusBadge.tsx`

```text
+-----------------------------------------------+
| ✓ Tavily Connected - Will research trends     |
+-----------------------------------------------+
```

### 2. Update Edge Functions for Tavily

**Files to Modify:**
- `supabase/functions/generate-social-variations/index.ts`
- `supabase/functions/generate-website-content/index.ts`

**Changes:**
- Accept `companyId` parameter
- Fetch Tavily API key from `tenant_integrations`
- If key exists, search for relevant industry trends
- Include research in AI prompt

### 3. Add AI Generate Buttons to Blog Post Dialog

**File:** `src/pages/BlogManagement.tsx`

Add inline AI Generate buttons (using AIContentButton pattern) to:
- Title field
- Excerpt field  
- Content field

```text
+----------------------------------------------------------+
|  Title                                   [✨ AI Generate] |
|  +-----------------------------------------------------+  |
|  | Article title...                                    |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Excerpt                                 [✨ AI Generate] |
|  +-----------------------------------------------------+  |
|  | Brief summary...                                    |  |
|  +-----------------------------------------------------+  |
+----------------------------------------------------------+
```

### 4. Update Social Media Wizard

**File:** `src/components/social/SocialContentWizard.tsx`

**Changes:**
- Add TavilyStatusBadge to Step 1
- Pass companyId to check Tavily status
- Update generation progress text when Tavily is used

```text
Step 1: Topic & Platforms
+----------------------------------------------------------+
|  What would you like to post about?       [📋 Templates]  |
|  +-----------------------------------------------------+  |
|  | e.g., Summer AC maintenance special...              |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  [✓ Tavily Connected - Will research current trends]      |
+----------------------------------------------------------+
```

### 5. Update Web Presence Manager

**File:** `src/pages/SmartWebsiteManager.tsx`

**Changes:**
- Add TavilyStatusBadge to Content tab header
- Update AIContentButton to accept/pass context for Tavily

### 6. Update AIContentButton Component

**File:** `src/components/ai/AIContentButton.tsx`

**Changes:**
- Add optional prop to show Tavily badge inline
- Pass companyId to edge function (already does this)

---

## Edge Function Changes Detail

### generate-social-variations/index.ts
```typescript
// Add after fetching company data
const { data: integrations } = await supabase
  .from('tenant_integrations')
  .select('tavily_api_key')
  .eq('company_id', companyId)
  .single();

let tavilyResearch = '';
if (integrations?.tavily_api_key) {
  const searchQuery = `${topic} ${serviceCategories.join(' ')} marketing trends`;
  const tavilyResponse = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: integrations.tavily_api_key,
      query: searchQuery,
      search_depth: 'basic',
      max_results: 3
    })
  });
  // Format and include in prompt
}
```

### generate-website-content/index.ts
Same pattern - fetch Tavily key and research relevant content for the field type.

---

## New Content Types for AIContentButton

Add to `src/components/ai/AIContentButton.tsx`:
```typescript
| 'blog_title' | 'blog_excerpt' | 'blog_content'
```

Add to `supabase/functions/generate-website-content/index.ts`:
```typescript
blog_title: {
  generate: "Create an engaging, SEO-friendly blog title...",
  reword: "Improve this blog title..."
},
blog_excerpt: {
  generate: "Write a compelling meta description for this blog...",
  reword: "Improve this excerpt..."
},
blog_content: {
  generate: "Write a comprehensive blog section...",
  reword: "Improve this blog content..."
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ai/TavilyStatusBadge.tsx` | Reusable Tavily connection indicator |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BlogManagement.tsx` | Add AIContentButton to Title, Excerpt, Content fields |
| `src/components/social/SocialContentWizard.tsx` | Add TavilyStatusBadge, update progress messages |
| `src/pages/SmartWebsiteManager.tsx` | Add TavilyStatusBadge to Content tab |
| `src/components/ai/AIContentButton.tsx` | Add blog content types |
| `supabase/functions/generate-social-variations/index.ts` | Add Tavily research |
| `supabase/functions/generate-website-content/index.ts` | Add Tavily research + blog content types |

---

## Visual Summary

### Before vs After - Blog Post Dialog

**Before:**
```text
Title: [___________________]
Excerpt: [_________________]
Content: [_________________]
```

**After:**
```text
Title: [___________________] [✨]
Excerpt: [_________________] [✨]
Content: [_________________] [✨]

[✓ Tavily Connected - AI will research trends]
```

### Before vs After - Social Media Wizard

**Before:**
```text
What would you like to post about?
[________________________________]
```

**After:**
```text
What would you like to post about?    [📋 Templates]
[________________________________]

[✓ Tavily Connected - Will research current trends]
```

---

## Summary

| Component | Add AI Buttons | Add Tavily Check | Show Status |
|-----------|---------------|------------------|-------------|
| Blog Dialog | ✅ Title, Excerpt, Content | ✅ | ✅ |
| Social Wizard | Already has | ✅ | ✅ |
| Web Presence | Already has | ✅ | ✅ |
| Campaign Forms | Already has | Already has | ✅ |

**Total Edge Functions to Update:** 2
**Total Components to Update:** 5
**New Components:** 1

