import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  tip?: string;
  tryIt?: string;
  targetSelector: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface UseTutorialOptions {
  persistenceKey: string;
  steps: TutorialStep[];
}

export function useTutorial({ persistenceKey, steps }: UseTutorialOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Use a ref to track if we've already restored from localStorage
  // to prevent re-triggering on every render
  const hasRestoredRef = useRef(false);

  // Restore state from localStorage — runs ONCE on mount only
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if explicitly active AND we have a valid step
        if (parsed.isActive === true && typeof parsed.currentStepIndex === 'number' && parsed.currentStepIndex < steps.length) {
          setCurrentStepIndex(parsed.currentStepIndex);
          setIsActive(true);
        }
      } catch {
        // Corrupt data — clear it
        localStorage.removeItem(persistenceKey);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // Persist state — only when active, and only when step/active changes
  useEffect(() => {
    if (isActive) {
      localStorage.setItem(persistenceKey, JSON.stringify({ isActive: true, currentStepIndex }));
    }
  }, [isActive, currentStepIndex, persistenceKey]);

  // After route navigation completes, clear navigating flag
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => setIsNavigating(false), 700);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isNavigating]);

  const currentStep = steps[currentStepIndex] ?? null;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const navigateToStepRoute = useCallback((step: TutorialStep) => {
    if (step.route && location.pathname !== step.route) {
      setIsNavigating(true);
      navigate(step.route);
      return true;
    }
    return false;
  }, [navigate, location.pathname]);

  const stop = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setIsNavigating(false);
    localStorage.removeItem(persistenceKey);
  }, [persistenceKey]);

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsNavigating(false);
    const firstStep = steps[0];
    if (firstStep) navigateToStepRoute(firstStep);
  }, [steps, navigateToStepRoute]);

  // nextStep is ONLY called by explicit user button click — no auto-advance
  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      navigateToStepRoute(steps[nextIdx]);
    } else {
      stop();
    }
  }, [currentStepIndex, steps, navigateToStepRoute, stop]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      navigateToStepRoute(steps[prevIdx]);
    }
  }, [currentStepIndex, steps, navigateToStepRoute]);

  const skipTo = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      navigateToStepRoute(steps[index]);
    }
  }, [steps, navigateToStepRoute]);

  return {
    isActive,
    isNavigating,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    start,
    nextStep,
    prevStep,
    stop,
    skipTo,
  };
}
