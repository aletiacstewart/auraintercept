
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS missed_call_sms_template text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS missed_call_callback_script text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reminder_call_script text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS followup_call_script text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS default_outbound_script text;
