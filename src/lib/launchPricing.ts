/**
 * Client re-export of the canonical Beta Pricing module.
 *
 * The actual pricing data + helpers live in
 * `supabase/functions/_shared/launch-pricing.ts` so that both the browser
 * bundle AND Deno edge functions (Message Aura / Talk to Aura sales prompt,
 * checkout, etc.) share exactly one source of truth.
 *
 * DO NOT add pricing numbers or formatting logic here — edit the shared file.
 */
export type { TierKey, TierPricing, OnboardingDisplay } from '../../supabase/functions/_shared/launch-pricing';
export {
  LAUNCH_PRICING,
  ONBOARDING_FEE_WAIVED_GLOBALLY,
  BETA_ONBOARDING_CAP_CENTS,
  BETA_ONBOARDING_CAP_AMOUNT,
  BETA_ONBOARDING_CAP_EXPIRES_AT,
  formatPrice,
  getTierPricing,
  getMonthlyPrice,
  getOnboardingPrice,
  getAnnualPrice,
  getOnboardingDisplay,
  isBetaCapActive,
  getBetaOnboardingPrice,
  formatMonthlyCost,
  formatOnboardingCost,
  formatTierLabel,
  formatSalesLine,
  tierKeyFromName,
} from '../../supabase/functions/_shared/launch-pricing';