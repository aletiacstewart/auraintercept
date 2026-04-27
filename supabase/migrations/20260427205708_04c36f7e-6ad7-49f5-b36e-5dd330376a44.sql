-- Tag companies created by the demo flow
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_email_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_sms_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_companies_is_demo ON public.companies (is_demo) WHERE is_demo = true;

-- Mirror email opt-in on demo_trials
ALTER TABLE public.demo_trials
  ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Public lookup so the share link can render the credentials card without auth
CREATE OR REPLACE FUNCTION public.get_demo_trial_access(p_trial_id UUID)
RETURNS TABLE(
  trial_id UUID,
  company_id UUID,
  expires_at TIMESTAMPTZ,
  status TEXT,
  industry TEXT,
  password TEXT,
  admin_email TEXT,
  employee_email TEXT,
  customer_email TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dt.id,
    dt.company_id,
    dt.expires_at,
    dt.status,
    dt.industry,
    dt.password,
    dt.admin_email,
    dt.employee_email,
    dt.customer_email
  FROM public.demo_trials dt
  WHERE dt.id = p_trial_id
    AND dt.status = 'active'
    AND dt.expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.get_demo_trial_access(UUID) TO anon, authenticated;