-- Fix legacy/bogus company_id placeholder on job assignments by syncing to the employee's profile company_id
UPDATE public.employee_job_assignments eja
SET company_id = p.company_id
FROM public.profiles p
WHERE p.id = eja.employee_id
  AND eja.company_id = '00000000-0000-0000-0000-000000000001'
  AND p.company_id IS NOT NULL;

-- Make job role assignments tenant-scoped (so the same employee/job_type can exist in different companies)
ALTER TABLE public.employee_job_assignments
DROP CONSTRAINT IF EXISTS employee_job_assignments_employee_id_job_type_key;

ALTER TABLE public.employee_job_assignments
ADD CONSTRAINT employee_job_assignments_company_employee_job_key
UNIQUE (company_id, employee_id, job_type);