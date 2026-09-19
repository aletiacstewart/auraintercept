import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function getAppointmentStatusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/10 text-cyan-400 border-blue-500/30';
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-500/30';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'no-show':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    default:
      return 'bg-muted text-foreground';
  }
}

const JOB_STATUS_COLORS: Record<string, string> = {
  pending_acceptance: 'bg-warning/10 text-warning',
  accepted: 'bg-secondary/10 text-secondary',
  en_route: 'bg-accent/10 text-accent',
  arrived: 'bg-secondary/10 text-secondary',
  in_progress: 'bg-accent/10 text-accent',
  completed: 'bg-secondary/10 text-secondary',
};

export function JobStatusBadge({
  jobStatus,
  isFieldDispatch,
}: {
  jobStatus?: string;
  isFieldDispatch: boolean;
}) {
  if (!jobStatus) return null;

  const labels: Record<string, string> = {
    pending_acceptance: 'Pending',
    accepted: 'Accepted',
    en_route: isFieldDispatch ? 'En Route' : 'Ready',
    arrived: isFieldDispatch ? 'Arrived' : 'Checked In',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  return (
    <Badge variant="outline" className={cn('text-xs', JOB_STATUS_COLORS[jobStatus] || 'bg-muted')}>
      {labels[jobStatus] || jobStatus}
    </Badge>
  );
}
