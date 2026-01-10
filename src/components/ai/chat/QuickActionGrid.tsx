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
  columns?: 2 | 3 | 4 | 5;
  compact?: boolean;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  actions,
  onAction,
  columns = 2,
  compact = false,
}) => {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-2', gridClass[columns])}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'outline'}
          size="sm"
          className={cn(
            'h-auto flex-col gap-1.5 py-3 px-2 text-xs',
            'bg-slate-700/80 border-slate-600/50 text-white hover:bg-slate-600 hover:border-primary/50 transition-colors',
            action.variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90 border-destructive'
          )}
          onClick={() => onAction(action.message, action.id)}
        >
          <action.icon className="h-5 w-5" />
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
    <div className="shrink-0 border-t border-slate-600/50 bg-slate-700/80 p-2">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'ghost'}
            size="sm"
            className={cn(
              'text-xs shrink-0 rounded-full px-3 h-8 text-white/80',
              'hover:bg-white/10 hover:text-white transition-colors',
              action.variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90'
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
