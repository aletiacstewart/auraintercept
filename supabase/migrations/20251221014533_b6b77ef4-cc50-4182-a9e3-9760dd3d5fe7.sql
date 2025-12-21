-- Add indexes for common queries to improve performance

-- Index for customer_profiles portal_token lookups
CREATE INDEX IF NOT EXISTS idx_customer_profiles_portal_token ON public.customer_profiles(portal_token) WHERE portal_token IS NOT NULL;

-- Index for appointments by company and datetime (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_appointments_company_datetime ON public.appointments(company_id, datetime);

-- Index for job_assignments by employee and status (technician job queue)
CREATE INDEX IF NOT EXISTS idx_job_assignments_employee_status ON public.job_assignments(employee_id, status);

-- Index for reminder_logs by company and created_at (for messages count)
CREATE INDEX IF NOT EXISTS idx_reminder_logs_company_created ON public.reminder_logs(company_id, created_at);

-- Index for invoices by company and status (for outstanding invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON public.invoices(company_id, status);

-- Index for quotes by company and status (for quote conversion metrics)
CREATE INDEX IF NOT EXISTS idx_quotes_company_status ON public.quotes(company_id, status);

-- Index for customer_feedback by company (for satisfaction metrics)
CREATE INDEX IF NOT EXISTS idx_customer_feedback_company ON public.customer_feedback(company_id);