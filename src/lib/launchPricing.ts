/**
 * Beta Pricing — single source of truth for the active promotional pricing.
 * Toggle `active = false` to roll back to standard prices everywhere this is used.
 *
 * Pricing Matrix (June 2026):
 *   Tier   | Standard (struck) | Beta (billed)
 *   Core   | $697 / mo         | $497 / mo
 *   Boost  | $1,394 / mo       | $994 / mo
 *   Pro    | $2,788 / mo       | $1,988 / mo
 *   Elite  | $5,576 / mo       | $3,979 / mo
 *
 * Onboarding (one-time, Beta): 50% of beta monthly per tier:
 *   Core $249 · Boost $497 · Pro $994 · Elite $1,990
 * Onboarding (standard / struck-through): $497 flat across all tiers.
 * Annual = round(monthly × 12 × 0.8) (~20% savings).
 */

export type TierKey = 'starter' | 'connect' | 'performance' | 'command';

export interface TierPricing {
  name: string;
  original: number;
  sale: number;
  onboardingOriginal: number;
  onboardingSale: number;
  annualOriginal: number;
  annualSale: number;
}

export const LAUNCH_PRICING = {
  active: true as boolean,
  label: 'Beta Pricing',
  tiers: {
    starter: {
      name: 'Aura Core',
      original: 697,
      sale: 497,
      onboardingOriginal: 497,
      onboardingSale: 249,
      annualOriginal: 6691,
      annualSale: 4771,
    },
    connect: {
      name: 'Aura Boost',
      original: 1394,
      sale: 994,
      onboardingOriginal: 497,
      onboardingSale: 497,
      annualOriginal: 13382,
      annualSale: 9542,
    },
    performance: {
      name: 'Aura Pro',
      original: 2788,
      sale: 1988,
      onboardingOriginal: 497,
      onboardingSale: 994,
      annualOriginal: 26765,
      annualSale: 19085,
    },
    command: {
      name: 'Aura Elite',
      original: 5576,
      sale: 3979,
      onboardingOriginal: 497,
      onboardingSale: 1990,
      annualOriginal: 53530,
      annualSale: 38198,
    },
  } satisfies Record<TierKey, TierPricing>,
};

export function formatPrice(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function getTierPricing(tier: TierKey): TierPricing {
  return LAUNCH_PRICING.tiers[tier];
}

/** Effective billed monthly price (respects active flag). */
export function getMonthlyPrice(tier: TierKey): number {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active ? t.sale : t.original;
}

/** Effective billed onboarding price (respects active flag). */
export function getOnboardingPrice(tier: TierKey): number {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active ? t.onboardingSale : t.onboardingOriginal;
}

/** Beta onboarding cap — DEPRECATED. Onboarding is now tier-specific
 * (50% of beta monthly), so there is no separate cap to enforce. These
 * exports remain for backward compatibility with older imports. */
export const BETA_ONBOARDING_CAP_CENTS = 0;
export const BETA_ONBOARDING_CAP_AMOUNT = 0;
export const BETA_ONBOARDING_CAP_EXPIRES_AT = '2026-08-01T00:00:00Z';

/** Returns the effective billed annual price (respects active flag). */
export function getAnnualPrice(tier: TierKey): number {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active ? t.annualSale : t.annualOriginal;
}

export function isBetaCapActive(now: Date = new Date()): boolean {
  // Deprecated — per-tier onboarding pricing supersedes the cap mechanism.
  void now;
  return false;
}

/** Returns the effective onboarding price for a tier when a beta code is applied. */
export function getBetaOnboardingPrice(tier: TierKey, now: Date = new Date()): number {
  void now;
  // Per-tier onboarding pricing already reflects beta — no extra cap.
  return getOnboardingPrice(tier);
}