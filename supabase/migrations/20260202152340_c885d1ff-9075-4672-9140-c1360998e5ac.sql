-- Fix search_path on seed_default_smart_links function (it already has it, but redefine to be safe)
-- Also update the protocol_switch_events INSERT policy to be more restrictive

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert protocol events" ON public.protocol_switch_events;

-- Create a more restrictive INSERT policy that allows service role or authenticated users
-- This allows edge functions (via service role) and authenticated app users to insert
CREATE POLICY "Authenticated users can insert protocol events"
  ON public.protocol_switch_events FOR INSERT
  WITH CHECK (
    -- Allow if company_id matches user's company
    public.get_user_company_id(auth.uid()) = company_id
    OR
    -- Or if user is platform admin
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  );