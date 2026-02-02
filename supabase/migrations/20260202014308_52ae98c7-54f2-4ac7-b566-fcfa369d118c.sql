-- Add show_blog column to smart_websites table
ALTER TABLE public.smart_websites 
ADD COLUMN IF NOT EXISTS show_blog boolean DEFAULT false;