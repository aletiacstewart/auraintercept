import { useEffect, useState } from 'react';

export type DashboardViewMode = 'simple' | 'pro';

const STORAGE_KEY = 'aura.dashboard.view-mode';

/**
 * Persist a user's preferred dashboard density.
 *
 * - `simple` (default): hides power-user widgets, shows only the top-5 stats
 *   and the Aura command bar. Designed for SMB owners who don't want a wall
 *   of numbers.
 * - `pro`: surfaces every stat card, quick action, and metric panel.
 *
 * Stored in localStorage so the same person gets the same view across logins
 * on the same device. New users default to `simple`.
 */
export function useDashboardViewMode() {
  const [mode, setModeState] = useState<DashboardViewMode>(() => {
    if (typeof window === 'undefined') return 'simple';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'pro' ? 'pro' : 'simple';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = (next: DashboardViewMode) => setModeState(next);
  const toggle = () => setModeState((m) => (m === 'simple' ? 'pro' : 'simple'));

  return { mode, setMode, toggle, isSimple: mode === 'simple', isPro: mode === 'pro' };
}
