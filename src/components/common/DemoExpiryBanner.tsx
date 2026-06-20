import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoSession } from '@/hooks/useDemoSession';
import { supabase } from '@/integrations/supabase/client';

export function DemoExpiryBanner() {
  const { isDemo, msRemaining, expired } = useDemoSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (expired) {
      supabase.auth.signOut().finally(() => navigate('/for-business?expired=1', { replace: true }));
    }
  }, [expired, navigate]);

  if (!isDemo) return null;

  const days = Math.floor(msRemaining / 86400000);
  const hrs = Math.floor((msRemaining % 86400000) / 3600000);
  const mins = Math.floor((msRemaining % 3600000) / 60000);
  const remainingLabel = days > 0 ? `${days}d ${hrs}h` : hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  return (
    <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/15 border-b border-primary/30 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-medium">Live Demo</span>
        <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Expires in {remainingLabel}
        </span>
      </div>
      <Button size="sm" variant="default" onClick={() => navigate('/auth?mode=company')}>
        Upgrade to keep your data
      </Button>
    </div>
  );
}
