import { useTutorial } from '@/hooks/useTutorial';
import { dashboardTutorialSteps } from './tutorialSteps';
import { TutorialStepOverlay } from './TutorialStep';
import { createContext, useContext } from 'react';

interface TutorialContextType {
  start: () => void;
  isActive: boolean;
}

const TutorialContext = createContext<TutorialContextType>({ start: () => {}, isActive: false });

export const useTutorialContext = () => useContext(TutorialContext);

export function DashboardTutorialProvider({ children }: { children: React.ReactNode }) {
  const tutorial = useTutorial({
    persistenceKey: 'dashboard-tutorial-v1',
    steps: dashboardTutorialSteps,
  });

  return (
    <TutorialContext.Provider value={{ start: tutorial.start, isActive: tutorial.isActive }}>
      {children}
      {tutorial.isActive && tutorial.currentStep && (
        <TutorialStepOverlay
          step={tutorial.currentStep}
          stepIndex={tutorial.currentStepIndex}
          totalSteps={tutorial.totalSteps}
          progress={tutorial.progress}
          onNext={tutorial.nextStep}
          onPrev={tutorial.prevStep}
          onSkip={tutorial.stop}
          isNavigating={tutorial.isNavigating}
        />
      )}
    </TutorialContext.Provider>
  );
}
