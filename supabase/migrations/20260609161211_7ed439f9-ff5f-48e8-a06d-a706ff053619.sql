
-- 1) Scope public reads on business_hours / faqs / services to published smart websites
DROP POLICY IF EXISTS "Anyone can view business hours" ON public.business_hours;
CREATE POLICY "Public can view business hours for published sites"
  ON public.business_hours FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.smart_websites sw
      WHERE sw.company_id = business_hours.company_id
        AND sw.is_published = true
    )
  );

DROP POLICY IF EXISTS "Anyone can view active FAQs" ON public.faqs;
CREATE POLICY "Public can view active FAQs for published sites"
  ON public.faqs FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.smart_websites sw
      WHERE sw.company_id = faqs.company_id
        AND sw.is_published = true
    )
  );

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Public can view active services for published sites"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.smart_websites sw
      WHERE sw.company_id = services.company_id
        AND sw.is_published = true
    )
  );

-- 2) demo_trials: drop plaintext password column
ALTER TABLE public.demo_trials DROP COLUMN IF EXISTS password;

-- 3) push_subscriptions: platform admin read visibility
DROP POLICY IF EXISTS "Platform admins can view all push subscriptions"
  ON public.push_subscriptions;
CREATE POLICY "Platform admins can view all push subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- 4) user_roles: close company_admin INSERT privilege escalation
DROP POLICY IF EXISTS "Company admins can insert employee roles for their company"
  ON public.user_roles;
CREATE POLICY "Company admins can insert employee roles for their company"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'company_admin'::app_role)
    AND role = 'employee'::app_role
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.company_id = public.get_user_company_id(auth.uid())
        AND p.company_id IS NOT NULL
    )
  );

-- 5) google_calendar_connections: block browser access to OAuth tokens
REVOKE SELECT (access_token, refresh_token, token_expires_at)
  ON public.google_calendar_connections FROM authenticated;
REVOKE INSERT (access_token, refresh_token, token_expires_at)
  ON public.google_calendar_connections FROM authenticated;
REVOKE UPDATE (access_token, refresh_token, token_expires_at)
  ON public.google_calendar_connections FROM authenticated;

-- 6) social_accounts: same for social OAuth tokens
REVOKE SELECT (access_token, refresh_token, token_expires_at)
  ON public.social_accounts FROM authenticated;
REVOKE INSERT (access_token, refresh_token, token_expires_at)
  ON public.social_accounts FROM authenticated;
REVOKE UPDATE (access_token, refresh_token, token_expires_at)
  ON public.social_accounts FROM authenticated;

-- 7) companies: block browser access to the most sensitive columns
REVOKE SELECT (stripe_customer_id, aura_sms_consent_ip, calendar_feed_token)
  ON public.companies FROM authenticated;
REVOKE UPDATE (stripe_customer_id, aura_sms_consent_ip, calendar_feed_token)
  ON public.companies FROM authenticated;

CREATE OR REPLACE FUNCTION public.company_has_stripe_connection(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id
      AND c.stripe_customer_id IS NOT NULL
      AND (
        has_role(auth.uid(), 'platform_admin'::app_role)
        OR (c.id = public.get_user_company_id(auth.uid())
            AND has_role(auth.uid(), 'company_admin'::app_role))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_company_calendar_feed_token(_company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.calendar_feed_token
  FROM public.companies c
  WHERE c.id = _company_id
    AND (
      has_role(auth.uid(), 'platform_admin'::app_role)
      OR (c.id = public.get_user_company_id(auth.uid())
          AND has_role(auth.uid(), 'company_admin'::app_role))
    );
$$;

CREATE OR REPLACE FUNCTION public.rotate_company_calendar_feed_token(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token text;
BEGIN
  IF NOT (
    has_role(auth.uid(), 'platform_admin'::app_role)
    OR (_company_id = public.get_user_company_id(auth.uid())
        AND has_role(auth.uid(), 'company_admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  new_token := encode(gen_random_bytes(24), 'hex');
  UPDATE public.companies
     SET calendar_feed_token = new_token
   WHERE id = _company_id;
  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_has_stripe_connection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_calendar_feed_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_company_calendar_feed_token(uuid) TO authenticated;
