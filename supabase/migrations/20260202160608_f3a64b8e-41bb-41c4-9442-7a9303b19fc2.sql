-- Add missing fields for Aura Intelligence configuration
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_tone TEXT DEFAULT 'professional';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS emergency_surcharge DECIMAL(10,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS manager_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN companies.brand_tone IS 'AI communication style: professional, friendly, or technical';
COMMENT ON COLUMN companies.emergency_surcharge IS 'After-hours/emergency service fee displayed by AI';
COMMENT ON COLUMN companies.manager_name IS 'Name of manager for de-escalation routing';