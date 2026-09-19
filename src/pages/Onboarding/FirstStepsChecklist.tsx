import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, PartyPopper, SkipForward, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding, type FirstStep } from '@/contexts/OnboardingContext';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';

interface FirstStepsChecklistProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StepRow({
  step,
  index,
  onGo,
  onSkip,
  onUnskip,
}: {
  step: FirstStep;
  index: number;
  onGo: (step: FirstStep) => void;
  onSkip: (step: FirstStep) => void;
  onUnskip: (step: FirstStep) => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
        step.done ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            step.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {step.done ? <Check className="h-4 w-4" /> : index + 1}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium leading-tight">{step.title}</p>
            {step.optional && !step.done && (
              <Badge variant="outline" className="text-[10px]">
                Optional
              </Badge>
            )}
            {step.skipped && (
              <Badge variant="secondary" className="text-[10px]">
                Skipped
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 sm:justify-end">
        {step.done ? (
          <Badge className="bg-primary/15 text-primary border-primary/30">Done</Badge>
        ) : (
          <>
            <Button size="sm" onClick={() => onGo(step)}>
              {step.actionLabel}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
            {step.skipped ? (
              <Button size="sm" variant="ghost" onClick={() => onUnskip(step)}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Undo
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => onSkip(step)}>
                <SkipForward className="mr-1 h-3.5 w-3.5" />
                Skip
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FirstStepsChecklist({ open, onOpenChange }: FirstStepsChecklistProps) {
  const navigate = useNavigate();
  const { steps, completedCount, totalCount, progressPercent, isComplete, skipStep, unskipStep, dismiss, celebrated, markCelebrated } =
    useOnboarding();
  const { config, label } = useIndustryConfig();
  const [showCelebration, setShowCelebration] = useState(false);

  const handleGo = (step: FirstStep) => {
    onOpenChange(false);
    navigate(step.href);
  };

  const handleFinish = async () => {
    if (isComplete && !celebrated) {
      setShowCelebration(true);
      await markCelebrated();
      return;
    }
    await dismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {showCelebration ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <PartyPopper className="h-12 w-12 text-primary animate-bounce" />
            <DialogTitle className="text-2xl">You're all set!</DialogTitle>
            <DialogDescription className="max-w-md">
              Aura is ready to answer calls, book work and follow up with your customers.
            </DialogDescription>
            <Button
              onClick={async () => {
                await dismiss();
                setShowCelebration(false);
                onOpenChange(false);
              }}
            >
              Go to my dashboard
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>First steps</DialogTitle>
              <DialogDescription>
                {config.onboarding_message} A few minutes here and {label} work runs on its own.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedCount} of {totalCount} done
                </span>
                <span className="font-semibold text-primary">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="space-y-3 pt-2">
              {steps.map((step, i) => (
                <StepRow key={step.id} step={step} index={i} onGo={handleGo} onSkip={(s) => skipStep(s.id)} onUnskip={(s) => unskipStep(s.id)} />
              ))}
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">What this looks like day to day: </span>
              {config.sample_workflow}
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Finish later
              </Button>
              <Button onClick={handleFinish}>{isComplete ? "I'm done" : 'Hide this list'}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
