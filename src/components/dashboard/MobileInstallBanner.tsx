import { useState, useEffect } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

/**
 * Compact banner shown on mobile viewports for first-time visitors.
 * Promotes one-tap PWA install. Dismissed for 7 days via localStorage.
 */
export function MobileInstallBanner() {
  const { isInstallable, isInstalled, promptInstall, dismissPrompt } = usePWAInstall();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile || !isInstallable || isInstalled) return null;

  return (
    <div className="md:hidden sticky top-0 z-40 bg-primary/10 border-b border-primary/20 px-3 py-2 flex items-center gap-2 animate-fade-in">
      <Smartphone className="h-4 w-4 text-primary shrink-0" />
      <span className="text-xs flex-1 text-foreground">
        Install Aura for faster access
      </span>
      <Button size="sm" onClick={promptInstall} className="h-7 gap-1 text-xs">
        <Download className="h-3 w-3" />
        Install
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={dismissPrompt}
        className="h-7 w-7 shrink-0"
        aria-label="Dismiss install banner"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
