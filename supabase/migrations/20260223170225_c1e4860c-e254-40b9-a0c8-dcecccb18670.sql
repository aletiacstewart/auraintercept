
ALTER TABLE public.scheduled_social_posts
  DROP CONSTRAINT IF EXISTS scheduled_social_posts_status_check;

ALTER TABLE public.scheduled_social_posts
  ADD CONSTRAINT scheduled_social_posts_status_check
  CHECK (status IN ('pending', 'approved', 'ready_to_post', 'published', 'rejected', 'failed'));
