-- Create storage bucket for issue screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-screenshots', 'issue-screenshots', true);

-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload issue screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'issue-screenshots');

-- Allow public read access to screenshots (for platform admins viewing issues)
CREATE POLICY "Anyone can view issue screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-screenshots');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own issue screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'issue-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);