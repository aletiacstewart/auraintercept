import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { AuraAvatarChat } from './AuraAvatarChat';

/**
 * Floating bottom-right launcher for the live Aura voice/video avatar.
 * Sits next to the existing text chat widget (offset left so they don't overlap).
 */
export function AuraAvatarFloating() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <AuraAvatarChat variant="floating" onClose={() => setOpen(false)} />
        </div>
      )}
      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        className="fixed bottom-6 right-20 z-[9999] h-12 w-12 rounded-full shadow-lg"
        style={{ background: 'var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))' }}
        aria-label={open ? 'Close Aura avatar' : 'Open Aura avatar'}
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </Button>
    </>
  );
}

export default AuraAvatarFloating;