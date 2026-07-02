import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupProgress } from '@/hooks/useSetupProgress';

export const SetupProgressBar = forwardRef<HTMLDivElement, object>(function SetupProgressBar(_props, ref) {
  const navigate = useNavigate();
  const { loading, steps, completedCount, totalCount, progressPercent } = useSetupProgress();

  return (
    <div ref={ref} className="guide-card rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Setup Progress</h3>
          <p className="text-xs text-card-foreground/70">
            {loading
              ? 'Checking your setup…'
              : `${completedCount} of ${totalCount} steps completed`}
          </p>
        </div>
        <span className="text-lg font-bold text-secondary">
          {loading ? '…' : `${Math.round(progressPercent)}%`}
        </span>
      </div>

      <Progress
        value={loading ? 0 : progressPercent}
        className="h-2 bg-primary/40 [&>div]:bg-secondary"
      />

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => navigate(step.href)}
              title={step.description}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-all hover:scale-105 cursor-pointer',
                step.completed
                  ? 'bg-secondary/15 border-secondary/40 text-secondary'
                  : 'bg-transparent border-card-foreground/30 text-card-foreground/60 hover:border-primary/50 hover:text-card-foreground',
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
