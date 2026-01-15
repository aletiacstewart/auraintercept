-- Create enum types for platform issues
CREATE TYPE public.issue_type AS ENUM ('frontend_error', 'ai_agent_error', 'api_error', 'user_reported', 'feature_request');
CREATE TYPE public.issue_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.issue_status AS ENUM ('new', 'acknowledged', 'in_progress', 'resolved', 'wont_fix');

-- Create platform_issues table
CREATE TABLE public.platform_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Issue classification
  issue_type public.issue_type NOT NULL,
  severity public.issue_severity NOT NULL DEFAULT 'medium',
  status public.issue_status NOT NULL DEFAULT 'new',
  
  -- Context
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  
  -- Details
  title TEXT NOT NULL,
  description TEXT,
  error_stack TEXT,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_platform_issues_status ON public.platform_issues(status);
CREATE INDEX idx_platform_issues_severity ON public.platform_issues(severity);
CREATE INDEX idx_platform_issues_company_id ON public.platform_issues(company_id);
CREATE INDEX idx_platform_issues_created_at ON public.platform_issues(created_at DESC);
CREATE INDEX idx_platform_issues_type ON public.platform_issues(issue_type);

-- Enable RLS
ALTER TABLE public.platform_issues ENABLE ROW LEVEL SECURITY;

-- Platform admins: Full access to all issues
CREATE POLICY "platform_admins_full_access" ON public.platform_issues
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Company admins: Can view and report issues for their company
CREATE POLICY "company_admins_view_own_company" ON public.platform_issues
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::public.app_role) AND
  company_id = public.get_user_company_id(auth.uid())
);

-- All authenticated users: Can insert issues (report bugs/features)
CREATE POLICY "authenticated_users_can_report" ON public.platform_issues
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
);

-- Users can view their own reported issues
CREATE POLICY "users_view_own_issues" ON public.platform_issues
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_platform_issues_updated_at
  BEFORE UPDATE ON public.platform_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.platform_issues IS 'Platform-wide issue tracking for errors, bugs, and feature requests from all user types';