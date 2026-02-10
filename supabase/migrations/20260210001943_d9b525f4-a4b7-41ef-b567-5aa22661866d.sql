
-- Add delivery_type and meeting_link columns to appointments table
ALTER TABLE public.appointments 
  ADD COLUMN delivery_type text NOT NULL DEFAULT 'in_person_customer',
  ADD COLUMN meeting_link text;

-- Add comment for documentation
COMMENT ON COLUMN public.appointments.delivery_type IS 'Type of service delivery: virtual, in_person_business, in_person_customer';
COMMENT ON COLUMN public.appointments.meeting_link IS 'Google Meet or other video conference link for virtual appointments';
