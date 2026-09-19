import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatusTrend = 'up' | 'down' | 'flat';

interface StatusCardProps {
  title: ReactNode;
  value: ReactNode;
  trend?: string;
  trendDirection?: StatusTrend;
  icon?: ReactNode;
  hint?: ReactNode;
  className?: string;
  onClick?: () => void;
}

const TREND_CLASS: Record<StatusTrend, string> = {
  up: 'text-secondary',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
};

/**
 * Small metric tile: label, big value, optional trend and icon.
 */
export function StatusCard({
  title,
  value,
  trend,
  trendDirection = 'flat',
  icon,
  hint,
  className,
  onClick,
}: StatusCardProps) {
  const interactive = typeof onClick === 'function';

  return (
    <Card
      className={cn(
        'border-border/50',
        interactive && 'cursor-pointer transition-colors hover:bg-muted/40',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          {trend && <p className={cn('text-xs font-medium', TREND_CLASS[trendDirection])}>{trend}</p>}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
      </CardContent>
    </Card>
  );
}
