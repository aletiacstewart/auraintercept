
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS supported_modules jsonb;

COMMENT ON COLUMN public.companies.supported_modules IS
  'Resolved workspace cache: { active_consoles, active_agents, kpis, restrictions }. Written by sync-company-workspace edge function on industry/plan change.';
