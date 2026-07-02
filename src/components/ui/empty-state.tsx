import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  compact?: boolean;
}

/**
 * Standard empty state. Use whenever a list, chart, or panel has no data yet
 * instead of rendering a zero-line chart, fake percentages, or a
 * "not available, contact support" error message.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const ActionEl = action?.href ? (
    <Button asChild size="sm" variant="outline">
      <a href={action.href}>{action.label}</a>
    </Button>
  ) : action ? (
    <Button size="sm" variant="outline" onClick={action.onClick}>
      {action.label}
    </Button>
  ) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border/60 bg-muted/20',
        compact ? 'p-4 gap-2' : 'p-8 gap-3',
        className,
      )}
      role="status"
    >
      <div
        className={cn(
          'rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground',
          compact ? 'w-8 h-8' : 'w-12 h-12',
        )}
      >
        <Icon className={cn(compact ? 'w-4 h-4' : 'w-6 h-6')} />
      </div>
      <p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description ? (
        <p className={cn('text-muted-foreground max-w-sm', compact ? 'text-xs' : 'text-sm')}>{description}</p>
      ) : null}
      {ActionEl}
    </div>
  );
}