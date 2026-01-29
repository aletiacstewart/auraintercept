import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that detects when the page becomes visible after being hidden
 * and invalidates stale queries to ensure fresh data is displayed.
 * 
 * This helps the Lovable preview show the latest changes after code deploys.
 */
export const useVisibilityRefresh = (staleThresholdMs: number = 60000) => {
  const queryClient = useQueryClient();
  const lastVisibleRef = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const hiddenDuration = Date.now() - lastVisibleRef.current;
        
        // If hidden for longer than threshold, invalidate all queries
        if (hiddenDuration > staleThresholdMs) {
          console.log(`[VisibilityRefresh] Tab was hidden for ${Math.round(hiddenDuration / 1000)}s, invalidating queries`);
          queryClient.invalidateQueries();
        }
      } else {
        // Track when we became hidden
        lastVisibleRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, staleThresholdMs]);
};
