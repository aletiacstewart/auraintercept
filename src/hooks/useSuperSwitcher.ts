import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SUPER_ADMIN_EMAIL = 'superadmin@auraintercept.ai';
export const DEMO_PASSWORD = 'aidemo*!';
export const SUPER_FLAG_KEY = 'aura_super_switcher_active';
export const SUPER_LAST_INDUSTRY = 'aura_super_switcher_industry';
const SUPER_SESSION_KEY = 'aura_super_switcher_session';

export type SwitchRole = 'company' | 'employee' | 'customer';

export function industryToEmail(industryKey: string, role: SwitchRole): string {
  const stripped = industryKey.replace(/_/g, '');
  const suffix = role === 'company' ? 'admin' : role;
  return `${stripped}${suffix}@demo.com`;
}

export function emailToIndustry(email: string | null | undefined): { industry: string; role: SwitchRole } | null {
  if (!email || !email.endsWith('@demo.com')) return null;
  const local = email.replace('@demo.com', '');
  const m = local.match(/^(.*?)(admin|employee|customer)$/);
  if (!m) return null;
  return { industry: m[1], role: m[2] === 'admin' ? 'company' : (m[2] as SwitchRole) };
}

const ROLE_PATH: Record<SwitchRole, string> = {
  company: '/dashboard',
  employee: '/technician',
  customer: '/customer',
};

export function useSuperSwitcher() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const enter = useCallback(async (industryKey: string, role: SwitchRole) => {
    const email = industryToEmail(industryKey, role);
    try {
      // Capture current super-admin session so we can restore it on exit (no password needed)
      const { data: { session: current } } = await supabase.auth.getSession();
      if (current && current.user?.email === SUPER_ADMIN_EMAIL) {
        localStorage.setItem(SUPER_SESSION_KEY, JSON.stringify({
          access_token: current.access_token,
          refresh_token: current.refresh_token,
        }));
      }
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
      if (error) throw error;
      localStorage.setItem(SUPER_FLAG_KEY, '1');
      localStorage.setItem(SUPER_LAST_INDUSTRY, industryKey);
      window.location.assign(ROLE_PATH[role]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Switch failed';
      toast({ title: 'Could not switch', description: `${email}: ${msg}`, variant: 'destructive' });
    }
  }, [toast]);

  const exit = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      const stashed = localStorage.getItem(SUPER_SESSION_KEY);
      localStorage.removeItem(SUPER_FLAG_KEY);
      if (stashed) {
        const { access_token, refresh_token } = JSON.parse(stashed);
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        localStorage.removeItem(SUPER_SESSION_KEY);
        if (!error) {
          window.location.assign('/super-switcher');
          return;
        }
      }
      // Fallback: ask for re-login
      navigate('/auth?mode=platform_admin&tab=login');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Exit failed';
      toast({ title: 'Could not exit', description: msg, variant: 'destructive' });
    }
  }, [navigate, toast]);

  return { enter, exit };
}

export function isSuperSwitcherActive(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SUPER_FLAG_KEY) === '1';
}