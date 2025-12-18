-- Allow platform admins to delete companies
CREATE POLICY "Platform admins can delete companies"
ON public.companies
FOR DELETE
USING (has_role(auth.uid(), 'platform_admin'::app_role));