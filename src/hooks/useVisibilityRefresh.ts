import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that detects when the page becomes visible after being hidden
 * and invalidates stale queries to ensure fresh data is displayed.
 * 
 * This helps the Lovable preview show the latest changes after code deploys.
 */
// Only these query-key prefixes are safe to refresh on visibility change.
// Auth / role / subscription / company queries are excluded so feature
// gates don't flip to "Upgrade Required" while data is refetching.
const REFRESHABLE_PREFIXES = [
  'notifications',
  'staff-notifications',
  'dashboard-metrics',
  'leads',
  'appointments',
  'jobs',
  'messages',
  'calls',
  'invoices',
  'quotes',
];

const hasOpenModal = () => {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
  );
};

export const useVisibilityRefresh = (staleThresholdMs: number = 300_000) => {
  const queryClient = useQueryClient();
  const lastVisibleRef = useRef(Date.now());

  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        const hiddenDuration = Date.now() - lastVisibleRef.current;
        
        // If hidden for longer than threshold, invalidate all queries
        if (hiddenDuration > staleThresholdMs) {
          if (hasOpenModal()) return;
          console.log(
            `[VisibilityRefresh] Tab was hidden for ${Math.round(hiddenDuration / 1000)}s, invalidating safe queries`
          );
          REFRESHABLE_PREFIXES.forEach((prefix) => {
            queryClient.invalidateQueries({ queryKey: [prefix] });
          });
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
        console.log('[VisibilityRefresh] Page restored from bfcache, invalidating safe queries');
        REFRESHABLE_PREFIXES.forEach((prefix) => {
          queryClient.invalidateQueries({ queryKey: [prefix] });
        });
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
