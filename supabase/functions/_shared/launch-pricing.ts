/**
 * Canonical Beta Pricing — single source of truth shared by BOTH the client
 * (`src/lib/launchPricing.ts` re-exports from here) and Deno edge functions
 * (e.g. `landing-chat` via `aura-intercept-sales-prompt.ts`).
 *
 * Never hardcode tier dollar amounts anywhere else. Update this file and
 * every surface — pricing cards, PDFs, Message Aura, Talk to Aura — stays
 * in lockstep.
 *
 * Pure TypeScript, no framework / no runtime-specific imports.
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
      onboardingSale: 370,
      annualOriginal: 6691,
      annualSale: 4771,
    },
    connect: {
      name: 'Aura Boost',
      original: 1394,
      sale: 994,
      onboardingOriginal: 994,
      onboardingSale: 750,
      annualOriginal: 13382,
      annualSale: 9542,
    },
    performance: {
      name: 'Aura Pro',
      original: 2788,
      sale: 1988,
      onboardingOriginal: 1988,
      onboardingSale: 1490,
      annualOriginal: 26765,
      annualSale: 19085,
    },
    command: {
      name: 'Aura Elite',
      original: 5576,
      sale: 3979,
      onboardingOriginal: 3979,
      onboardingSale: 2980,
      annualOriginal: 53530,
      annualSale: 38198,
    },
  } satisfies Record<TierKey, TierPricing>,
};

/** Mirrored in supabase/functions/create-checkout/index.ts. */
export const ONBOARDING_FEE_WAIVED_GLOBALLY = true;

export interface OnboardingDisplay {
  waived: boolean;
  label: string;
  original: number;
  sale: number;
}

export function formatPrice(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function getTierPricing(tier: TierKey): TierPricing {
  return LAUNCH_PRICING.tiers[tier];
}

export function getMonthlyPrice(tier: TierKey): number {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active ? t.sale : t.original;
}

export function getOnboardingPrice(tier: TierKey): number {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active ? t.onboardingSale : t.onboardingOriginal;
}

export function getAnnualPrice(tier: TierKey): number {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active ? t.annualSale : t.annualOriginal;
}

export function getOnboardingDisplay(tier: TierKey): OnboardingDisplay {
  const t = getTierPricing(tier);
  if (ONBOARDING_FEE_WAIVED_GLOBALLY) {
    return {
      waived: true,
      label: 'No setup fee during beta',
      original: t.onboardingOriginal,
      sale: 0,
    };
  }
  return {
    waived: false,
    label: `${formatPrice(t.onboardingSale)} (was ${formatPrice(t.onboardingOriginal)}) — invoiced day 31`,
    original: t.onboardingOriginal,
    sale: t.onboardingSale,
  };
}

/** Deprecated cap exports — kept for backward compatibility. */
export const BETA_ONBOARDING_CAP_CENTS = 0;
export const BETA_ONBOARDING_CAP_AMOUNT = 0;
export const BETA_ONBOARDING_CAP_EXPIRES_AT = '2026-08-01T00:00:00Z';

export function isBetaCapActive(_now: Date = new Date()): boolean {
  return false;
}

export function getBetaOnboardingPrice(tier: TierKey, _now: Date = new Date()): number {
  return getOnboardingPrice(tier);
}

export function formatMonthlyCost(tier: TierKey): string {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active
    ? `${formatPrice(t.sale)}/mo (was ${formatPrice(t.original)})`
    : `${formatPrice(t.original)}/mo`;
}

export function formatOnboardingCost(tier: TierKey): string {
  const t = getTierPricing(tier);
  if (ONBOARDING_FEE_WAIVED_GLOBALLY) {
    return `$0 during Beta (was ${formatPrice(t.onboardingOriginal)})`;
  }
  return LAUNCH_PRICING.active
    ? `${formatPrice(t.onboardingSale)} (was ${formatPrice(t.onboardingOriginal)})`
    : formatPrice(t.onboardingOriginal);
}

export function formatTierLabel(tier: TierKey): string {
  const t = getTierPricing(tier);
  if (!LAUNCH_PRICING.active) {
    return `${t.name} (${formatPrice(t.original)}/mo · ${formatPrice(t.onboardingOriginal)} onboarding)`;
  }
  return (
    `${t.name} (${formatPrice(t.sale)}/mo · ${formatPrice(t.onboardingSale)} onboarding · ` +
    `${LAUNCH_PRICING.label} — was ${formatPrice(t.original)}/mo + ${formatPrice(t.onboardingOriginal)} onboarding)`
  );
}

export function formatSalesLine(tier: TierKey): string {
  const t = getTierPricing(tier);
  if (!LAUNCH_PRICING.active) {
    return `${formatPrice(t.original)}/mo + ${formatPrice(t.onboardingOriginal)} onboarding`;
  }
  if (ONBOARDING_FEE_WAIVED_GLOBALLY) {
    return (
      `${formatPrice(t.sale)}/mo + $0 onboarding during Beta ` +
      `(was ${formatPrice(t.original)}/mo + ${formatPrice(t.onboardingOriginal)} onboarding)`
    );
  }
  return (
    `${formatPrice(t.sale)}/mo + ${formatPrice(t.onboardingSale)} onboarding ` +
    `(Beta — was ${formatPrice(t.original)}/mo + ${formatPrice(t.onboardingOriginal)} onboarding)`
  );
}

export function tierKeyFromName(name: string): TierKey | undefined {
  const entry = (Object.entries(LAUNCH_PRICING.tiers) as Array<[TierKey, TierPricing]>).find(
    ([, t]) => t.name === name,
  );
  return entry?.[0];
}