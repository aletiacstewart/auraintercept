import { useEffect, useRef } from 'react';

/**
 * Hook that detects when a new frontend bundle has been deployed
 * and automatically reloads the page to pick up the latest changes.
 * 
 * This is especially useful in the Lovable preview iframe where
 * React Query's refetchOnWindowFocus doesn't reliably trigger.
 */
export const useDeploymentAutoReload = (pollIntervalMs: number = 20000) => {
  const lastSignatureRef = useRef<string | null>(null);
  const consecutiveMatchRef = useRef<number>(0);
  const hasReloadedRef = useRef<boolean>(false);
  const failureCountRef = useRef<number>(0);

  useEffect(() => {
    // Get the current build signature from the DOM
    const getCurrentSignature = (): string | null => {
      const scripts = document.querySelectorAll('script[type="module"][src]');
      const links = document.querySelectorAll('link[rel="stylesheet"][href]');
      
      const scriptSrcs = Array.from(scripts)
        .map(s => s.getAttribute('src'))
        .filter(Boolean)
        .sort()
        .join('|');
      
      const linkHrefs = Array.from(links)
        .map(l => l.getAttribute('href'))
        .filter(Boolean)
        .sort()
        .join('|');
      
      return scriptSrcs + '::' + linkHrefs;
    };

    // Extract signature from fetched HTML
    const extractSignatureFromHtml = (html: string): string | null => {
      const scriptMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/g);
      const linkMatch = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g);
      
      const scriptSrcs = (scriptMatch || [])
        .map(s => {
          const match = s.match(/src="([^"]+)"/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
        .sort()
        .join('|');
      
      const linkHrefs = (linkMatch || [])
        .map(l => {
          const match = l.match(/href="([^"]+)"/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
        .sort()
        .join('|');
      
      return scriptSrcs + '::' + linkHrefs;
    };

    // Initialize with current signature
    if (!lastSignatureRef.current) {
      lastSignatureRef.current = getCurrentSignature();
    }

    const checkForUpdate = async () => {
      // Don't poll if the tab/iframe is hidden
      if (document.visibilityState === 'hidden') {
        return;
      }

      // Don't check again if we've already triggered a reload
      if (hasReloadedRef.current) {
        return;
      }

      try {
        // Fetch the latest index.html with cache busting
        const response = await fetch(`/?_ts=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const newSignature = extractSignatureFromHtml(html);

        if (!newSignature) {
          return;
        }

        // Reset failure count on success
        failureCountRef.current = 0;

        // Compare with the currently loaded signature
        const currentSignature = getCurrentSignature();
        
        if (newSignature !== currentSignature) {
          // New deployment detected!
          // Use consecutive match to avoid reload on transient differences
          consecutiveMatchRef.current++;
          
          if (consecutiveMatchRef.current >= 2) {
            // Store signature to prevent reload loops
            const reloadedSignature = sessionStorage.getItem('lastReloadedSignature');
            if (reloadedSignature === newSignature) {
              // We already reloaded for this signature, don't loop
              console.log('[DeploymentAutoReload] Already reloaded for this signature, skipping');
              return;
            }

            console.log('[DeploymentAutoReload] New deployment detected, reloading...');
            sessionStorage.setItem('lastReloadedSignature', newSignature);
            hasReloadedRef.current = true;
            window.location.reload();
          }
        } else {
          // Signatures match, reset counter
          consecutiveMatchRef.current = 0;
        }
      } catch (error) {
        // Increment failure count and use backoff
        failureCountRef.current++;
        
        if (failureCountRef.current > 5) {
          console.log('[DeploymentAutoReload] Too many failures, will retry later');
        }
      }
    };

    // Calculate interval with backoff on failures
    const getInterval = () => {
      if (failureCountRef.current > 5) {
        return pollIntervalMs * 3; // Triple the interval after many failures
      }
      if (failureCountRef.current > 2) {
        return pollIntervalMs * 2; // Double the interval after some failures
      }
      return pollIntervalMs;
    };

    // Start polling
    let intervalId: ReturnType<typeof setInterval>;
    
    const startPolling = () => {
      intervalId = setInterval(checkForUpdate, getInterval());
    };

    // Initial check after a short delay
    const timeoutId = setTimeout(() => {
      checkForUpdate();
      startPolling();
    }, 5000);

    // Pause/resume polling based on visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check immediately when becoming visible
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle Vite HMR reconnection events
    const handleViteReconnect = () => {
      console.log('[DeploymentAutoReload] Vite reconnected, reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    if (import.meta.hot) {
      import.meta.hot.on('vite:ws:connect', handleViteReconnect);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (import.meta.hot) {
        import.meta.hot.off('vite:ws:connect', handleViteReconnect);
      }
    };
  }, [pollIntervalMs]);
};
