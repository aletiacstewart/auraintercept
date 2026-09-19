---
name: Feature flag system
description: feature_flags table + useFeatureFlags hook for per-company toggles and percentage rollouts
type: feature
---
`public.feature_flags (flag_name, enabled, rollout_percentage, company_id nullable, description)`.
- `company_id IS NULL` = global default; a company row overrides the global row.
- Read: any authenticated user, global rows + own company (`get_user_company_id(auth.uid())`). Write: `has_role(auth.uid(),'platform_admin')`.
- Hook: `src/hooks/useFeatureFlags.ts` (`useFeatureFlags()`, `useFeatureFlag(name)`). Rollout percentage is evaluated against a stable per-session bucket in `sessionStorage` (`aura_flag_seed`) so the UI never flips mid-session.

Seeded flags (all `enabled = false` until their surfaces ship): `unified_analytics_enabled`, `new_agent_hub_enabled`, `first_steps_onboarding_enabled`, `industry_specific_paths_enabled`, `new_integration_wizard_enabled`.
