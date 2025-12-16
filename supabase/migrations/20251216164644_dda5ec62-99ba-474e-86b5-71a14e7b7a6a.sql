-- AI Agent Configurations (per company, per agent)
CREATE TABLE public.ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, agent_type)
);

-- AI Agent Events (inter-agent communication)
CREATE TABLE public.ai_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_agent TEXT NOT NULL,
  target_agent TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Agent Context (shared state for customer journeys)
CREATE TABLE public.ai_agent_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id UUID,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,
  context_data JSONB DEFAULT '{}',
  active_agent TEXT,
  handoff_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Agent Logs (for debugging and analytics)
CREATE TABLE public.ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  context_id UUID REFERENCES public.ai_agent_context(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_agent_configs_company ON public.ai_agent_configs(company_id);
CREATE INDEX idx_ai_agent_events_company ON public.ai_agent_events(company_id);
CREATE INDEX idx_ai_agent_events_status ON public.ai_agent_events(status) WHERE status = 'pending';
CREATE INDEX idx_ai_agent_events_type ON public.ai_agent_events(event_type);
CREATE INDEX idx_ai_agent_context_company ON public.ai_agent_context(company_id);
CREATE INDEX idx_ai_agent_context_customer ON public.ai_agent_context(customer_phone, customer_email);
CREATE INDEX idx_ai_agent_logs_company ON public.ai_agent_logs(company_id);
CREATE INDEX idx_ai_agent_logs_agent ON public.ai_agent_logs(agent_type);

-- Enable RLS
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agent_configs
CREATE POLICY "Company admins can manage their agent configs"
  ON public.ai_agent_configs FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Platform admins can view all agent configs"
  ON public.ai_agent_configs FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

-- RLS Policies for ai_agent_events
CREATE POLICY "Company admins can view their agent events"
  ON public.ai_agent_events FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Platform admins can view all agent events"
  ON public.ai_agent_events FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

-- RLS Policies for ai_agent_context
CREATE POLICY "Company admins can manage their agent context"
  ON public.ai_agent_context FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Platform admins can view all agent context"
  ON public.ai_agent_context FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

-- RLS Policies for ai_agent_logs
CREATE POLICY "Company admins can view their agent logs"
  ON public.ai_agent_logs FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Platform admins can view all agent logs"
  ON public.ai_agent_logs FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

-- Enable realtime for agent events (event bus)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_events;

-- Trigger to update updated_at
CREATE TRIGGER update_ai_agent_configs_updated_at
  BEFORE UPDATE ON public.ai_agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_context_updated_at
  BEFORE UPDATE ON public.ai_agent_context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();