---
name: Trial Honors Selected Tier
description: Active 90-day trial returns the company's selected subscription_tier; it does NOT promote users to Elite/command access. Applies to check-subscription, ai-agent-chat, widget-api, useSubscription, dashboard layout, AI/customer consoles.
type: constraint
---

# Trial honors the selected tier

A company in an active 90-day trial keeps the plan it picked at signup. Trial = "free use of the chosen tier for 90 days," NOT "free Elite for 90 days."

## Rules

- `supabase/functions/check-subscription` returns `tier = company.subscription_tier` while `in_trial = true` (never overrides to `command`).
- `supabase/functions/ai-agent-chat` derives `allowedAgents` from `TIER_AGENTS[subscriptionTier]` only.
- `supabase/functions/widget-api` resolves `effectiveTier` from `company.subscription_tier`; trial does not unlock extra quick actions.
- `src/hooks/useSubscription.ts`: `canAccessAgent`, `canAccessConsole`, `getAvailableAgents`, `getAvailableConsoles`, `canAccessFeatureArea` ignore `inTrial` for tier gating.
- `src/components/dashboard/DashboardLayout.tsx` sidebar groups/items gate purely on tier hierarchy.
- `src/components/dashboard/CompanyAdminDashboard.tsx` `hasTierAccess` ignores `inTrial`.
- `src/components/ai/AIAgentConsole.tsx` and `src/components/customer/UnifiedCustomerConsole.tsx` use `company.subscription_tier` directly.
- `src/lib/customerPortalConfig.ts` `getEffectiveTier` returns the stored tier even when `inTrial`.
- `src/pages/Help.tsx` shows help content for the selected tier (platform admin still sees Elite).

Trial UI (banner, days remaining, progress) still uses `inTrial`/`trialEndsAt`; only feature gating changed.

## Why

Demo accounts and real signups must reflect the plan that was actually chosen so console / dashboard / AI Operative gating shows what that plan really delivers — not a temporary Elite preview.
