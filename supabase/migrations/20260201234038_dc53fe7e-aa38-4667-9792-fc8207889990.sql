-- Create content engine history table to track all content generation
CREATE TABLE public.content_engine_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  topic TEXT NOT NULL,
  content JSONB NOT NULL,
  saved_to TEXT,
  saved_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.content_engine_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's content history"
ON public.content_engine_history
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create content history for their company"
ON public.content_engine_history
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their company's content history"
ON public.content_engine_history
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_content_engine_history_company_id ON public.content_engine_history(company_id);
CREATE INDEX idx_content_engine_history_channel ON public.content_engine_history(channel);
CREATE INDEX idx_content_engine_history_created_at ON public.content_engine_history(created_at DESC);