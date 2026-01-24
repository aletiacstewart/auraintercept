import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ToursCompleted {
  welcome?: boolean;
  dashboard?: boolean;
  ai_agents?: boolean;
  technician?: boolean;
  [key: string]: boolean | undefined;
}

interface OnboardingState {
  onboardingCompletedAt: string | null;
  toursCompleted: ToursCompleted;
  isLoading: boolean;
}

export function useOnboardingState() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    onboardingCompletedAt: null,
    toursCompleted: {},
    isLoading: true,
  });

  // Fetch onboarding state from profile
  useEffect(() => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchOnboardingState = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed_at, tours_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching onboarding state:', error);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        setState({
          onboardingCompletedAt: data?.onboarding_completed_at || null,
          toursCompleted: (data?.tours_completed as ToursCompleted) || {},
          isLoading: false,
        });
      } catch (err) {
        console.error('Error in fetchOnboardingState:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchOnboardingState();
  }, [user?.id]);

  // Mark a specific tour as completed
  const markTourCompleted = useCallback(async (tourName: string) => {
    if (!user?.id) return false;

    try {
      // Fetch current tours_completed to avoid stale state
      const { data: currentData } = await supabase
        .from('profiles')
        .select('tours_completed')
        .eq('id', user.id)
        .single();

      const currentTours = (currentData?.tours_completed as ToursCompleted) || {};
      const updatedTours = {
        ...currentTours,
        [tourName]: true,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ tours_completed: updatedTours })
        .eq('id', user.id);

      if (error) {
        console.error('Error marking tour completed:', error);
        // Store in localStorage as fallback
        localStorage.setItem(`tour_${tourName}_${user.id}`, 'true');
        return false;
      }

      // Also store in localStorage as backup
      localStorage.setItem(`tour_${tourName}_${user.id}`, 'true');

      setState(prev => ({
        ...prev,
        toursCompleted: updatedTours,
      }));

      return true;
    } catch (err) {
      console.error('Error in markTourCompleted:', err);
      // Store in localStorage as fallback
      localStorage.setItem(`tour_${tourName}_${user.id}`, 'true');
      return false;
    }
  }, [user?.id]);

  // Mark overall onboarding as completed
  const markOnboardingCompleted = useCallback(async () => {
    if (!user?.id) return false;

    const timestamp = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: timestamp })
        .eq('id', user.id);

      if (error) {
        console.error('Error marking onboarding completed:', error);
        return false;
      }

      setState(prev => ({
        ...prev,
        onboardingCompletedAt: timestamp,
      }));

      return true;
    } catch (err) {
      console.error('Error in markOnboardingCompleted:', err);
      return false;
    }
  }, [user?.id]);

  // Check if a specific tour has been completed
  const hasTourCompleted = useCallback((tourName: string): boolean => {
    return state.toursCompleted[tourName] === true;
  }, [state.toursCompleted]);

  // Check if welcome modal should be shown
  const shouldShowWelcome = useCallback((): boolean => {
    if (state.isLoading) return false;
    
    // Check localStorage as fallback
    if (user?.id) {
      const localSkipped = localStorage.getItem(`tour_welcome_${user.id}`);
      if (localSkipped === 'true') return false;
    }
    
    return !state.toursCompleted.welcome;
  }, [state.isLoading, state.toursCompleted.welcome, user?.id]);

  return {
    ...state,
    markTourCompleted,
    markOnboardingCompleted,
    hasTourCompleted,
    shouldShowWelcome,
  };
}
