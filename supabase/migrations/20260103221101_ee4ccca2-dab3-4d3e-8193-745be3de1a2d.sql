-- Add missed call settings to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS missed_call_action text DEFAULT 'sms_only' CHECK (missed_call_action IN ('disabled', 'sms_only', 'callback_only', 'callback_then_sms')),
ADD COLUMN IF NOT EXISTS callback_delay_seconds integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS callback_retry_count integer DEFAULT 1;

-- Create missed_call_callbacks tracking table
CREATE TABLE public.missed_call_callbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  original_call_sid text,
  customer_phone text NOT NULL,
  customer_name text,
  callback_call_sid text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'initiated', 'answered', 'no_answer', 'failed', 'customer_called_back')),
  attempt_number integer DEFAULT 1,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  initiated_at timestamptz,
  completed_at timestamptz,
  error_message text,
  sms_fallback_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.missed_call_callbacks ENABLE ROW LEVEL SECURITY;

-- RLS policies for missed_call_callbacks
CREATE POLICY "Companies can view their own missed call callbacks"
ON public.missed_call_callbacks
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Companies can insert their own missed call callbacks"
ON public.missed_call_callbacks
FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Companies can update their own missed call callbacks"
ON public.missed_call_callbacks
FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- Service role policy for edge functions
CREATE POLICY "Service role can manage all missed call callbacks"
ON public.missed_call_callbacks
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_missed_call_callbacks_company_id ON public.missed_call_callbacks(company_id);
CREATE INDEX idx_missed_call_callbacks_customer_phone ON public.missed_call_callbacks(customer_phone);
CREATE INDEX idx_missed_call_callbacks_status ON public.missed_call_callbacks(status);

-- Trigger for updated_at
CREATE TRIGGER update_missed_call_callbacks_updated_at
BEFORE UPDATE ON public.missed_call_callbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();