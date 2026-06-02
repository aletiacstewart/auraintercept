-- Update the documented canonical pricing for the subscription_tier column.
-- This is a metadata-only change; no row data is modified.
--
-- New canonical pricing (effective immediately):
--   starter     (Aura Core)  — $697 / mo   · $349 one-time onboarding
--   connect     (Aura Boost) — $1,097 / mo · $549 one-time onboarding
--   performance (Aura Pro)   — $1,997 / mo · $999 one-time onboarding
--   command     (Aura Elite) — $3,497 / mo · $1,749 one-time onboarding
--
-- Onboarding fee = 50% of monthly price (rounded to nearest whole dollar).
-- Existing customer subscriptions are NOT migrated; legacy Stripe Price IDs
-- remain mapped via LEGACY_TIER_MAP for grandfathering.

COMMENT ON COLUMN public.companies.subscription_tier IS
  'Subscription tier: free | starter ($697/mo, $349 onboarding) | connect ($1,097/mo, $549 onboarding) | performance ($1,997/mo, $999 onboarding) | command ($3,497/mo, $1,749 onboarding). Legacy IDs (aura_core/aura_boost/aura_pro/aura_elite, scheduling, growth, business, field_ops, express, aura_flow, halo, core, single_point, multi_track) are normalized via LEGACY_TIER_MAP.';
