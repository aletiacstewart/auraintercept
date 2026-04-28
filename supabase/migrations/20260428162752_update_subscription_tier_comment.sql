-- Update column comment to reflect canonical 4-tier model
-- Tiers: starter (Aura Core $197), connect (Aura Boost $497), performance (Aura Pro $997), command (Aura Elite $1,997)
COMMENT ON COLUMN public.companies.subscription_tier IS
  'Canonical 4-tier subscription model: free | starter (Aura Core $197/mo) | connect (Aura Boost $497/mo) | performance (Aura Pro $997/mo) | command (Aura Elite $1,997/mo). Legacy values (single_point, multi_track, express, halo, core, field_ops, aura_flow) are normalized at the application layer via LEGACY_TIER_MAP.';
