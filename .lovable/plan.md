

# Fix Tavily AI Content Research Integration

## Problem Summary

Tavily AI is properly configured with an API key, but the 6 edge functions that use it for content research cannot deploy due to bundle generation timeouts caused by unstable `esm.sh` imports.

---

## Affected Edge Functions

| Function | Uses Tavily | Status |
|----------|-------------|--------|
| `generate-social-variations` | Yes | ❌ Not deployed |
| `generate-social-batch` | Yes | ❌ Not deployed |
| `generate-blog-content` | Yes | ❌ Not deployed |
| `generate-blog-batch` | Yes | ❌ Not deployed |
| `generate-campaign-content` | Yes | ❌ Not deployed |
| `generate-website-content` | Yes | ❌ Not deployed |

---

## Solution

Update all 6 edge functions to use the stable `npm:` import specifier instead of `esm.sh`:

```text
BEFORE: import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
AFTER:  import { createClient } from "npm:@supabase/supabase-js@2";
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-social-variations/index.ts` | Update import on line 2 |
| `supabase/functions/generate-social-batch/index.ts` | Update import on line 2 |
| `supabase/functions/generate-blog-content/index.ts` | Update import on line 2 |
| `supabase/functions/generate-blog-batch/index.ts` | Update import on line 2 |
| `supabase/functions/generate-campaign-content/index.ts` | Update import on line 2 |
| `supabase/functions/generate-website-content/index.ts` | Update import on line 2 |

---

## Expected Outcome

After this fix:
- All 6 content generation edge functions will deploy successfully
- Tavily AI research will enhance content for:
  - Social media posts (trending insights)
  - Blog articles (industry research)
  - Marketing campaigns (market data)
  - Website content (SEO trends)
- The TavilyStatusBadge will accurately reflect the working integration

---

## AI Agents Enabled by This Fix

| Agent | Category | Research Capability |
|-------|----------|---------------------|
| Social Media Agent | Social Media | Trending topics & hashtags |
| Creative Agent | Creative & Web | Industry insights & statistics |
| Campaign Agent | Marketing & Sales | Market trends & competitor data |
| Web Presence Agent | Creative & Web | SEO trends & best practices |

