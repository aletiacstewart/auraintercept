ALTER TABLE public.ai_agent_logs
  ADD COLUMN IF NOT EXISTS trace_id uuid,
  ADD COLUMN IF NOT EXISTS span_id uuid,
  ADD COLUMN IF NOT EXISTS parent_span_id uuid,
  ADD COLUMN IF NOT EXISTS span_name text,
  ADD COLUMN IF NOT EXISTS status text;

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_company_created
  ON public.ai_agent_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_trace
  ON public.ai_agent_logs (trace_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_agent_created
  ON public.ai_agent_logs (company_id, agent_type, created_at DESC);

ALTER TABLE public.agent_performance_metrics
  ADD COLUMN IF NOT EXISTS p95_response_time_ms integer,
  ADD COLUMN IF NOT EXISTS error_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_perf_company_agent_date
  ON public.agent_performance_metrics (company_id, agent_type, date);

GRANT SELECT ON public.ai_agent_logs TO authenticated;
GRANT ALL ON public.ai_agent_logs TO service_role;
GRANT SELECT ON public.agent_performance_metrics TO authenticated;
GRANT ALL ON public.agent_performance_metrics TO service_role;