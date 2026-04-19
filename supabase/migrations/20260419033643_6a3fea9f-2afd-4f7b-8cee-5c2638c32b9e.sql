-- Update companies.subscription_tier check constraint to support the canonical 4-tier model
-- (starter, connect, performance, command) plus 'free', while keeping legacy values for back-compat.
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_subscription_tier_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_subscription_tier_check
  CHECK (
    subscription_tier IS NULL
    OR subscription_tier = ANY (ARRAY[
      -- Canonical 4-tier
      'free'::text,
      'starter'::text,
      'connect'::text,
      'performance'::text,
      'command'::text,
      -- Legacy values kept for backward compatibility (mapped via LEGACY_TIER_MAP)
      'express'::text,
      'aura_flow'::text,
      'halo'::text,
      'core'::text,
      'single_point'::text,
      'multi_track'::text,
      'growth'::text,
      'aura_starter'::text,
      'aura_connect'::text,
      'aura_growth'::text,
      'aura_core'::text,
      'aura_boost'::text,
      'aura_pro'::text,
      'aura_elite'::text
    ])
  );