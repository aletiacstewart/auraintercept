-- Create launch_progress table to track onboarding launch progress
CREATE TABLE public.launch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  launch_type TEXT NOT NULL CHECK (launch_type IN ('concierge', 'self_guided')),
  target_go_live_date DATE,
  current_phase TEXT DEFAULT 'setup' CHECK (current_phase IN ('setup', 'testing', 'soft_launch', 'live')),
  kickoff_scheduled_at TIMESTAMPTZ,
  kickoff_completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Create launch_milestones table to track individual milestone completion
CREATE TABLE public.launch_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  target_day INTEGER CHECK (target_day BETWEEN 1 AND 14),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, milestone_key)
);

-- Create role_mappings table to store role mappings from audit
CREATE TABLE public.role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('receptionist', 'scheduler', 'dispatcher', 'billing', 'followup', 'marketing')),
  currently_handled_by TEXT NOT NULL CHECK (currently_handled_by IN ('owner', 'dedicated_staff', 'shared_staff', 'nobody', 'software')),
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 4),
  mapped_agent_type TEXT,
  auto_activated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.launch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for launch_progress
CREATE POLICY "Users can view their company launch progress"
  ON public.launch_progress FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their company launch progress"
  ON public.launch_progress FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their company launch progress"
  ON public.launch_progress FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS policies for launch_milestones
CREATE POLICY "Users can view their company launch milestones"
  ON public.launch_milestones FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their company launch milestones"
  ON public.launch_milestones FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their company launch milestones"
  ON public.launch_milestones FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS policies for role_mappings
CREATE POLICY "Users can view their company role mappings"
  ON public.role_mappings FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their company role mappings"
  ON public.role_mappings FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their company role mappings"
  ON public.role_mappings FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Create trigger for updated_at on launch_progress
CREATE TRIGGER update_launch_progress_updated_at
  BEFORE UPDATE ON public.launch_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_launch_progress_company_id ON public.launch_progress(company_id);
CREATE INDEX idx_launch_milestones_company_id ON public.launch_milestones(company_id);
CREATE INDEX idx_role_mappings_company_id ON public.role_mappings(company_id);