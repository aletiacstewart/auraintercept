import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface DemoSession {
  isDemo: boolean;
  expiresAt: Date | null;
  msRemaining: number;
  expired: boolean;
}

export function useDemoSession(): DemoSession {
  const { user } = useAuth();
  const meta = (user?.user_metadata || {}) as { aura_demo_trial?: boolean; aura_demo_expires_at?: string };
  const isDemo = !!meta.aura_demo_trial;
  const expiresAt = meta.aura_demo_expires_at ? new Date(meta.aura_demo_expires_at) : null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isDemo) return;
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [isDemo]);

  const msRemaining = expiresAt ? expiresAt.getTime() - now : 0;
  return {
    isDemo,
    expiresAt,
    msRemaining: Math.max(0, msRemaining),
    expired: isDemo && msRemaining <= 0,
  };
}
