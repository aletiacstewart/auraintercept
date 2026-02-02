-- Allow public read access to console feature visibility settings
-- This is needed so the embedded chat widget can fetch these settings
CREATE POLICY "Public can read console visibility settings"
ON smart_websites
FOR SELECT
USING (true);