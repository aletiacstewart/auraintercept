-- Create storage bucket for temporary voice audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-audio',
  'voice-audio',
  true,
  5242880, -- 5MB limit per file
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3'];

-- Create RLS policy to allow public read access (for SignalWire playback)
CREATE POLICY "Anyone can view voice audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-audio');

-- Create RLS policy to allow service role to insert audio files
CREATE POLICY "Service role can insert voice audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-audio');

-- Create RLS policy to allow service role to delete old audio files
CREATE POLICY "Service role can delete voice audio" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'voice-audio');