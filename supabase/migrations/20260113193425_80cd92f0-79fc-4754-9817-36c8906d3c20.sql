-- Create lead_activities table for tracking all interactions
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create lead_follow_ups table for scheduled follow-ups
CREATE TABLE public.lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  follow_up_type TEXT NOT NULL,
  message_template TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_factors JSONB DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS auto_follow_up_enabled BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_company_id ON public.lead_activities(company_id);
CREATE INDEX idx_lead_follow_ups_lead_id ON public.lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_scheduled ON public.lead_follow_ups(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_leads_score ON public.leads(score);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_activities
CREATE POLICY "Users can view lead activities for their company"
ON public.lead_activities FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert lead activities for their company"
ON public.lead_activities FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS policies for lead_follow_ups
CREATE POLICY "Users can view lead follow-ups for their company"
ON public.lead_follow_ups FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage lead follow-ups for their company"
ON public.lead_follow_ups FOR ALL
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Create lead scoring function
CREATE OR REPLACE FUNCTION public.calculate_lead_score()
RETURNS TRIGGER AS $$
DECLARE
  contact_score INTEGER := 0;
  intent_score INTEGER := 0;
  source_score INTEGER := 0;
  service_score INTEGER := 0;
  recency_score INTEGER := 0;
  total_score INTEGER := 0;
  v_score_factors JSONB;
  hours_since_created FLOAT;
BEGIN
  -- Contact Completeness (max 25)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN contact_score := contact_score + 10; END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN contact_score := contact_score + 10; END IF;
  IF NEW.address IS NOT NULL AND NEW.address != '' THEN contact_score := contact_score + 5; END IF;
  
  -- Intent Priority (max 20)
  CASE NEW.intent
    WHEN 'emergency' THEN intent_score := 20;
    WHEN 'quote' THEN intent_score := 15;
    WHEN 'booking' THEN intent_score := 10;
    WHEN 'inquiry' THEN intent_score := 5;
    ELSE intent_score := 3;
  END CASE;
  
  -- Source Quality (max 15)
  CASE NEW.source
    WHEN 'referral' THEN source_score := 15;
    WHEN 'voice' THEN source_score := 12;
    WHEN 'chat' THEN source_score := 10;
    WHEN 'widget' THEN source_score := 8;
    ELSE source_score := 5;
  END CASE;
  
  -- Service Interest (max 20)
  IF NEW.service_interest IS NOT NULL AND NEW.service_interest != '' THEN 
    service_score := 20; 
  END IF;
  
  -- Recency (max 20)
  hours_since_created := EXTRACT(EPOCH FROM (now() - COALESCE(NEW.created_at, now()))) / 3600;
  IF hours_since_created < 24 THEN recency_score := 20;
  ELSIF hours_since_created < 72 THEN recency_score := 15;
  ELSIF hours_since_created < 168 THEN recency_score := 10;
  ELSE recency_score := 5;
  END IF;
  
  -- Calculate total
  total_score := contact_score + intent_score + source_score + service_score + recency_score;
  
  -- Build score factors JSON
  v_score_factors := jsonb_build_object(
    'contact', contact_score,
    'intent', intent_score,
    'source', source_score,
    'service', service_score,
    'recency', recency_score
  );
  
  NEW.score := total_score;
  NEW.score_factors := v_score_factors;
  
  -- Auto-set priority based on score
  IF total_score >= 80 THEN NEW.priority := 'hot';
  ELSIF total_score >= 60 THEN NEW.priority := 'high';
  ELSIF total_score >= 40 THEN NEW.priority := 'normal';
  ELSE NEW.priority := 'low';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for lead scoring
DROP TRIGGER IF EXISTS trigger_calculate_lead_score ON public.leads;
CREATE TRIGGER trigger_calculate_lead_score
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_lead_score();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_follow_ups;