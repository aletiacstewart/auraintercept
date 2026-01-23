-- Add chat widget title column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS chat_widget_title TEXT DEFAULT 'AI Assistant';

-- Add chat widget subtitle column for future customization
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS chat_widget_subtitle TEXT DEFAULT 'Always available to help';