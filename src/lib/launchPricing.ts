/**
 * Launch Pricing — single source of truth for the active promotional pricing.
 * Toggle `active = false` to roll back to original prices everywhere this is used.
 */

export type TierKey = 'starter' | 'connect' | 'performance' | 'command';

export interface TierPricing {
  name: string;
  original: number;
  sale: number;
  onboardingOriginal: number;
  onboardingSale: number;
}

export const LAUNCH_PRICING = {
  active: true as boolean,
  label: 'Launch Pricing',
  tiers: {
    starter: {
      name: 'Aura Core',
      original: 697,
      sale: 497,
      onboardingOriginal: 349,
      onboardingSale: 249,
    },
    connect: {
      name: 'Aura Boost',
      original: 1097,
      sale: 897,
      onboardingOriginal: 549,
      onboardingSale: 449,
    },
    performance: {
      name: 'Aura Pro',
      original: 1997,
      sale: 1797,
      onboardingOriginal: 999,
      onboardingSale: 899,
    },
    command: {
      name: 'Aura Elite',
      original: 3497,
      sale: 3097,
      onboardingOriginal: 1749,
      onboardingSale: 1549,
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