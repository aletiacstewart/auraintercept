
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tavily_caps jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.tavily_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('month')),
  period_key text NOT NULL,
  credits integer NOT NULL DEFAULT 0,
  cap integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tavily_usage_counters_unique
  ON public.tavily_usage_counters (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_key);

ALTER TABLE public.tavily_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read all tavily counters"
  ON public.tavily_usage_counters FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company admins read own tavily counters"
  ON public.tavily_usage_counters FOR SELECT
  USING (company_id IS NOT NULL AND public.get_user_company_id(auth.uid()) = company_id);

CREATE TRIGGER tavily_usage_counters_set_updated_at
  BEFORE UPDATE ON public.tavily_usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tavily_usage_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operation text NOT NULL,
  depth text,
  url_count integer,
  credits integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('sent','blocked_monthly','failed')),
  reason text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tavily_usage_attempts_company_created_idx
  ON public.tavily_usage_attempts (company_id, created_at DESC);

ALTER TABLE public.tavily_usage_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read all tavily attempts"
  ON public.tavily_usage_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company admins read own tavily attempts"
  ON public.tavily_usage_attempts FOR SELECT
  USING (company_id IS NOT NULL AND public.get_user_company_id(auth.uid()) = company_id);

CREATE OR REPLACE FUNCTION public.increment_tavily_usage(
  p_company_id uuid,
  p_credits integer,
  p_monthly_cap integer
)
RETURNS TABLE(allowed boolean, reason text, monthly_credits integer, monthly_cap integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_key text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_company uuid := COALESCE(p_company_id, '00000000-0000-0000-0000-000000000000'::uuid);
  v_credits integer;
BEGIN
  INSERT INTO public.tavily_usage_counters (company_id, period_type, period_key, credits, cap)
  VALUES (p_company_id, 'month', v_month_key, 0, p_monthly_cap)
  ON CONFLICT (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_key)
  DO NOTHING;

  SELECT c.credits INTO v_credits
    FROM public.tavily_usage_counters c
   WHERE COALESCE(c.company_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_company
     AND c.period_type = 'month' AND c.period_key = v_month_key
   FOR UPDATE;

  IF v_credits + p_credits > p_monthly_cap THEN
    RETURN QUERY SELECT false, 'monthly_cap_reached'::text, v_credits, p_monthly_cap;
    RETURN;
  END IF;

  UPDATE public.tavily_usage_counters
     SET credits = credits + p_credits, cap = p_monthly_cap, updated_at = now()
   WHERE COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_company
     AND period_type = 'month' AND period_key = v_month_key;

  RETURN QUERY SELECT true, 'ok'::text, v_credits + p_credits, p_monthly_cap;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_tavily_usage(uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_tavily_usage(uuid, integer, integer) TO authenticated, service_role;
