-- Drop the constraint first (it still exists with old values)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_subscription_tier_check;

-- Update all existing companies to use new tier names
UPDATE companies SET subscription_tier = 'starter' WHERE subscription_tier = 'express';
UPDATE companies SET subscription_tier = 'scheduling' WHERE subscription_tier = 'halo';
UPDATE companies SET subscription_tier = 'growth' WHERE subscription_tier = 'core';
UPDATE companies SET subscription_tier = 'business' WHERE subscription_tier = 'free';
UPDATE companies SET subscription_tier = 'field_ops' WHERE subscription_tier = 'single_point';
UPDATE companies SET subscription_tier = 'performance' WHERE subscription_tier = 'multi_track';

-- Add new constraint with updated tier names
ALTER TABLE companies ADD CONSTRAINT companies_subscription_tier_check 
CHECK (subscription_tier = ANY (ARRAY['starter'::text, 'scheduling'::text, 'growth'::text, 'business'::text, 'field_ops'::text, 'performance'::text, 'command'::text]));

-- Update demo company names and slugs
UPDATE companies SET name = 'Demo Starter Company', slug = 'demo-starter'
WHERE id = 'd4a6c195-c89a-4208-a818-981902af6c51';

UPDATE companies SET name = 'Demo Scheduling Company', slug = 'demo-scheduling'
WHERE id = '56c0a3a8-a2a1-4689-9c18-d115080a816d';

UPDATE companies SET name = 'Demo Growth Company', slug = 'demo-growth'
WHERE id = 'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a';

UPDATE companies SET name = 'Demo Business Company', slug = 'demo-business'
WHERE id = 'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f';

UPDATE companies SET name = 'Demo Field Ops Company', slug = 'demo-fieldops'
WHERE id = '8fafcec0-4b2a-45a1-8663-f9ccb5afc545';

UPDATE companies SET name = 'Demo Performance Company', slug = 'demo-performance'
WHERE id = '4f85ed98-0e98-480c-b904-1c33424e26ad';

UPDATE companies SET slug = 'demo-command'
WHERE id = '298a7275-0a1f-4bd8-a0ae-b692fdbcd3af';