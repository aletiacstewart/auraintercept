
-- 1. Traceability columns
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS source_context_id uuid REFERENCES public.ai_agent_context(id) ON DELETE SET NULL;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS source_context_id uuid REFERENCES public.ai_agent_context(id) ON DELETE SET NULL;
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS context_id uuid REFERENCES public.ai_agent_context(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_source_context ON public.quotes(source_context_id) WHERE source_context_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_source_context ON public.invoices(source_context_id) WHERE source_context_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_context ON public.call_logs(context_id) WHERE context_id IS NOT NULL;

-- 2. Merged customer interaction history RPC
CREATE OR REPLACE FUNCTION public.get_customer_interaction_history(
  p_company_id uuid,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  kind text,
  occurred_at timestamptz,
  agent text,
  summary text,
  payload jsonb,
  context_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_email text := lower(nullif(trim(p_email), ''));
  v_norm_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
BEGIN
  -- Access scope: platform admin OR same-company user
  IF NOT (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = p_company_id
  ) THEN
    RETURN;
  END IF;

  IF v_norm_email IS NULL AND v_norm_phone IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH
  ctx AS (
    SELECT
      'ai_context'::text                       AS kind,
      c.updated_at                              AS occurred_at,
      coalesce(c.active_agent, 'agent')         AS agent,
      coalesce(c.context_data->>'last_intent', 'AI conversation') AS summary,
      jsonb_build_object(
        'context_data', c.context_data,
        'handoff_history', c.handoff_history,
        'customer_name', c.customer_name,
        'customer_email', c.customer_email,
        'customer_phone', c.customer_phone
      )                                          AS payload,
      c.id                                       AS context_id
    FROM public.ai_agent_context c
    WHERE c.company_id = p_company_id
      AND (
        (v_norm_email IS NOT NULL AND lower(c.customer_email) = v_norm_email)
        OR (v_norm_phone IS NOT NULL AND regexp_replace(coalesce(c.customer_phone,''), '\D', '', 'g') = v_norm_phone)
      )
  ),
  calls AS (
    SELECT
      'call'::text                                AS kind,
      coalesce(cl.ended_at, cl.started_at)        AS occurred_at,
      'voice_call'::text                          AS agent,
      coalesce(nullif(cl.summary, ''),
               cl.direction || ' call (' || coalesce(cl.status,'?') || ')') AS summary,
      jsonb_build_object(
        'transcript', cl.transcript,
        'summary', cl.summary,
        'recording_url', cl.recording_url,
        'duration_seconds', cl.duration_seconds,
        'direction', cl.direction,
        'from_number', cl.from_number,
        'to_number', cl.to_number
      )                                           AS payload,
      cl.context_id                               AS context_id
    FROM public.call_logs cl
    WHERE cl.company_id = p_company_id
      AND v_norm_phone IS NOT NULL
      AND (
        regexp_replace(coalesce(cl.customer_phone,''), '\D', '', 'g') = v_norm_phone
        OR regexp_replace(coalesce(cl.from_number,''), '\D', '', 'g') = v_norm_phone
        OR regexp_replace(coalesce(cl.to_number,''), '\D', '', 'g') = v_norm_phone
      )
  ),
  texts AS (
    SELECT
      'sms'::text                                 AS kind,
      sl.created_at                               AS occurred_at,
      'sms'::text                                 AS agent,
      coalesce(left(sl.message, 140), sl.direction || ' sms') AS summary,
      jsonb_build_object(
        'message', sl.message,
        'direction', sl.direction,
        'from_number', sl.from_number,
        'to_number', sl.to_number,
        'status', sl.status
      )                                           AS payload,
      NULL::uuid                                  AS context_id
    FROM public.sms_logs sl
    WHERE sl.company_id = p_company_id
      AND v_norm_phone IS NOT NULL
      AND (
        regexp_replace(coalesce(sl.from_number,''), '\D', '', 'g') = v_norm_phone
        OR regexp_replace(coalesce(sl.to_number,''), '\D', '', 'g') = v_norm_phone
      )
  ),
  logs AS (
    SELECT
      'agent_action'::text                        AS kind,
      al.created_at                               AS occurred_at,
      al.agent_type                               AS agent,
      coalesce(al.action, 'agent action')         AS summary,
      jsonb_build_object(
        'input', al.input_data,
        'output', al.output_data,
        'success', al.success,
        'duration_ms', al.duration_ms
      )                                           AS payload,
      al.context_id                               AS context_id
    FROM public.ai_agent_logs al
    WHERE al.company_id = p_company_id
      AND al.context_id IN (SELECT context_id FROM ctx WHERE context_id IS NOT NULL)
  )
  SELECT * FROM ctx
  UNION ALL SELECT * FROM calls
  UNION ALL SELECT * FROM texts
  UNION ALL SELECT * FROM logs
  ORDER BY occurred_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 25), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_interaction_history(uuid, text, text, int) TO authenticated, service_role;
