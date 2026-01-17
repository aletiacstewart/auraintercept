-- Create storage bucket for smart website images
INSERT INTO storage.buckets (id, name, public)
VALUES ('smart-website-images', 'smart-website-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Companies can upload smart website images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for smart website images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can update smart website images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can delete smart website images" ON storage.objects;

-- Allow authenticated users to upload images
CREATE POLICY "Companies can upload smart website images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'smart-website-images');

-- Allow public read access
CREATE POLICY "Public read access for smart website images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'smart-website-images');

-- Allow authenticated users to update their images
CREATE POLICY "Companies can update smart website images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'smart-website-images');

-- Allow authenticated users to delete their images
CREATE POLICY "Companies can delete smart website images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'smart-website-images');