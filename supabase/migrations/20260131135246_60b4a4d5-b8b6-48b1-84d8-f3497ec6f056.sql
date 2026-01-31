-- Add content_topics column to company_ai_content_profiles table
ALTER TABLE public.company_ai_content_profiles 
ADD COLUMN content_topics text[] DEFAULT ARRAY[]::text[];

-- Add a comment explaining the column
COMMENT ON COLUMN public.company_ai_content_profiles.content_topics IS 'Array of content themes/topics for AI content generation (e.g., Home maintenance tips, Customer success stories)';