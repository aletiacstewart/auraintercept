
-- 1) crm_connections: require company_admin (or platform_admin) for SELECT so technicians/employees cannot read credentials
DROP POLICY IF EXISTS "company members read own crm connections" ON public.crm_connections;
CREATE POLICY "company admins read own crm connections"
  ON public.crm_connections
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (
      company_id = public.get_user_company_id(auth.uid())
      AND (
        public.has_role(auth.uid(), 'company_admin'::public.app_role)
        OR public.has_company_full_access(auth.uid())
      )
    )
  );

-- 2) site_chat_logs: drop public INSERT; now goes through the log-site-event edge function (service_role)
DROP POLICY IF EXISTS "Validated inserts for chat logs" ON public.site_chat_logs;

-- 3) site_metrics: drop public INSERT; metrics are created by the increment_site_metric SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Validated inserts for site metrics" ON public.site_metrics;

-- 4) site_visitor_logs: drop public INSERT; visitor analytics will be written by a server-side path only
DROP POLICY IF EXISTS "Validated inserts for visitor logs" ON public.site_visitor_logs;

-- 5) staff_notifications: prevent any signed-in user from injecting platform_admin notifications
DROP POLICY IF EXISTS "Company members or system can insert notifications" ON public.staff_notifications;
CREATE POLICY "Company members or admins can insert notifications"
  ON public.staff_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      recipient_role <> 'platform_admin'
      AND company_id IN (
        SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
      )
    )
    OR (
      recipient_role = 'platform_admin'
      AND public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    )
  );
