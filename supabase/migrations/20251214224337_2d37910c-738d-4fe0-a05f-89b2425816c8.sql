-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Add recording_url column to call_logs
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_duration_seconds INTEGER;

-- Storage policies for call recordings
CREATE POLICY "Company admins can view their call recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'call-recordings' 
  AND EXISTS (
    SELECT 1 FROM call_logs cl
    WHERE cl.id::text = (storage.foldername(name))[1]
    AND cl.company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'company_admin'::app_role)
  )
);

CREATE POLICY "Platform admins can view all call recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'call-recordings'
  AND has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE POLICY "Service role can upload recordings"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'call-recordings');