
-- 1. smart_websites: restrict SELECT to admins only (hides dns_verification_code from employees)
DROP POLICY IF EXISTS "Company members can view their smart website" ON public.smart_websites;

CREATE POLICY "Company admins can view their smart website"
ON public.smart_websites
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'platform_admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role)
      AND get_user_company_id(auth.uid()) = company_id)
);

-- 2. Storage: job-photos INSERT — add company path scoping
DROP POLICY IF EXISTS "Authenticated users can upload job photos" ON storage.objects;
CREATE POLICY "Company members can upload job photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);

-- 3. Storage: content-images INSERT/DELETE — add company path scoping
DROP POLICY IF EXISTS "Authenticated users can upload content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete content images" ON storage.objects;
CREATE POLICY "Company members can upload content images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);
CREATE POLICY "Company members can delete content images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (
    has_role(auth.uid(), 'platform_admin'::app_role)
    OR (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
  )
);

-- 4. Storage: smart-website-images INSERT/UPDATE/DELETE — company path scoping
DROP POLICY IF EXISTS "Companies can upload smart website images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can update smart website images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can delete smart website images" ON storage.objects;
CREATE POLICY "Company members can upload smart website images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'smart-website-images'
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);
CREATE POLICY "Company members can update smart website images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'smart-website-images'
  AND (
    has_role(auth.uid(), 'platform_admin'::app_role)
    OR (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
  )
);
CREATE POLICY "Company members can delete smart website images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'smart-website-images'
  AND (
    has_role(auth.uid(), 'platform_admin'::app_role)
    OR (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
  )
);
