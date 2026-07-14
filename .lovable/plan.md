# Fix: `/blog` returns 401 "permission denied for table user_roles"

## Root cause
`public.blog_posts` has two RLS policies:

1. `Anyone can view published blog posts` — `FOR SELECT USING (published = true)` ✅
2. `Platform admins can manage blog posts` — `FOR ALL` with `EXISTS (SELECT 1 FROM user_roles ...)` on role `public`

Because policy #2 is `FOR ALL`, Postgres also evaluates it during anonymous `SELECT`. The subquery hits `public.user_roles`, on which `anon` has no `SELECT` grant, so PostgREST returns `42501 permission denied for table user_roles` before the OR with policy #1 can save the request. `/blog` therefore shows the empty state even though 3 posts are `published = true`.

## Fix (single migration)
Drop the old management policy and recreate it scoped to authenticated users, using the existing `SECURITY DEFINER` helper `public.has_role(...)` instead of a bare subquery on `user_roles`:

```sql
DROP POLICY "Platform admins can manage blog posts" ON public.blog_posts;

CREATE POLICY "Platform admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
```

Effects:
- Anon `SELECT` only evaluates policy #1 → returns published posts.
- Authenticated non-admins: policy #1 still allows published-only reads; policy #2 no longer leaks the user_roles error.
- Platform admins keep full manage access via `has_role` (SECURITY DEFINER bypasses the missing anon grant).

## Verify
1. Anon `GET /rest/v1/blog_posts?published=eq.true` → 200 with 3 rows.
2. Reload `/blog` → 3 Aura Intercept posts render.
3. Admin blog panel still lists/edits/creates posts.

## Out of scope
Blog content, scheduling, or UI.
