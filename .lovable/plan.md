

# Fix: Dashboard & Analytics Data Not Displaying

## Problem Identified

The dashboard shows zeros for blog posts and potentially other stats because of a **bug in the data fetching query**.

### Root Cause
Line 64 in `CompanyAdminDashboard.tsx`:
```typescript
supabase.from('blog_posts').select('id, published', { count: 'exact', head: true }),
```

This query fetches **ALL** blog posts across the entire platform instead of filtering by company. The `blog_posts` table doesn't have a `company_id` column - it has `author_id` which must be cross-referenced with `profiles` to get company-specific posts.

## Fix Required

### File: `src/components/dashboard/CompanyAdminDashboard.tsx`

**Change the blog_posts query to filter by company authors:**

The fix requires a two-step approach since blog_posts uses author_id:
1. First, get all profile IDs for the company (already fetched)
2. Then query blog_posts where author_id is in those profile IDs

```text
Before (buggy):
  supabase.from('blog_posts').select('id, published', { count: 'exact', head: true }),

After (fixed):
  supabase.from('profiles').select('id').eq('company_id', companyId),
  // Then use the profile IDs to query blog_posts
```

### Implementation Steps

1. **Restructure the query** - Split the Promise.all to first fetch profile IDs, then use those to filter blog_posts
2. **Alternative approach** - Use a subquery or a separate sequential fetch for blog_posts after getting employee IDs

### Technical Details

The fix modifies the stats query to:
1. Fetch profile IDs first (already being done for employee count)
2. Reuse those IDs to filter blog_posts by `author_id`
3. This matches how `BlogAnalytics.tsx` already correctly handles this (see lines 29-44 of that component)

### Current Database State
- `blog_posts`: 0 records
- `reminder_logs`: 0 records  
- `social_posts`: 0 records
- `site_metrics`: 1 record
- `marketing_campaigns`: 2 records

The analytics tabs and dashboard cards **are correctly implemented** - they just need the blog_posts query fix and actual data to display.

