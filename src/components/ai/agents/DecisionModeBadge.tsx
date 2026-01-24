import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DecisionMode = 'auto' | 'review' | 'escalate';

interface DecisionModeBadgeProps {
  mode: DecisionMode;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const modeConfig: Record<DecisionMode, {
  label: string;
  icon: React.ElementType;
  className: string;
  description: string;
}> = {
  auto: {
    label: 'Auto',
    icon: Zap,
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
    description: 'Executed automatically with high confidence'
  },
  review: {
    label: 'Review',
    icon: Eye,
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
    description: 'Flagged for human review'
  },
  escalate: {
    label: 'Escalate',
    icon: AlertTriangle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    description: 'Requires immediate attention'
  }
};

export const DecisionModeBadge: React.FC<DecisionModeBadgeProps> = ({
  mode,
  className,
  showIcon = true,
  size = 'sm'
}) => {
  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium border transition-colors',
        config.className,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
};

export default DecisionModeBadge;
