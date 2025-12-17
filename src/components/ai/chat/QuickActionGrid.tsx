import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface QuickActionGridProps {
  actions: QuickAction[];
  onAction: (message: string, actionId: string) => void;
  columns?: 2 | 4;
  compact?: boolean;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  actions,
  onAction,
  columns = 2,
  compact = false,
}) => {
  return (
    <div className={cn(
      'grid gap-1.5',
      columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
    )}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'outline'}
          size="sm"
          className={cn(
            'h-auto flex-col gap-1 py-2 px-1.5 text-[11px]',
            'hover:border-primary/50 transition-colors',
            action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive'
          )}
          onClick={() => onAction(action.message, action.id)}
        >
          <action.icon className="h-4 w-4" />
          <span className="text-center leading-tight">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};

interface QuickActionBarProps {
  actions: QuickAction[];
  onAction: (message: string, actionId: string) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions,
  onAction,
}) => {
  return (
    <div className="shrink-0 border-t glass-panel p-2">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'ghost'}
            size="sm"
            className={cn(
              'text-xs shrink-0 rounded-full px-3 h-8',
              'hover:bg-primary/10 hover:text-primary transition-colors',
              action.variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
            )}
            onClick={() => onAction(action.message, action.id)}
          >
            <action.icon className="h-3 w-3 mr-1.5" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
