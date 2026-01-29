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
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        const hiddenDuration = Date.now() - lastVisibleRef.current;
        
        // If hidden for longer than threshold, invalidate all queries
        if (hiddenDuration > staleThresholdMs) {
          console.log(`[VisibilityRefresh] Tab was hidden for ${Math.round(hiddenDuration / 1000)}s, invalidating queries`);
          queryClient.invalidateQueries();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      } else {
        // Track when we became hidden
        lastVisibleRef.current = Date.now();
      }
    };

    const handleFocus = () => {
      handleRefresh();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Handle bfcache restores
      if (event.persisted) {
        console.log('[VisibilityRefresh] Page restored from bfcache, invalidating queries');
        queryClient.invalidateQueries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [queryClient, staleThresholdMs]);
};
