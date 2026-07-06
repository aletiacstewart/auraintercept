DROP POLICY IF EXISTS "Users can update their own notifications" ON public.staff_notifications;

CREATE POLICY "Users can update their own notifications"
ON public.staff_notifications
FOR UPDATE
TO authenticated
USING (
  recipient_id = auth.uid()
  OR (
    recipient_role = 'all'
    AND company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
)
WITH CHECK (
  recipient_id = auth.uid()
  OR (
    recipient_role = 'all'
    AND company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload issue screenshots" ON storage.objects;

CREATE POLICY "Authenticated users can upload issue screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-screenshots'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);