-- Add category column to services table for organizing services by type/department
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category text;