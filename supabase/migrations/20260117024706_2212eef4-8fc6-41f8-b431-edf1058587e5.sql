-- Create site_chat_logs table for detailed interaction logging
CREATE TABLE IF NOT EXISTS public.site_chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.smart_websites(id) ON DELETE CASCADE,
  visitor_fingerprint TEXT,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat_opened', 'message_sent', 'voice_started', 'voice_ended')),
  message_role TEXT CHECK (message_role IN ('user', 'assistant')),
  message_preview TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_site_chat_logs_website_id ON public.site_chat_logs(website_id);
CREATE INDEX IF NOT EXISTS idx_site_chat_logs_created_at ON public.site_chat_logs(created_at);

-- Enable RLS
ALTER TABLE public.site_chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for site_chat_logs (using correct column 'id' instead of 'user_id')
CREATE POLICY "Companies can view their website chat logs"
ON public.site_chat_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.smart_websites sw
    JOIN public.companies c ON sw.company_id = c.id
    WHERE sw.id = site_chat_logs.website_id
    AND c.id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Allow anonymous inserts for visitor tracking (public website)
CREATE POLICY "Allow anonymous chat log inserts"
ON public.site_chat_logs
FOR INSERT
WITH CHECK (true);

-- Add show_voice_widget column to smart_websites if not exists
ALTER TABLE public.smart_websites
ADD COLUMN IF NOT EXISTS show_voice_widget BOOLEAN NOT NULL DEFAULT false;