
-- 1. Add columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS operating_model text,
  ADD COLUMN IF NOT EXISTS industry_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS supported_modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS secondary_industries text[] NOT NULL DEFAULT '{}'::text[];

-- 2. Industry blueprints table
CREATE TABLE IF NOT EXISTS public.industry_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  operating_model text NOT NULL,
  primary_records jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_agents jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_consoles jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_kpis jsonb NOT NULL DEFAULT '[]'::jsonb,
  agent_actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  restrictions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.industry_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Industry blueprints readable by all" ON public.industry_blueprints;
CREATE POLICY "Industry blueprints readable by all"
  ON public.industry_blueprints FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform admins manage blueprints" ON public.industry_blueprints;
CREATE POLICY "Platform admins manage blueprints"
  ON public.industry_blueprints FOR ALL
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_industry_blueprints_updated ON public.industry_blueprints;
CREATE TRIGGER trg_industry_blueprints_updated
  BEFORE UPDATE ON public.industry_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed 18 blueprints
INSERT INTO public.industry_blueprints (slug, name, operating_model, primary_records, default_consoles, default_kpis, agent_actions, prompt_overrides, restrictions) VALUES
  ('hvac','HVAC','field_dispatch','["service_calls","equipment","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","avg_response_min","first_time_fix_pct","revenue_today"]','{"customer_journey":["book_service_call","dispatch_emergency","quote_repair"]}','{"terminology":{"job":"service call","tech":"technician"}}','{}'),
  ('plumbing','Plumbing','field_dispatch','["service_calls","equipment","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","avg_response_min","emergency_calls","revenue_today"]','{"customer_journey":["book_service_call","dispatch_emergency","quote_repair"]}','{"terminology":{"job":"service call"}}','{}'),
  ('electrical','Electrical','field_dispatch','["service_calls","permits","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","permits_open","revenue_today"]','{"customer_journey":["book_service_call","quote_repair"]}','{}','{}'),
  ('roofing','Roofing','field_dispatch','["projects","estimates","crews"]','["field_dispatch","business_mgmt","marketing","analytics"]','["estimates_open","jobs_active","revenue_mtd"]','{"customer_journey":["schedule_estimate","quote_project"]}','{"terminology":{"job":"project","tech":"crew"}}','{}'),
  ('solar','Solar','pipeline_sales','["leads","proposals","installs"]','["pipeline","business_mgmt","marketing","analytics"]','["leads_new","proposals_sent","installs_scheduled"]','{"customer_journey":["qualify_lead","schedule_consult","send_proposal"]}','{}','{}'),
  ('landscape','Landscaping','field_dispatch','["service_calls","routes","crews"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","route_efficiency","revenue_today"]','{"customer_journey":["book_service_call","quote_recurring"]}','{}','{}'),
  ('pool_spa','Pool & Spa','field_dispatch','["service_calls","equipment","chemicals"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","recurring_active","revenue_today"]','{"customer_journey":["book_service_call","quote_repair"]}','{}','{}'),
  ('pest_control','Pest Control','field_dispatch','["service_calls","contracts","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","contracts_active","revenue_today"]','{"customer_journey":["book_service_call","quote_treatment"]}','{}','{}'),
  ('appliance_repair','Appliance Repair','field_dispatch','["service_calls","parts","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","first_time_fix_pct","parts_pending"]','{"customer_journey":["book_service_call","quote_repair"]}','{}','{}'),
  ('handyman','Handyman','field_dispatch','["service_calls","quotes","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["jobs_today","quotes_pending","revenue_today"]','{"customer_journey":["book_service_call","quote_repair"]}','{}','{}'),
  ('construction','Construction','field_dispatch','["projects","subcontractors","permits"]','["field_dispatch","business_mgmt","marketing","analytics"]','["projects_active","permits_open","revenue_mtd"]','{"customer_journey":["schedule_estimate","quote_project"]}','{"terminology":{"job":"project"}}','{}'),
  ('auto_care','Auto Care','appointment_booking','["appointments","vehicles","bays"]','["appointments","business_mgmt","marketing","analytics"]','["bays_in_use","appts_today","revenue_today"]','{"customer_journey":["book_appointment","quote_service"]}','{"terminology":{"resource":"bay"}}','{}'),
  ('security_systems','Security Systems','field_dispatch','["installs","monitoring","technicians"]','["field_dispatch","business_mgmt","marketing","analytics"]','["installs_today","monitoring_active","revenue_mtd"]','{"customer_journey":["schedule_install","quote_system"]}','{}','{}'),
  ('real_estate','Real Estate','pipeline_sales','["leads","listings","showings"]','["pipeline","business_mgmt","marketing","analytics"]','["leads_new","showings_week","listings_active"]','{"customer_journey":["schedule_showing","send_listing","request_preapproval"]}','{"terminology":{"job":"showing","customer":"client"}}','{}'),
  ('beauty_wellness','Beauty & Wellness','appointment_booking','["appointments","stylists","chairs"]','["appointments","business_mgmt","marketing","analytics"]','["chairs_in_use","appts_today","rebooking_pct"]','{"customer_journey":["book_appointment","upsell_service"]}','{"terminology":{"resource":"chair","tech":"stylist"}}','{}'),
  ('restaurants','Restaurants','receptionist_only','["calls","messages","smart_links"]','["receptionist","marketing","analytics"]','["calls_today","msgs_today","link_clicks"]','{"customer_journey":["send_smart_link","take_message"]}','{"scripts":{"booking":"We do not take reservations directly — I will text you the link to book on our website."}}','{"booking":false,"dispatch":false,"integrations":["receptionist","smart_links"]}'),
  ('personal_assistant','Personal Assistant','appointment_booking','["appointments","tasks","clients"]','["appointments","business_mgmt","analytics"]','["appts_today","tasks_open","revenue_mtd"]','{"customer_journey":["book_appointment","take_message"]}','{}','{}'),
  ('fencing','Fencing','field_dispatch','["estimates","projects","crews"]','["field_dispatch","business_mgmt","marketing","analytics"]','["estimates_open","projects_active","revenue_mtd"]','{"customer_journey":["schedule_estimate","quote_project"]}','{}','{}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operating_model = EXCLUDED.operating_model,
  primary_records = EXCLUDED.primary_records,
  default_consoles = EXCLUDED.default_consoles,
  default_kpis = EXCLUDED.default_kpis,
  agent_actions = EXCLUDED.agent_actions,
  prompt_overrides = EXCLUDED.prompt_overrides,
  restrictions = EXCLUDED.restrictions,
  updated_at = now();

-- 4. Backfill operating_model on existing companies
UPDATE public.companies c
SET operating_model = b.operating_model
FROM public.industry_blueprints b
WHERE c.industry_vertical = b.slug
  AND (c.operating_model IS NULL OR c.operating_model = '');

-- Default any remaining to field_dispatch
UPDATE public.companies
SET operating_model = 'field_dispatch'
WHERE operating_model IS NULL OR operating_model = '';
