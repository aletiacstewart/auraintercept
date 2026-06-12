import { LAUNCH_PRICING, formatPrice, getTierPricing, type TierKey } from '@/lib/launchPricing';
import { cn } from '@/lib/utils';

interface SalePriceProps {
  tier: TierKey;
  /** 'monthly' shows monthly price; 'onboarding' shows onboarding fee. */
  kind?: 'monthly' | 'onboarding';
  /** Append e.g. "/mo" or "one-time" after the price. */
  suffix?: string;
  /** Hide the "Beta Pricing" chip (keep strikethrough). */
  hideChip?: boolean;
  /** Render inline vs stacked. */
  layout?: 'inline' | 'stacked';
  className?: string;
  /** Optional size variant. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<SalePriceProps['size']>, { sale: string; old: string }> = {
  sm: { sale: 'text-base font-semibold', old: 'text-xs' },
  md: { sale: 'text-lg font-bold', old: 'text-sm' },
  lg: { sale: 'text-2xl font-bold', old: 'text-sm' },
  xl: { sale: 'text-4xl font-extrabold', old: 'text-base' },
};

export function SalePrice({
  tier,
  kind = 'monthly',
  suffix,
  hideChip,
  layout = 'inline',
  className,
  size = 'lg',
}: SalePriceProps) {
  const t = getTierPricing(tier);
  const original = kind === 'monthly' ? t.original : t.onboardingOriginal;
  const sale = kind === 'monthly' ? t.sale : t.onboardingSale;
  const active = LAUNCH_PRICING.active;
  const sizes = SIZE_CLASSES[size];

  if (!active) {
    return (
      <span className={cn('inline-flex items-baseline gap-1', className)}>
        <span className={sizes.sale}>{formatPrice(original)}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        layout === 'stacked' ? 'inline-flex flex-col items-start gap-0.5' : 'inline-flex items-baseline gap-2 flex-wrap',
        className,
      )}
    >
      <span className={cn(sizes.old, 'text-muted-foreground line-through decoration-2 decoration-destructive/70')}>
        {formatPrice(original)}
      </span>
      <span className="inline-flex items-baseline gap-1">
        <span className={cn(sizes.sale, 'text-primary')}>{formatPrice(sale)}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </span>
      {!hideChip && (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary border border-primary/20">
          {LAUNCH_PRICING.label}
        </span>
      )}
    </span>
  );
}

/** Compact inline form for tables / dense rows: "~$697 $497". */
export function SalePriceInline({
  tier,
  kind = 'monthly',
  className,
}: Pick<SalePriceProps, 'tier' | 'kind' | 'className'>) {
  const t = getTierPricing(tier);
  const original = kind === 'monthly' ? t.original : t.onboardingOriginal;
  const sale = kind === 'monthly' ? t.sale : t.onboardingSale;
  if (!LAUNCH_PRICING.active) {
    return <span className={className}>{formatPrice(original)}</span>;
  }
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span className="text-muted-foreground line-through decoration-destructive/70">{formatPrice(original)}</span>
      <span className="font-semibold text-primary">{formatPrice(sale)}</span>
    </span>
  );
}