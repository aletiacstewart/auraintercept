-- Create a secure function for token-based appointment lookup (to be called from edge functions)
-- Cast the text parameter to uuid for proper comparison
CREATE OR REPLACE FUNCTION public.get_appointment_by_token(p_token uuid)
RETURNS SETOF appointments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM appointments
  WHERE customer_token = p_token
    AND updated_at > (now() - interval '90 days')
    AND (
      status NOT IN ('completed', 'cancelled', 'no_show')
      OR datetime > (now() - interval '7 days')
    );
$$;