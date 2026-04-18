import { cn } from '@/lib/utils';

export type KpiStatus = 'good' | 'watch' | 'attention' | 'neutral';

/**
 * Universal traffic-light helper for console KPI strips.
 *
 * Direction:
 *  - 'higher-better' → big numbers are good (revenue, bookings, success rate)
 *  - 'lower-better'  → small numbers are good (overdue invoices, low-stock items, errors)
 *
 * Pass thresholds appropriate to the metric.
 *
 * Example:
 *   getKpiStatus(5, { good: 10, watch: 3, direction: 'higher-better' }) // → 'watch'
 *   getKpiStatus(2, { good: 0, watch: 5, direction: 'lower-better' })   // → 'watch'
 */
export function getKpiStatus(
  value: number,
  opts: { good: number; watch: number; direction?: 'higher-better' | 'lower-better' },
): KpiStatus {
  const dir = opts.direction ?? 'higher-better';
  if (dir === 'higher-better') {
    if (value >= opts.good) return 'good';
    if (value >= opts.watch) return 'watch';
    return 'attention';
  }
  // lower-better
  if (value <= opts.good) return 'good';
  if (value <= opts.watch) return 'watch';
  return 'attention';
}

const STATUS_BORDER: Record<KpiStatus, string> = {
  good: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
  watch: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300',
  attention: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-300',
  neutral: 'border-border bg-muted/30 text-muted-foreground',
};

const STATUS_DOT: Record<KpiStatus, string> = {
  good: 'bg-emerald-500',
  watch: 'bg-amber-500',
  attention: 'bg-rose-500',
  neutral: 'bg-muted-foreground/40',
};

interface StatusChipProps {
  status: KpiStatus;
  label: string;
  /** Optional secondary text shown after the dot */
  hint?: string;
  className?: string;
}

/**
 * Small traffic-light chip for KPI strips across all 7 consoles.
 * Drop next to a metric: <StatusChip status={getKpiStatus(...)} label="Bookings" />
 */
export function StatusChip({ status, label, hint, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_BORDER[status],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      <span>{label}</span>
      {hint && <span className="opacity-70">· {hint}</span>}
    </span>
  );
}
