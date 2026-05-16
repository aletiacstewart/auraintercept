import { Sparkles, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardViewMode, type DashboardViewMode } from '@/hooks/useDashboardViewMode';
import { cn } from '@/lib/utils';

interface DashboardViewToggleProps {
  className?: string;
}

/**
 * Header pill toggle: Simple ↔ Pro dashboard view.
 * Simple = command bar + top KPIs. Pro = full stat grid + quick actions + metrics.
 */
export function DashboardViewToggle({ className }: DashboardViewToggleProps) {
  const { mode, setMode } = useDashboardViewMode();

  const options: { value: DashboardViewMode; label: string; icon: typeof Sparkles; tip: string }[] = [
    { value: 'simple', label: 'Simple', icon: Sparkles, tip: 'Just the essentials — best for owners on the go' },
    { value: 'pro', label: 'Pro', icon: LayoutGrid, tip: 'Full stats, quick actions, and metrics grid' },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="radiogroup"
        aria-label="Dashboard view density"
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border p-1',
          className,
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = mode === opt.value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    'h-7 px-3 rounded-full text-xs font-medium gap-1.5 transition-all',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground'
                      : 'text-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{opt.tip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
