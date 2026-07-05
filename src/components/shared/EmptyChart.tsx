import { BarChart3, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyChartProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  className?: string;
}

/**
 * Lightweight empty-state placeholder for charts and analytic panels.
 * Use inside a Card/CardContent when the underlying query returns zero rows.
 */
export function EmptyChart({
  icon: Icon = BarChart3,
  title = 'No data yet',
  message = 'This chart will fill in as activity happens in your workspace.',
  className,
}: EmptyChartProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 h-full min-h-[160px] rounded-md border border-dashed border-border/60 bg-card/30 py-8 text-center',
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
