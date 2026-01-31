-- Create scheduled_blog_posts table for blog scheduling system
CREATE TABLE public.scheduled_blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  keywords TEXT[],
  tone TEXT DEFAULT 'professional',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'rejected', 'failed')),
  batch_id UUID, -- Groups posts generated together
  ai_research_used BOOLEAN DEFAULT false,
  publish_error TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view scheduled blogs for their company" 
  ON public.scheduled_blog_posts 
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create scheduled blogs for their company" 
  ON public.scheduled_blog_posts 
  FOR INSERT 
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update scheduled blogs for their company" 
  ON public.scheduled_blog_posts 
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scheduled blogs for their company" 
  ON public.scheduled_blog_posts 
  FOR DELETE 
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_scheduled_blog_posts_company ON public.scheduled_blog_posts(company_id);
CREATE INDEX idx_scheduled_blog_posts_status ON public.scheduled_blog_posts(status);
CREATE INDEX idx_scheduled_blog_posts_scheduled ON public.scheduled_blog_posts(scheduled_for);
CREATE INDEX idx_scheduled_blog_posts_batch ON public.scheduled_blog_posts(batch_id);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_blog_posts_updated_at
  BEFORE UPDATE ON public.scheduled_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();