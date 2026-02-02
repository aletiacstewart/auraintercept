-- Create smart_links table for company-specific URL mappings
CREATE TABLE public.smart_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('scheduling', 'pricing', 'reviews', 'invoicing', 'emergency', 'custom')),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  intent_triggers TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups by company
CREATE INDEX idx_smart_links_company_id ON public.smart_links(company_id);
CREATE INDEX idx_smart_links_category ON public.smart_links(company_id, category);

-- Enable RLS
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smart_links
CREATE POLICY "Users can view their company smart links"
  ON public.smart_links FOR SELECT
  USING (public.can_view_company(company_id));

CREATE POLICY "Company admins can manage smart links"
  ON public.smart_links FOR ALL
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role) OR
    (public.get_user_company_id(auth.uid()) = company_id AND public.has_company_full_access(auth.uid()))
  );

-- Create protocol_switch_events table for analytics
CREATE TABLE public.protocol_switch_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'text')),
  previous_mode TEXT DEFAULT 'normal',
  new_mode TEXT NOT NULL CHECK (new_mode IN ('emergency', 'de_escalation', 'contextual_sharing', 'normal')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'sentiment', 'manual')),
  trigger_value TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  customer_phone TEXT,
  customer_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX idx_protocol_switch_company_id ON public.protocol_switch_events(company_id);
CREATE INDEX idx_protocol_switch_created_at ON public.protocol_switch_events(created_at DESC);
CREATE INDEX idx_protocol_switch_new_mode ON public.protocol_switch_events(company_id, new_mode);

-- Enable RLS
ALTER TABLE public.protocol_switch_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for protocol_switch_events
CREATE POLICY "Users can view their company protocol events"
  ON public.protocol_switch_events FOR SELECT
  USING (public.can_view_company(company_id));

CREATE POLICY "System can insert protocol events"
  ON public.protocol_switch_events FOR INSERT
  WITH CHECK (true);

-- Add emergency/de-escalation settings to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_sms_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_notification_emails TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emergency_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS de_escalation_manager_contact TEXT,
  ADD COLUMN IF NOT EXISTS de_escalation_auto_ticket BOOLEAN DEFAULT true;

-- Create trigger for updated_at on smart_links
CREATE TRIGGER update_smart_links_updated_at
  BEFORE UPDATE ON public.smart_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to seed default smart links for new companies
CREATE OR REPLACE FUNCTION public.seed_default_smart_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert default smart link templates for new company
  INSERT INTO public.smart_links (company_id, category, name, description, url, intent_triggers, sort_order) VALUES
    (NEW.id, 'scheduling', 'Booking Link', 'Schedule an appointment', '', ARRAY['book', 'schedule', 'appointment', 'availability', 'when can'], 1),
    (NEW.id, 'pricing', 'Pricing Info', 'View pricing and estimates', '', ARRAY['how much', 'price', 'cost', 'quote', 'estimate', 'rate'], 2),
    (NEW.id, 'reviews', 'Reviews Page', 'Read customer reviews', '', ARRAY['reviews', 'ratings', 'reputation', 'good', 'recommend'], 3),
    (NEW.id, 'invoicing', 'Payment Portal', 'Pay your invoice', '', ARRAY['pay', 'invoice', 'bill', 'payment', 'balance'], 4),
    (NEW.id, 'emergency', 'Emergency Contact', 'Urgent assistance', '', ARRAY['emergency', 'urgent', 'after hours', '24/7'], 5);
  
  RETURN NEW;
END;
$$;

-- Create trigger to seed defaults on new company creation
CREATE TRIGGER seed_smart_links_for_new_company
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_smart_links();