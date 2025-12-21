-- Allow anyone to view active services (for customer portal)
CREATE POLICY "Anyone can view active services"
ON public.services
FOR SELECT
USING (is_active = true);