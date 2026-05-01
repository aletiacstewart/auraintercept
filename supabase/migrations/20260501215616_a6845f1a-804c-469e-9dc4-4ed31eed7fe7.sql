REVOKE EXECUTE ON FUNCTION public.search_intake_data(text, int) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.search_intake_data(text, int) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_lead_intake_data(text, int) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.search_lead_intake_data(text, int) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.seed_industry_pack_kb_for_company(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.seed_industry_pack_kb_for_company(uuid) TO authenticated;
