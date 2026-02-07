-- Add delivery_type column to services table
-- Values: 'in_person_customer' (at customer location), 'in_person_business' (at business location), 'virtual' (online/phone)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'in_person_customer';

-- Add a comment for clarity
COMMENT ON COLUMN public.services.delivery_type IS 'Service delivery location: in_person_customer (at customer home/location), in_person_business (at business location), virtual (online/phone/video call)';