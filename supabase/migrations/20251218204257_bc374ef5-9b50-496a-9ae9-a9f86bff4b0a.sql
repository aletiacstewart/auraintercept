-- Allow authenticated users to upload their own avatars to the avatars folder
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] IS NULL AND
  name LIKE 'avatars/' || auth.uid()::text || '.%'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  name LIKE 'avatars/' || auth.uid()::text || '.%'
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  name LIKE 'avatars/' || auth.uid()::text || '.%'
);