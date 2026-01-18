-- Add email toggle and template columns to reminder_settings
ALTER TABLE public.reminder_settings
ADD COLUMN email_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN email_template TEXT;