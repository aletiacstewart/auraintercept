-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- Allow authenticated users to upload logos for their company
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);

-- Allow anyone to view company logos (public bucket)
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Allow users to update their company logos
CREATE POLICY "Users can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);

-- Allow users to delete their company logos
CREATE POLICY "Users can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);