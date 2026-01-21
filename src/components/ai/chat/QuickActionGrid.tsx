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
  featureColor?: string;
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
    <div className={cn('grid gap-1.5', gridClass[columns])}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'outline'}
          size="sm"
          className={cn(
            'h-auto flex-col gap-1 py-2 px-1.5 text-[10px]',
            'border-border/50 text-white hover:opacity-90 hover:border-primary/50 transition-colors rounded-lg',
            action.variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90 border-destructive'
          )}
          style={{ background: 'hsl(208 30% 18%)' }}
          onClick={() => onAction(action.message, action.id)}
        >
          <action.icon className={cn("h-4 w-4", action.featureColor)} />
          <span className="text-center leading-tight font-medium">{action.label}</span>
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
    <div className="shrink-0 border-t border-border/50 p-1.5 overflow-hidden" style={{ background: 'hsl(208 30% 18%)' }}>
      <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'ghost'}
            size="sm"
            className={cn(
              'text-[10px] shrink-0 rounded-full px-2.5 h-7 text-white/80',
              'hover:bg-white/10 hover:text-white transition-colors',
              action.variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90'
            )}
            onClick={() => onAction(action.message, action.id)}
          >
            <action.icon className={cn("h-3 w-3 mr-1", action.featureColor)} />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
