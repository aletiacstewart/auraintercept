-- Create storage bucket for generated content images
INSERT INTO storage.buckets (id, name, public) VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload content images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-images' AND auth.role() = 'authenticated');

-- Allow public read
CREATE POLICY "Content images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete content images"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-images' AND auth.role() = 'authenticated');