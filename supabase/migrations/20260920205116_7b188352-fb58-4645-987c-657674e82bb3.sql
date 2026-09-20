ALTER TABLE public.ai_agent_events
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ai_agent_events_pending
  ON public.ai_agent_events (status, next_attempt_at)
  WHERE status = 'pending';