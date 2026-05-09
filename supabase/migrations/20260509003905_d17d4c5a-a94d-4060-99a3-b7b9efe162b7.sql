
-- Per-company email cap overrides
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS email_caps jsonb DEFAULT '{}'::jsonb;

-- Counters
CREATE TABLE IF NOT EXISTS public.email_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('day','month')),
  period_key text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  cap integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_usage_counters_unique
  ON public.email_usage_counters (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_key);

ALTER TABLE public.email_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read all counters"
  ON public.email_usage_counters FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company admins read own counters"
  ON public.email_usage_counters FOR SELECT
  USING (company_id IS NOT NULL AND public.get_user_company_id(auth.uid()) = company_id);

-- Audit log
CREATE TABLE IF NOT EXISTS public.email_send_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  template text,
  status text NOT NULL CHECK (status IN ('sent','blocked_daily','blocked_monthly','failed','overridden_critical')),
  reason text,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_send_attempts_company_created_idx
  ON public.email_send_attempts (company_id, created_at DESC);

ALTER TABLE public.email_send_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read all attempts"
  ON public.email_send_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company admins read own attempts"
  ON public.email_send_attempts FOR SELECT
  USING (company_id IS NOT NULL AND public.get_user_company_id(auth.uid()) = company_id);

-- Trigger to maintain updated_at
CREATE TRIGGER email_usage_counters_set_updated_at
  BEFORE UPDATE ON public.email_usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic check + increment
CREATE OR REPLACE FUNCTION public.increment_email_usage(
  p_company_id uuid,
  p_daily_cap integer,
  p_monthly_cap integer
)
RETURNS TABLE(allowed boolean, reason text, daily_count integer, monthly_count integer, daily_cap integer, monthly_cap integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_day_key text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_month_key text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_company uuid := COALESCE(p_company_id, '00000000-0000-0000-0000-000000000000'::uuid);
  v_day_count integer;
  v_month_count integer;
BEGIN
  -- Ensure rows exist
  INSERT INTO public.email_usage_counters (company_id, period_type, period_key, count, cap)
  VALUES (p_company_id, 'day', v_day_key, 0, p_daily_cap)
  ON CONFLICT (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_key)
  DO NOTHING;

  INSERT INTO public.email_usage_counters (company_id, period_type, period_key, count, cap)
  VALUES (p_company_id, 'month', v_month_key, 0, p_monthly_cap)
  ON CONFLICT (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_key)
  DO NOTHING;

  -- Lock and read current counts
  SELECT c.count INTO v_day_count
    FROM public.email_usage_counters c
   WHERE COALESCE(c.company_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_company
     AND c.period_type = 'day' AND c.period_key = v_day_key
   FOR UPDATE;

  SELECT c.count INTO v_month_count
    FROM public.email_usage_counters c
   WHERE COALESCE(c.company_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_company
     AND c.period_type = 'month' AND c.period_key = v_month_key
   FOR UPDATE;

  IF v_day_count >= p_daily_cap THEN
    RETURN QUERY SELECT false, 'daily_cap_reached'::text, v_day_count, v_month_count, p_daily_cap, p_monthly_cap;
    RETURN;
  END IF;

  IF v_month_count >= p_monthly_cap THEN
    RETURN QUERY SELECT false, 'monthly_cap_reached'::text, v_day_count, v_month_count, p_daily_cap, p_monthly_cap;
    RETURN;
  END IF;

  UPDATE public.email_usage_counters
     SET count = count + 1, cap = p_daily_cap, updated_at = now()
   WHERE COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_company
     AND period_type = 'day' AND period_key = v_day_key;

  UPDATE public.email_usage_counters
     SET count = count + 1, cap = p_monthly_cap, updated_at = now()
   WHERE COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_company
     AND period_type = 'month' AND period_key = v_month_key;

  RETURN QUERY SELECT true, 'ok'::text, v_day_count + 1, v_month_count + 1, p_daily_cap, p_monthly_cap;
END;
$$;
