-- Add unique constraint for company_id + month_year to support upsert
ALTER TABLE public.cost_estimates 
ADD CONSTRAINT cost_estimates_company_month_unique UNIQUE (company_id, month_year);