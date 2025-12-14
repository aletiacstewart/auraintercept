-- Add notification preference columns to appointments
ALTER TABLE public.appointments
ADD COLUMN sms_opt_out BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN email_opt_out BOOLEAN NOT NULL DEFAULT false;