-- Add parts_used column for tracking parts used on the job
ALTER TABLE public.job_assignments 
ADD COLUMN IF NOT EXISTS parts_used text;