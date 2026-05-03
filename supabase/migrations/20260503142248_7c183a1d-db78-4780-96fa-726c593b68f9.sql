
INSERT INTO public.industry_blueprints (slug, name, operating_model, primary_records, default_agents, default_consoles, default_kpis, agent_actions, prompt_overrides, restrictions)
VALUES
  ('dental', 'Dental Practice', 'appointment_booking',
    '["patient","appointment","insurance_verification"]'::jsonb,
    '["customer_journey","admin","outreach","analytics_intelligence"]'::jsonb,
    '["appointments","patients","insurance"]'::jsonb,
    '["schedule_fill","no_show_rate","case_acceptance","recall_effectiveness","todays_production"]'::jsonb,
    '{"customer_journey":["book_appointment","reschedule","cancel","confirm_appointment","send_recall","verify_insurance","triage_emergency","answer_faq"]}'::jsonb,
    '{"intro":"Hi, I''m Aura, an AI receptionist. I''m not a licensed dentist — I can help with appointments and insurance, and I''ll connect you with the team for clinical questions."}'::jsonb,
    '{"hipaa":true,"no_clinical_advice":true,"no_medications":true,"no_records":true}'::jsonb),
  ('chiropractic', 'Chiropractic Office', 'appointment_booking',
    '["patient","appointment","insurance_verification"]'::jsonb,
    '["customer_journey","admin","outreach","analytics_intelligence"]'::jsonb,
    '["appointments","patients","insurance"]'::jsonb,
    '["schedule_fill","no_show_rate","care_plan_adherence","recall_effectiveness"]'::jsonb,
    '{"customer_journey":["book_appointment","reschedule","cancel","confirm_appointment","send_recall","verify_insurance","triage_emergency","answer_faq"]}'::jsonb,
    '{"intro":"Hi, I''m Aura, an AI receptionist. I''m not a licensed chiropractor — I can help with appointments and insurance, and I''ll connect you with the team for clinical questions."}'::jsonb,
    '{"hipaa":true,"no_clinical_advice":true,"no_medications":true,"no_records":true}'::jsonb),
  ('medical_office', 'General Medical Office', 'appointment_booking',
    '["patient","appointment","insurance_verification"]'::jsonb,
    '["customer_journey","admin","outreach","analytics_intelligence"]'::jsonb,
    '["appointments","patients","insurance"]'::jsonb,
    '["schedule_fill","no_show_rate","recall_effectiveness","pre_appointment_pct"]'::jsonb,
    '{"customer_journey":["book_appointment","reschedule","cancel","confirm_appointment","send_recall","verify_insurance","triage_emergency","answer_faq"]}'::jsonb,
    '{"intro":"Hi, I''m Aura, an AI receptionist. I''m not a licensed clinician — I can help with appointments and insurance, and I''ll connect you with the team for clinical questions."}'::jsonb,
    '{"hipaa":true,"no_clinical_advice":true,"no_medications":true,"no_records":true}'::jsonb),
  ('veterinary', 'Veterinary Clinic', 'appointment_booking',
    '["pet_owner","pet","appointment","insurance_verification"]'::jsonb,
    '["customer_journey","admin","outreach","analytics_intelligence"]'::jsonb,
    '["appointments","pet_owners","insurance"]'::jsonb,
    '["schedule_fill","no_show_rate","recall_effectiveness","wellness_plan_adoption"]'::jsonb,
    '{"customer_journey":["book_appointment","reschedule","cancel","confirm_appointment","send_recall","verify_insurance","triage_emergency","answer_faq"]}'::jsonb,
    '{"intro":"Hi, I''m Aura, a virtual receptionist. I''m not a licensed veterinarian — I can help with appointments and pet insurance, and I''ll connect you with the team for medical questions."}'::jsonb,
    '{"hipaa":false,"no_clinical_advice":true,"no_medications":true,"no_records":true}'::jsonb),
  ('physical_therapy', 'Physical Therapy', 'appointment_booking',
    '["patient","appointment","insurance_verification"]'::jsonb,
    '["customer_journey","admin","outreach","analytics_intelligence"]'::jsonb,
    '["appointments","patients","insurance"]'::jsonb,
    '["schedule_fill","no_show_rate","plan_of_care_adherence","recall_effectiveness"]'::jsonb,
    '{"customer_journey":["book_appointment","reschedule","cancel","confirm_appointment","send_recall","verify_insurance","triage_emergency","answer_faq"]}'::jsonb,
    '{"intro":"Hi, I''m Aura, an AI receptionist. I''m not a licensed therapist — I can help with appointments and insurance, and I''ll connect you with the team for clinical questions."}'::jsonb,
    '{"hipaa":true,"no_clinical_advice":true,"no_medications":true,"no_records":true}'::jsonb),
  ('optometry', 'Optometry Practice', 'appointment_booking',
    '["patient","appointment","insurance_verification"]'::jsonb,
    '["customer_journey","admin","outreach","analytics_intelligence"]'::jsonb,
    '["appointments","patients","insurance"]'::jsonb,
    '["schedule_fill","no_show_rate","recall_effectiveness","frame_attach_rate"]'::jsonb,
    '{"customer_journey":["book_appointment","reschedule","cancel","confirm_appointment","send_recall","verify_insurance","triage_emergency","answer_faq"]}'::jsonb,
    '{"intro":"Hi, I''m Aura, an AI receptionist. I''m not a licensed optometrist — I can help with appointments and insurance, and I''ll connect you with the team for clinical questions."}'::jsonb,
    '{"hipaa":true,"no_clinical_advice":true,"no_medications":true,"no_records":true}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operating_model = EXCLUDED.operating_model,
  primary_records = EXCLUDED.primary_records,
  default_agents = EXCLUDED.default_agents,
  default_consoles = EXCLUDED.default_consoles,
  default_kpis = EXCLUDED.default_kpis,
  agent_actions = EXCLUDED.agent_actions,
  prompt_overrides = EXCLUDED.prompt_overrides,
  restrictions = EXCLUDED.restrictions,
  updated_at = now();

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS healthcare_compliance boolean NOT NULL DEFAULT false;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS pets jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS pet_id text;

CREATE OR REPLACE FUNCTION public.fn_auto_set_healthcare_compliance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.industry_vertical IN ('dental','chiropractic','medical_office','physical_therapy','optometry') THEN
    NEW.healthcare_compliance := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_set_healthcare_compliance ON public.companies;
CREATE TRIGGER trg_auto_set_healthcare_compliance
  BEFORE INSERT OR UPDATE OF industry_vertical ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_set_healthcare_compliance();

CREATE TABLE IF NOT EXISTS public.insurance_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  carrier text,
  member_id text,
  group_number text,
  policyholder_name text,
  policyholder_dob date,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ivr_company ON public.insurance_verification_requests(company_id, status);

ALTER TABLE public.insurance_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ivr_company_read" ON public.insurance_verification_requests;
CREATE POLICY "ivr_company_read" ON public.insurance_verification_requests
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "ivr_company_write" ON public.insurance_verification_requests;
CREATE POLICY "ivr_company_write" ON public.insurance_verification_requests
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP TRIGGER IF EXISTS trg_ivr_updated ON public.insurance_verification_requests;
CREATE TRIGGER trg_ivr_updated
  BEFORE UPDATE ON public.insurance_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.company_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider_key)
);

ALTER TABLE public.company_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ci_company_read" ON public.company_integrations;
CREATE POLICY "ci_company_read" ON public.company_integrations
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "ci_company_write" ON public.company_integrations;
CREATE POLICY "ci_company_write" ON public.company_integrations
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP TRIGGER IF EXISTS trg_ci_updated ON public.company_integrations;
CREATE TRIGGER trg_ci_updated
  BEFORE UPDATE ON public.company_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
