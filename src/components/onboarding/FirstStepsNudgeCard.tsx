import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Rocket, X } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import FirstStepsChecklist from '@/pages/Onboarding/FirstStepsChecklist';

/**
 * Dashboard nudge for the First Steps checklist. Never blocks the dashboard —
 * it just shows remaining setup and opens the checklist dialog.
 */
export function FirstStepsNudgeCard() {
  const { shouldPrompt, loading, completedCount, totalCount, progressPercent, steps, dismiss } = useOnboarding();
  const autoOpenEnabled = useFeatureFlag('first_steps_onboarding_enabled');
  const [open, setOpen] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    if (autoOpenEnabled && shouldPrompt && !autoOpened && completedCount === 0) {
      setOpen(true);
      setAutoOpened(true);
    }
  }, [autoOpenEnabled, shouldPrompt, autoOpened, completedCount]);

  if (loading || !shouldPrompt) return null;

  const next = steps.find((s) => !s.done && !s.skipped) ?? steps.find((s) => !s.done);

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Finish setting up Aura</p>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} done{next ? ` · Next: ${next.title}` : ''}
              </p>
              <Progress value={progressPercent} className="mt-2 h-1.5 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>
              Continue setup
            </Button>
            <Button size="sm" variant="ghost" onClick={() => dismiss()} aria-label="Hide setup list">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <FirstStepsChecklist open={open} onOpenChange={setOpen} />
    </>
  );
}
