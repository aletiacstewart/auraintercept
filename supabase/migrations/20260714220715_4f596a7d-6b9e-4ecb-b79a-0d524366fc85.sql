DROP POLICY IF EXISTS "Platform admins can manage blog posts" ON public.blog_posts;

CREATE POLICY "Platform admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));