-- Add reminder tracking columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reminder_1h_sent_at timestamp with time zone;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_pending 
ON public.appointments (datetime, status) 
WHERE status = 'scheduled' AND (reminder_24h_sent = false OR reminder_1h_sent = false);

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;