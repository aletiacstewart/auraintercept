import { useEffect, useRef } from 'react';

// Track recent user interaction so we don't reload mid-action.
let lastInteractionAt = Date.now();
let lastRouteChangeAt = Date.now();
if (typeof window !== 'undefined') {
  const bump = () => { lastInteractionAt = Date.now(); };
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach((evt) => {
    window.addEventListener(evt, bump, { passive: true });
  });

  // Treat SPA navigations as activity so a reload never interrupts a click-through.
  const bumpRoute = () => { lastRouteChangeAt = Date.now(); };
  window.addEventListener('popstate', bumpRoute);
  try {
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      bumpRoute();
      return origPush.apply(this, args as Parameters<typeof origPush>);
    };
    window.history.replaceState = function (...args) {
      bumpRoute();
      return origReplace.apply(this, args as Parameters<typeof origReplace>);
    };
  } catch {
    // ignore — non-fatal
  }
}

const isUserActive = (idleMs = 30_000) =>
  Date.now() - lastInteractionAt < idleMs;

const isRouteChanging = (windowMs = 15_000) =>
  Date.now() - lastRouteChangeAt < windowMs;

const hasOpenModal = () => {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-state="open"][data-radix-popper-content-wrapper]'
  );
};

const isDemoSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = Object.keys(window.localStorage).find((k) => k.includes('-auth-token'));
    if (!raw) return false;
    const v = window.localStorage.getItem(raw);
    if (!v) return false;
    const parsed = JSON.parse(v);
    return !!parsed?.user?.user_metadata?.aura_demo_trial;
  } catch {
    return false;
  }
};

const isSwitching = () => {
  if (typeof window === 'undefined') return false;
  try {
    return !!sessionStorage.getItem('aura_super_switcher_switching');
  } catch {
    return false;
  }
};

// Routes where an involuntary reload would interrupt a real task (auth, billing,
// dashboards, customer portals, technician PWA, onboarding flows). On these we
// never auto-reload; the user can pick up the new bundle on next manual navigation
// or via the PWAUpdatePrompt banner.
const NEVER_RELOAD_PATH_PREFIXES = [
  '/dashboard',
  '/customer',
  '/technician',
  '/auth',
  '/signin',
  '/signup',
  '/onboarding',
  '/intake',
  '/checkout',
  '/subscription',
  '/demo',
  '/super-switcher',
];

const isProtectedRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '/';
  return NEVER_RELOAD_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path === p);
};

const hasActiveSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    const key = Object.keys(window.localStorage).find((k) => k.includes('-auth-token'));
    if (!key) return false;
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.access_token || !!parsed?.currentSession?.access_token;
  } catch {
    return false;
  }
};

const shouldDeferReload = () =>
  isDemoSession() ||
  isSwitching() ||
  isUserActive() ||
  isRouteChanging() ||
  hasOpenModal() ||
  isProtectedRoute() ||
  hasActiveSession();

/**
 * Hook that detects when a new frontend bundle has been deployed
 * and automatically reloads the page to pick up the latest changes.
 * 
 * This is especially useful in the Lovable preview iframe where
 * React Query's refetchOnWindowFocus doesn't reliably trigger.
 */
export const useDeploymentAutoReload = (pollIntervalMs: number = 60000) => {
  const lastSignatureRef = useRef<string | null>(null);
  const consecutiveMatchRef = useRef<number>(0);
  const hasReloadedRef = useRef<boolean>(false);
  const failureCountRef = useRef<number>(0);

  useEffect(() => {
    // Only run in production. In dev/preview, Vite HMR + Lovable's own preview
    // refresh handle bundle changes; a second reload loop here just causes
    // surprise full-page refreshes mid-navigation.
    if (!import.meta.env.PROD) {
      return;
    }

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
          
          if (consecutiveMatchRef.current >= 5) {
            // Store signature to prevent reload loops
            const reloadedSignature = sessionStorage.getItem('lastReloadedSignature');
            if (reloadedSignature === newSignature) {
              // We already reloaded for this signature, don't loop
              console.log('[DeploymentAutoReload] Already reloaded for this signature, skipping');
              return;
            }

            if (shouldDeferReload()) {
              // Don't disrupt an active demo / user interaction / open modal.
              // We'll retry on the next poll tick.
              console.log('[DeploymentAutoReload] Deferring reload (user active / demo / modal open)');
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

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollIntervalMs]);
};

// NOTE: previously this module also auto-reloaded on Vite HMR `ws:connect`
// events in production, which fired on transient WebSocket hiccups and
// reloaded authenticated dashboards mid-session. Removed — the polling path
// above (with shouldDeferReload guards) is enough.
