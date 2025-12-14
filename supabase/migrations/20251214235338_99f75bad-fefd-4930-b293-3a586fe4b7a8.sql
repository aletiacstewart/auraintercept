-- Add weekly digest settings to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS weekly_digest_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS weekly_digest_email text,
ADD COLUMN IF NOT EXISTS weekly_digest_day integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_weekly_digest_at timestamp with time zone;