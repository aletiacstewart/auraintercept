import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'neutral' | 'danger' | 'info';

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
  neutral: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/20',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone: StatusTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified status badge for the platform.
 * Tone mapping:
 * - success: active / approved / auto-executed / free / live
 * - warning: required / pending / needs action
 * - neutral: optional / inactive / not configured
 * - danger:  failed / error / critical
 * - info:    informational-only
 */
export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ tone, icon, children, className, ...rest }, ref) => (
    <Badge
      ref={ref as any}
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium border transition-colors',
        toneClasses[tone],
        className
      )}
      {...(rest as any)}
    >
      {icon}
      <span>{children}</span>
    </Badge>
  )
);
StatusBadge.displayName = 'StatusBadge';

/** Resolve a common label string to its semantic tone. */
export function toneForLabel(label: string): StatusTone {
  const l = label.trim().toLowerCase();
  if (['failed', 'error', 'critical', 'offline', 'down'].includes(l)) return 'danger';
  if (['active', 'approved', 'auto-executed', 'auto', 'free', 'live', 'online', 'processed', 'success', 'connected', 'enabled'].includes(l)) return 'success';
  if (['required', 'pending', 'needs action', 'review', 'in progress', 'processing'].includes(l)) return 'warning';
  if (['optional', 'inactive', 'not configured', 'disabled', 'idle', 'draft'].includes(l)) return 'neutral';
  return 'info';
}
