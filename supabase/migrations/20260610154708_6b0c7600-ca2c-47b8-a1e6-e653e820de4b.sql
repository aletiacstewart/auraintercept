
CREATE POLICY "lead-imports company insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lead-imports'
    AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  );
CREATE POLICY "lead-imports company select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lead-imports'
    AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  );
CREATE POLICY "lead-imports company delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lead-imports'
    AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  );
