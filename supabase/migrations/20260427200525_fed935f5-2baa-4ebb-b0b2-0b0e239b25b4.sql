
CREATE TABLE public.demo_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  prospect_email text NOT NULL,
  prospect_name text NOT NULL,
  prospect_phone text,
  industry text NOT NULL,
  admin_user_id uuid,
  employee_user_id uuid,
  customer_user_id uuid,
  admin_email text,
  employee_email text,
  customer_email text,
  password text NOT NULL,
  sms_opt_in boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours')
);

CREATE INDEX idx_demo_trials_expires_at ON public.demo_trials(expires_at) WHERE status = 'active';
CREATE INDEX idx_demo_trials_email ON public.demo_trials(prospect_email);

ALTER TABLE public.demo_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view demo trials"
  ON public.demo_trials FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Platform admins can update demo trials"
  ON public.demo_trials FOR UPDATE
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Platform admins can delete demo trials"
  ON public.demo_trials FOR DELETE
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
