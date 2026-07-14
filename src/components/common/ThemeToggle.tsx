import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'aura-marketing-theme';
const LIGHT_ROUTES = new Set(['/', '/for-business']);

function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null) || 'dark';
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}

/**
 * Marketing-only light/dark toggle.
 * - Only rendered on approved marketing routes (LIGHT_ROUTES).
 * - Persists to localStorage.
 * - Forces `dark` when navigating off approved routes so the dashboard,
 *   sign-in, blog, etc. always render in their intended dark theme.
 */
export function ThemeToggle() {
  const { pathname } = useLocation();
  const onLightRoute = LIGHT_ROUTES.has(pathname);

  useEffect(() => {
    if (onLightRoute) {
      applyTheme(getStoredTheme());
    } else {
      applyTheme('dark');
    }
    return () => {
      // On route change away from marketing pages, reset to dark.
      applyTheme('dark');
    };
  }, [onLightRoute, pathname]);

  if (!onLightRoute) return null;

  const current = getStoredTheme();
  const next: 'light' | 'dark' = current === 'light' ? 'dark' : 'light';

  const toggle = () => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="text-white hover:text-white hover:bg-white/10"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {current === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
}