import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpCircle, Zap, Hand, ListChecks, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HowToUseModalProps {
  /** Console / feature title (e.g. "Front Desk Operative") */
  title: string;
  /** What runs autonomously 24/7 — bullet list */
  runsAutomatically: string[];
  /** When the human owner steps in — bullet list */
  whenYouStepIn: string[];
  /** Numbered setup or usage steps */
  steps: string[];
  /** Concrete home-service example narrative */
  example: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Optional override label (defaults to "How to use") */
  triggerLabel?: string;
  /** Render as icon-only "?" button when true */
  iconOnly?: boolean;
}

/**
 * Universal "How to Use" modal.
 *
 * Drop in next to any console / KB tab title. Provides a consistent
 * blue (?) trigger and 4-section explainer matching the marketing
 * site copy structure: Runs 24/7 · When you step in · Steps · Example.
 */
export function HowToUseModal({
  title,
  runsAutomatically,
  whenYouStepIn,
  steps,
  example,
  className,
  triggerLabel = 'How to use',
  iconOnly = false,
}: HowToUseModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={iconOnly ? 'icon' : 'sm'}
          className={cn(
            'border-primary/40 text-primary hover:bg-primary/10 hover:text-primary',
            !iconOnly && 'w-full sm:w-auto',
            className,
          )}
          aria-label={`How to use ${title}`}
        >
          <HelpCircle className={cn('h-4 w-4', !iconOnly && 'mr-1.5')} />
          {!iconOnly && <span className="truncate">{triggerLabel}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            How to use: {title}
          </DialogTitle>
          <DialogDescription>
            Set it and forget it. Here's exactly what runs automatically and when you'd ever need to step in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-emerald-300">Runs automatically 24/7</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-foreground/90 list-disc list-inside">
              {runsAutomatically.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Hand className="h-4 w-4 text-amber-400" />
              <h3 className="font-semibold text-amber-300">When you step in</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-foreground/90 list-disc list-inside">
              {whenYouStepIn.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-primary">Steps to get going</h3>
            </div>
            <ol className="space-y-1.5 text-sm text-foreground/90 list-decimal list-inside">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </Card>

          <Card className="p-4 border-violet-500/30 bg-violet-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-violet-400" />
              <h3 className="font-semibold text-violet-300">Home-service example</h3>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{example}</p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
