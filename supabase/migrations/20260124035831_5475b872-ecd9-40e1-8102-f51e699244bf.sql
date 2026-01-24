-- Fix the overly permissive INSERT policy on staff_notifications
-- Drop the existing policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.staff_notifications;

-- Create a more restrictive policy that allows inserts only for company members
CREATE POLICY "Company members can insert notifications"
  ON public.staff_notifications FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );