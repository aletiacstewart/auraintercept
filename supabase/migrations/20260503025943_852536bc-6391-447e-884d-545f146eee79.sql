
INSERT INTO public.industry_blueprints (slug, name, operating_model, primary_records, default_consoles, default_kpis, agent_actions, prompt_overrides, restrictions, is_active)
VALUES (
  'other',
  'Other / Custom',
  'custom',
  '["records"]'::jsonb,
  '["business_mgmt","analytics","communications"]'::jsonb,
  '["records_today","messages_today","revenue_mtd"]'::jsonb,
  '{}'::jsonb,
  '{"tone":"Adapt to the customer business description provided in industry_config.description."}'::jsonb,
  '{}'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operating_model = EXCLUDED.operating_model,
  default_consoles = EXCLUDED.default_consoles,
  default_kpis = EXCLUDED.default_kpis,
  is_active = true;
