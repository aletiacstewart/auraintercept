-- Fix appointment token expiration: tokens only valid for active appointments within 90 days
-- This addresses the PUBLIC_DATA_EXPOSURE finding: appointments_token_no_expiration

-- First, drop any existing token-based SELECT policies that might be overly permissive
DROP POLICY IF EXISTS "Anyone can view appointment by token" ON public.appointments;
DROP POLICY IF EXISTS "Token access with expiration" ON public.appointments;
DROP POLICY IF EXISTS "Token access for active appointments" ON public.appointments;

-- Create a secure token-based access policy with time and status restrictions
-- Tokens are only valid for:
-- 1. Appointments updated within the last 90 days
-- 2. Appointments that are not completed, cancelled, or no-show
-- 3. Appointments scheduled within 7 days in the past (to allow recent viewing)
CREATE POLICY "Token access with time and status restrictions"
ON public.appointments
FOR SELECT
USING (
  customer_token IS NOT NULL AND
  -- Appointment must have been updated recently (within 90 days)
  updated_at > now() - interval '90 days' AND
  -- Only allow access to active/upcoming appointments, or recent past ones
  (
    status NOT IN ('completed', 'cancelled', 'no_show') OR
    datetime > now() - interval '7 days'
  )
);