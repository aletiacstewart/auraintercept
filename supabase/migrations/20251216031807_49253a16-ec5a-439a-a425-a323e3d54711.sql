-- Add sort_order column to services table for drag-and-drop reordering
ALTER TABLE public.services
ADD COLUMN sort_order integer DEFAULT 0;