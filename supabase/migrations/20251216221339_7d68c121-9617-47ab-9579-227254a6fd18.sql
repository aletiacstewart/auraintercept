-- Add customer_address column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN customer_address text;