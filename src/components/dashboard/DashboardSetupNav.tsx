import { Link, useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupProgress } from '@/hooks/useSetupProgress';

export function DashboardSetupNav() {
  const location = useLocation();
  const { loading, steps, completedCount, totalCount, progressPercent } = useSetupProgress();

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="guide-card rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Overall Setup Progress</h3>
            <p className="text-xs text-foreground">
              {loading
                ? 'Checking your setup…'
                : `${completedCount} of ${totalCount} steps completed`}
            </p>
          </div>
          <span className="text-lg font-bold text-primary">
            {loading ? '…' : `${Math.round(progressPercent)}%`}
          </span>
        </div>
        <Progress
          value={loading ? 0 : progressPercent}
          className="h-2 bg-primary/40 [&>div]:bg-primary"
        />
      </div>

      {/* Step chips */}
      <div className="inline-flex flex-wrap p-1 bg-muted/30 rounded-lg gap-1">
        {steps.map((step) => {
          const isActive =
            location.pathname === step.href.split('?')[0] ||
            (step.href !== '/dashboard' && location.pathname.startsWith(step.href.split('?')[0]));
          const Icon = step.icon;

          return (
            <Link
              key={step.id}
              to={step.href}
              title={step.description}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs font-medium',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : step.completed
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50',
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span>{step.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
