-- Smart Websites table - Core website configuration
CREATE TABLE public.smart_websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  subdomain TEXT UNIQUE,
  custom_domain TEXT,
  domain_verified BOOLEAN NOT NULL DEFAULT false,
  dns_verification_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  hero_headline TEXT,
  hero_subheadline TEXT,
  cta_button_text TEXT NOT NULL DEFAULT 'Book Now',
  cta_button_url TEXT,
  show_services BOOLEAN NOT NULL DEFAULT true,
  show_hours BOOLEAN NOT NULL DEFAULT true,
  show_contact BOOLEAN NOT NULL DEFAULT true,
  show_chat_widget BOOLEAN NOT NULL DEFAULT true,
  background_style TEXT NOT NULL DEFAULT 'gradient',
  background_image_url TEXT,
  monthly_visitor_limit INTEGER NOT NULL DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_website UNIQUE (company_id)
);

-- Site Metrics table - Monthly visitor analytics
CREATE TABLE public.site_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.smart_websites(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  chat_interactions INTEGER NOT NULL DEFAULT 0,
  booking_clicks INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_website_month UNIQUE (website_id, month_year)
);

-- Site Visitor Logs table - Individual visit tracking
CREATE TABLE public.site_visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.smart_websites(id) ON DELETE CASCADE,
  visitor_fingerprint TEXT,
  page_path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  user_agent TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.smart_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visitor_logs ENABLE ROW LEVEL SECURITY;

-- Smart Websites RLS Policies
CREATE POLICY "Platform admins can view all smart websites"
  ON public.smart_websites FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company members can view their smart website"
  ON public.smart_websites FOR SELECT
  USING (public.get_user_company_id(auth.uid()) = company_id);

CREATE POLICY "Company admins can manage their smart website"
  ON public.smart_websites FOR ALL
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role) OR
    (public.has_role(auth.uid(), 'company_admin'::public.app_role) AND public.get_user_company_id(auth.uid()) = company_id)
  );

-- Site Metrics RLS Policies
CREATE POLICY "Company members can view their site metrics"
  ON public.site_metrics FOR SELECT
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role) OR
    public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "System can insert site metrics"
  ON public.site_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update site metrics"
  ON public.site_metrics FOR UPDATE
  USING (true);

-- Site Visitor Logs RLS Policies
CREATE POLICY "Anyone can insert visitor logs"
  ON public.site_visitor_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Company members can view their visitor logs"
  ON public.site_visitor_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.smart_websites sw
      WHERE sw.id = website_id
      AND (
        public.has_role(auth.uid(), 'platform_admin'::public.app_role) OR
        public.get_user_company_id(auth.uid()) = sw.company_id
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_smart_websites_company_id ON public.smart_websites(company_id);
CREATE INDEX idx_smart_websites_subdomain ON public.smart_websites(subdomain);
CREATE INDEX idx_smart_websites_custom_domain ON public.smart_websites(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_site_metrics_website_month ON public.site_metrics(website_id, month_year);
CREATE INDEX idx_site_visitor_logs_website_id ON public.site_visitor_logs(website_id);
CREATE INDEX idx_site_visitor_logs_visited_at ON public.site_visitor_logs(visited_at);

-- Update trigger for smart_websites
CREATE TRIGGER update_smart_websites_updated_at
  BEFORE UPDATE ON public.smart_websites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for site_metrics
CREATE TRIGGER update_site_metrics_updated_at
  BEFORE UPDATE ON public.site_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();