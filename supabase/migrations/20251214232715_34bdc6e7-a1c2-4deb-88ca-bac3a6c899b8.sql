-- Add call_opt_out column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN call_opt_out boolean NOT NULL DEFAULT false;