-- Add photo columns to job_assignments
ALTER TABLE public.job_assignments 
ADD COLUMN IF NOT EXISTS before_photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS after_photos text[] DEFAULT '{}';

-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload job photos
CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to view job photos
CREATE POLICY "Anyone can view job photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-photos');

-- Allow authenticated users to delete their job photos
CREATE POLICY "Authenticated users can delete job photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-photos' AND auth.role() = 'authenticated');