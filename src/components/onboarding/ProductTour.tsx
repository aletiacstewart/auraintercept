import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Shepherd from 'shepherd.js';
import type { Tour } from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { useAuth } from '@/contexts/AuthContext';
import {
  dashboardTutorialSteps,
  platformAdminTutorialSteps,
  employeeTutorialSteps,
  type TutorialStep,
} from '@/components/tutorial/tutorialSteps';

const STORAGE_KEY = 'aura-product-tour-completed';

interface ProductTourContextValue {
  start: () => void;
  hasCompleted: boolean;
}

const ProductTourContext = createContext<ProductTourContextValue>({
  start: () => {},
  hasCompleted: false,
});

export const useProductTour = () => useContext(ProductTourContext);

function stepsForRole(role: string | null): TutorialStep[] {
  if (role === 'platform_admin') return platformAdminTutorialSteps;
  if (role === 'employee') return employeeTutorialSteps;
  return dashboardTutorialSteps;
}

function markCompleted(role: string | null) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${role ?? 'guest'}`, String(Date.now()));
  } catch {
    /* storage unavailable — tour simply offers again next visit */
  }
}

function readCompleted(role: string | null): boolean {
  try {
    return !!localStorage.getItem(`${STORAGE_KEY}-${role ?? 'guest'}`);
  } catch {
    return false;
  }
}

/**
 * Interactive product tour (Shepherd.js), themed with app tokens.
 * Steps come from the shared tour definitions; any step whose target is not
 * on the page is skipped so a slimmer role menu never breaks the flow.
 */
export function ProductTourProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const tourRef = useRef<Tour | null>(null);

  useEffect(() => {
    return () => {
      tourRef.current?.complete();
      tourRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    tourRef.current?.complete();

    const steps = stepsForRole(userRole).filter((s) => document.querySelector(s.targetSelector));
    if (steps.length === 0) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'aura-tour-step',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: { enabled: true },
      },
    });

    steps.forEach((step, index) => {
      tour.addStep({
        id: step.id,
        title: step.title,
        text: [step.description, step.tip ? `<em>${step.tip}</em>` : '']
          .filter(Boolean)
          .join('<br/><br/>'),
        attachTo: { element: step.targetSelector, on: step.position ?? 'right' },
        beforeShowPromise: () =>
          new Promise<void>((resolve) => {
            if (step.route && window.location.pathname !== step.route) {
              navigate(step.route);
              setTimeout(resolve, 400);
            } else {
              resolve();
            }
          }),
        buttons: [
          ...(index > 0
            ? [{ text: 'Back', action: () => tour.back(), classes: 'shepherd-button-secondary' }]
            : []),
          {
            text: index === steps.length - 1 ? 'Finish' : 'Next',
            action: () => (index === steps.length - 1 ? tour.complete() : tour.next()),
          },
        ],
      });
    });

    tour.on('complete', () => markCompleted(userRole));
    tour.on('cancel', () => markCompleted(userRole));

    tourRef.current = tour;
    tour.start();
  }, [userRole, navigate]);

  return (
    <ProductTourContext.Provider value={{ start, hasCompleted: readCompleted(userRole) }}>
      {children}
    </ProductTourContext.Provider>
  );
}
