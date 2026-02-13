import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X, Lightbulb, MousePointerClick } from 'lucide-react';
import { type TutorialStep as TutorialStepType } from '@/hooks/useTutorial';

interface TutorialStepProps {
  step: TutorialStepType;
  stepIndex: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isNavigating: boolean;
}

export function TutorialStepOverlay({
  step,
  stepIndex,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  isNavigating,
}: TutorialStepProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const findTarget = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setTargetRect(null);
      }
    };

    // Delay to allow navigation render
    const timer = setTimeout(findTarget, isNavigating ? 600 : 100);
    return () => clearTimeout(timer);
  }, [step.targetSelector, isNavigating, stepIndex]);

  // Calculate card position
  const getCardStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 16;
    const cardWidth = 380;
    const cardHeight = 280;
    const pos = step.position || 'right';

    let top = targetRect.top;
    let left = targetRect.right + padding;

    if (pos === 'bottom') {
      top = targetRect.bottom + padding;
      left = targetRect.left;
    } else if (pos === 'top') {
      top = targetRect.top - cardHeight - padding;
      left = targetRect.left;
    } else if (pos === 'left') {
      left = targetRect.left - cardWidth - padding;
    }

    // Keep in viewport
    if (left + cardWidth > window.innerWidth - 20) left = window.innerWidth - cardWidth - 20;
    if (left < 20) left = 20;
    if (top + cardHeight > window.innerHeight - 20) top = window.innerHeight - cardHeight - 20;
    if (top < 20) top = 20;

    return { top, left };
  };

  const clipPath = targetRect
    ? `polygon(
        0% 0%, 0% 100%, 
        ${targetRect.left - 6}px 100%, 
        ${targetRect.left - 6}px ${targetRect.top - 6}px, 
        ${targetRect.right + 6}px ${targetRect.top - 6}px, 
        ${targetRect.right + 6}px ${targetRect.bottom + 6}px, 
        ${targetRect.left - 6}px ${targetRect.bottom + 6}px, 
        ${targetRect.left - 6}px 100%, 
        100% 100%, 100% 0%
      )`
    : undefined;

  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
        {/* Overlay with cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          style={{ clipPath }}
          onClick={onSkip}
        />

        {/* Highlight ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-lg border-2 border-primary shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tutorial Card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.15 }}
          className="absolute w-[380px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          style={getCardStyle()}
        >
          {/* Progress bar */}
          <div className="px-4 pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                Step {stepIndex + 1} of {totalSteps}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSkip}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <h3 className="text-base font-bold text-card-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

            {step.tip && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200/90">{step.tip}</p>
              </div>
            )}

            {step.tryIt && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <MousePointerClick className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary/90">{step.tryIt}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              disabled={stepIndex === 0}
              className="text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Button>

            <Button
              size="sm"
              onClick={onNext}
              className="text-xs gradient-primary"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
