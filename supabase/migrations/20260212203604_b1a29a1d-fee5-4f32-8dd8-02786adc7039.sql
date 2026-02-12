
-- Drop old constraint
ALTER TABLE companies DROP CONSTRAINT companies_subscription_tier_check;

-- Update existing tier values to new IDs
UPDATE companies SET subscription_tier = 'express' WHERE subscription_tier = 'starter';
UPDATE companies SET subscription_tier = 'aura_flow' WHERE subscription_tier = 'scheduling';
UPDATE companies SET subscription_tier = 'halo' WHERE subscription_tier = 'growth';
UPDATE companies SET subscription_tier = 'core' WHERE subscription_tier = 'business';
UPDATE companies SET subscription_tier = 'single_point' WHERE subscription_tier = 'field_ops';
UPDATE companies SET subscription_tier = 'multi_track' WHERE subscription_tier = 'performance';

-- Add new constraint
ALTER TABLE companies ADD CONSTRAINT companies_subscription_tier_check 
  CHECK (subscription_tier = ANY (ARRAY['express', 'aura_flow', 'halo', 'core', 'single_point', 'multi_track', 'command']));
