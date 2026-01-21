import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  // Never run PWA update logic inside an iframe (prevents controllerchange -> reload loops in embeds)
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (isIframe) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdate(true);
        }

        // Listen for new service workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Reload once to pick up the new bundle. We intentionally don't listen to
      // serviceWorker 'controllerchange' because it can cause reload loops in preview.
      setTimeout(() => window.location.reload(), 250);
    }
  };

  // Nothing should render in iframe context.
  if (isIframe) return null;
  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-fade-in">
      <div className="guide-card dark-surface-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-card-foreground">Update Available</p>
            <p className="text-xs text-card-foreground/70 mt-0.5">
              A new version is ready. Tap to refresh.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setShowUpdate(false)}
          >
            Later
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleUpdate}
          >
            Update Now
          </Button>
        </div>
      </div>
    </div>
  );
}
