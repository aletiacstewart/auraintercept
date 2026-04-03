import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuraEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** If true, renders inside a <TableCell> friendly div (no extra padding) */
  compact?: boolean;
}

export function AuraEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false,
}: AuraEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
    >
      <div className="relative mb-3">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
        <div className="relative rounded-full bg-primary/5 border border-primary/20 p-3">
          <Icon className={cn('text-primary', compact ? 'h-6 w-6' : 'h-8 w-8')} />
        </div>
      </div>

      <h4 className={cn('font-medium text-foreground mb-1', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h4>
      <p className={cn('text-muted-foreground max-w-sm', compact ? 'text-xs' : 'text-sm')}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={onAction}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
