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
 * Onboarding (one-time): equals ONE MONTH of the plan (struck-through original),
 * then 25% OFF during Beta — sale price billed (rounded to nearest $10):
 *   Tier   | Original (1 mo, struck) | Beta Sale (billed, 25% off)
 *   Core   | $497                    | $370
 *   Boost  | $994                    | $750
 *   Pro    | $1,988                  | $1,490
 *   Elite  | $3,979                  | $2,980
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

/**
 * GLOBAL onboarding-fee waiver.
 *
 * When true, no onboarding line item is added to checkout and pricing UI
 * renders a waived label. Now false because onboarding is deferred to day 31
 * of the 60-Day Live Trial and invoiced by the charge-onboarding-fee cron
 * edge function. The first monthly plan fee is deferred to day 61 via a
 * 60-day Stripe trial.
 *
 * Mirrored in supabase/functions/create-checkout/index.ts as
 * ONBOARDING_FEE_WAIVED_GLOBALLY — kept in sync.
 */
export const ONBOARDING_FEE_WAIVED_GLOBALLY = false;

export interface OnboardingDisplay {
  waived: boolean;
  /** Short label for pricing cards. */
  label: string;
  /** Struck-through original price (always present so callers can keep the strike UI). */
  original: number;
  /** Effective sale price (0 when waived globally). */
  sale: number;
}

/** Central helper for onboarding price copy. All surfaces should route through this. */
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
 * (25% OFF original, rounded to nearest $10), so there is no separate
 * cap to enforce. These exports remain for backward compatibility. */
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

/* --------------------------------------------------------------------------
 * Canonical formatted strings for prompts, templates, and copy blocks.
 * All 4-tier price copy should route through these helpers so `launchPricing`
 * remains the single source of truth. See Core memory: "Always show original
 * strikethrough + sale + 'Beta Pricing' chip".
 * ------------------------------------------------------------------------ */

/** e.g. "$497/mo (was $697)" when beta active, or "$697/mo" when not. */
export function formatMonthlyCost(tier: TierKey): string {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active
    ? `${formatPrice(t.sale)}/mo (was ${formatPrice(t.original)})`
    : `${formatPrice(t.original)}/mo`;
}

/** e.g. "$370 (was $497)" when beta active. */
export function formatOnboardingCost(tier: TierKey): string {
  const t = getTierPricing(tier);
  return LAUNCH_PRICING.active
    ? `${formatPrice(t.onboardingSale)} (was ${formatPrice(t.onboardingOriginal)})`
    : formatPrice(t.onboardingOriginal);
}

/** e.g. "Aura Core ($497/mo · $370 onboarding · Beta Pricing — was $697/mo + $497 onboarding)". */
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

/** e.g. "$497/mo + $370 onboarding   (Beta — was $697/mo + $497 onboarding)". Used in sales voice prompts. */
export function formatSalesLine(tier: TierKey): string {
  const t = getTierPricing(tier);
  if (!LAUNCH_PRICING.active) {
    return `${formatPrice(t.original)}/mo + ${formatPrice(t.onboardingOriginal)} onboarding`;
  }
  return (
    `${formatPrice(t.sale)}/mo + ${formatPrice(t.onboardingSale)} onboarding ` +
    `(Beta — was ${formatPrice(t.original)}/mo + ${formatPrice(t.onboardingOriginal)} onboarding)`
  );
}

/** Map a display tier name ("Aura Core") back to the TierKey, for legacy tables keyed by label. */
export function tierKeyFromName(name: string): TierKey | undefined {
  const entry = (Object.entries(LAUNCH_PRICING.tiers) as Array<[TierKey, TierPricing]>).find(
    ([, t]) => t.name === name,
  );
  return entry?.[0];
}