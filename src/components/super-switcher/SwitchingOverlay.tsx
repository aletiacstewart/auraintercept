import { useEffect, useState } from 'react';
import { Loader2, Crown } from 'lucide-react';
import { isSuperSwitcherSwitching } from '@/hooks/useSuperSwitcher';

export function SwitchingOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isSuperSwitcherSwitching());
    const onChange = () => setShow(isSuperSwitcherSwitching());
    window.addEventListener('super-switcher:switching', onChange);
    // Auto-clear shortly after a fresh page load — by this point the new
    // session has hydrated and the destination route is mounted.
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aura_super_switcher_switching');
        setShow(false);
      }
    }, 600);
    return () => {
      window.removeEventListener('super-switcher:switching', onChange);
      clearTimeout(t);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <Crown className="w-10 h-10 text-primary" />
          <Loader2 className="w-5 h-5 absolute -bottom-1 -right-1 animate-spin text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">Switching demo…</p>
        <p className="text-xs text-muted-foreground">Loading the next experience</p>
      </div>
    </div>
  );
}