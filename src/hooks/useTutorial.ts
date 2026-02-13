import { useState, useCallback, useEffect } from 'react';
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

  // Restore state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isActive && parsed.currentStepIndex < steps.length) {
          setCurrentStepIndex(parsed.currentStepIndex);
          setIsActive(true);
        }
      } catch {}
    }
  }, [persistenceKey, steps.length]);

  // Persist state
  useEffect(() => {
    if (isActive) {
      localStorage.setItem(persistenceKey, JSON.stringify({ isActive, currentStepIndex }));
    }
  }, [isActive, currentStepIndex, persistenceKey]);

  // After navigation, clear navigating flag
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => setIsNavigating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isNavigating]);

  const currentStep = steps[currentStepIndex] || null;
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

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    const firstStep = steps[0];
    if (firstStep) navigateToStepRoute(firstStep);
  }, [steps, navigateToStepRoute]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      navigateToStepRoute(steps[nextIdx]);
    } else {
      stop();
    }
  }, [currentStepIndex, steps, navigateToStepRoute]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      navigateToStepRoute(steps[prevIdx]);
    }
  }, [currentStepIndex, steps, navigateToStepRoute]);

  const stop = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    localStorage.removeItem(persistenceKey);
  }, [persistenceKey]);

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
