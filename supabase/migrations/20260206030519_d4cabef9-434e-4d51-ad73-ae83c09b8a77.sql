-- Create subscription usage tracking table
CREATE TABLE public.subscription_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  ai_requests INTEGER DEFAULT 0,
  voice_minutes INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, month_year)
);

-- Create agent performance metrics table
CREATE TABLE public.agent_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  date DATE NOT NULL,
  requests_handled INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  handoff_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_type, date)
);

-- Enable RLS on both tables
ALTER TABLE public.subscription_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_usage_tracking
CREATE POLICY "Users can view their company usage" 
ON public.subscription_usage_tracking 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Service role can manage usage" 
ON public.subscription_usage_tracking 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS policies for agent_performance_metrics
CREATE POLICY "Users can view their company metrics" 
ON public.agent_performance_metrics 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Service role can manage metrics" 
ON public.agent_performance_metrics 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_usage_tracking_company_month ON public.subscription_usage_tracking(company_id, month_year);
CREATE INDEX idx_agent_metrics_company_date ON public.agent_performance_metrics(company_id, date);
CREATE INDEX idx_agent_metrics_agent_type ON public.agent_performance_metrics(agent_type);