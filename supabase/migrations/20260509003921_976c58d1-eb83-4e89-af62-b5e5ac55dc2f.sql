
REVOKE EXECUTE ON FUNCTION public.increment_email_usage(uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_email_usage(uuid, integer, integer) TO authenticated, service_role;
