
-- 1. company_agent_autonomy
CREATE TABLE public.company_agent_autonomy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'suggest' CHECK (mode IN ('off','suggest','auto_safe','auto_all')),
  confidence_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.80 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
  max_value_usd NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  daily_action_cap INTEGER NOT NULL DEFAULT 50,
  quiet_hours_start SMALLINT,
  quiet_hours_end SMALLINT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, agent_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_agent_autonomy TO authenticated;
GRANT ALL ON public.company_agent_autonomy TO service_role;

ALTER TABLE public.company_agent_autonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members view autonomy"
  ON public.company_agent_autonomy FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "company admins manage autonomy"
  ON public.company_agent_autonomy FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'platform_admin'))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'platform_admin'))
  );

CREATE INDEX idx_autonomy_company ON public.company_agent_autonomy(company_id);

-- 2. agent_proposed_actions
CREATE TABLE public.agent_proposed_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reverse_payload JSONB,
  risk_tier TEXT NOT NULL DEFAULT 'medium' CHECK (risk_tier IN ('low','medium','high')),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
  estimated_value_usd NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','auto_executed','approved','rejected','expired','failed','reverted')),
  requested_by_event TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  result_summary TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_proposed_actions TO authenticated;
GRANT ALL ON public.agent_proposed_actions TO service_role;

ALTER TABLE public.agent_proposed_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members view action queue"
  ON public.agent_proposed_actions FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "company admins approve/reject actions"
  ON public.agent_proposed_actions FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'platform_admin'))
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'platform_admin'))
  );

CREATE INDEX idx_proposed_actions_inbox ON public.agent_proposed_actions(company_id, status, created_at DESC);
CREATE INDEX idx_proposed_actions_agent ON public.agent_proposed_actions(company_id, agent_id, created_at DESC);

-- 3. update triggers
CREATE TRIGGER trg_autonomy_updated
  BEFORE UPDATE ON public.company_agent_autonomy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_proposed_actions_updated
  BEFORE UPDATE ON public.agent_proposed_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
