
CREATE TABLE public.marketing_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  page_path text,
  industry text,
  tier text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_funnel_events_event_type_check CHECK (
    event_type IN (
      'page_view',
      'chat_opened',
      'chat_message_sent',
      'pricing_viewed',
      'pricing_expanded',
      'demo_cta_clicked',
      'auth_started',
      'signup_completed',
      'checkout_completed'
    )
  )
);

GRANT INSERT ON public.marketing_funnel_events TO anon, authenticated;
GRANT SELECT ON public.marketing_funnel_events TO authenticated;
GRANT ALL ON public.marketing_funnel_events TO service_role;

ALTER TABLE public.marketing_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
  ON public.marketing_funnel_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform admins can view funnel events"
  ON public.marketing_funnel_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE INDEX idx_marketing_funnel_events_session_id ON public.marketing_funnel_events(session_id);
CREATE INDEX idx_marketing_funnel_events_event_type ON public.marketing_funnel_events(event_type);
CREATE INDEX idx_marketing_funnel_events_created_at ON public.marketing_funnel_events(created_at DESC);
