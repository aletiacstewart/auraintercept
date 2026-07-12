ALTER TABLE public.job_assignments
  ADD COLUMN IF NOT EXISTS review_request_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_job_assignments_review_request_sent_at
  ON public.job_assignments (review_request_sent_at)
  WHERE review_request_sent_at IS NOT NULL;