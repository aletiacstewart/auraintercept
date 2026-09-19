import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FirstStepId = 'business_type' | 'calendar' | 'communications' | 'team' | 'test_workflow';

export interface FirstStep {
  id: FirstStepId;
  title: string;
  description: string;
  /** Where the user goes to actually do it. */
  href: string;
  actionLabel: string;
  optional?: boolean;
  done: boolean;
  skipped: boolean;
}

interface FirstStepsState {
  skipped?: FirstStepId[];
  dismissed?: boolean;
  celebrated?: boolean;
}

interface OnboardingContextValue {
  loading: boolean;
  steps: FirstStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  /** All steps either done or skipped. */
  isComplete: boolean;
  /** Dashboard is never blocked — this only drives the nudge/auto-open. */
  shouldPrompt: boolean;
  dismissed: boolean;
  celebrated: boolean;
  skipStep: (id: FirstStepId) => Promise<void>;
  unskipStep: (id: FirstStepId) => Promise<void>;
  dismiss: () => Promise<void>;
  markCelebrated: () => Promise<void>;
  refresh: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const STEP_DEFS: Array<Omit<FirstStep, 'done' | 'skipped'>> = [
  {
    id: 'business_type',
    title: 'Tell us what your business does',
    description: 'Your industry decides which tools, wording and AI agents you see.',
    href: '/dashboard/settings?tab=company',
    actionLabel: 'Choose industry',
  },
  {
    id: 'calendar',
    title: 'Connect your calendar',
    description: 'So new bookings land straight in the calendar you already use.',
    href: '/dashboard/integrations?open=google_calendar',
    actionLabel: 'Connect calendar',
  },
  {
    id: 'communications',
    title: 'Turn on calls, texts and email',
    description: 'Let Aura answer the phone, send reminders and confirmations.',
    href: '/dashboard/integrations',
    actionLabel: 'Set up messaging',
  },
  {
    id: 'team',
    title: 'Add your team',
    description: 'Invite the people who take jobs and answer customers. Skip if it is just you.',
    href: '/dashboard/employees',
    actionLabel: 'Add team',
    optional: true,
  },
  {
    id: 'test_workflow',
    title: 'Try it once',
    description: 'Book a test appointment or create a test quote to see the whole flow.',
    href: '/dashboard/appointments',
    actionLabel: 'Run a test',
  },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<FirstStepsState>({});
  const [signals, setSignals] = useState<Record<FirstStepId, boolean>>({
    business_type: false,
    calendar: false,
    communications: false,
    team: false,
    test_workflow: false,
  });
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id || !companyId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [profileRes, companyRes, calendarRes, integrationsRes, teamRes, apptRes, quoteRes] = await Promise.all([
        supabase.from('profiles').select('first_steps_state').eq('id', user.id).maybeSingle(),
        supabase.from('companies').select('industry_vertical').eq('id', companyId).maybeSingle(),
        supabase
          .from('google_calendar_connections')
          .select('id')
          .eq('company_id', companyId)
          .eq('sync_enabled', true)
          .limit(1),
        supabase
          .from('tenant_integrations_safe')
          .select('has_signalwire, has_resend, signalwire_phone_number')
          .eq('company_id', companyId)
          .maybeSingle(),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      if (cancelled) return;

      const stored = (profileRes.data?.first_steps_state as FirstStepsState | null) || {};
      const integ = integrationsRes.data as
        | { has_signalwire?: boolean | null; has_resend?: boolean | null; signalwire_phone_number?: string | null }
        | null;

      setState(stored);
      setSignals({
        business_type: !!companyRes.data?.industry_vertical,
        calendar: (calendarRes.data?.length ?? 0) > 0,
        communications: !!(integ?.has_signalwire || integ?.has_resend || integ?.signalwire_phone_number),
        team: (teamRes.count ?? 0) > 1,
        test_workflow: (apptRes.count ?? 0) > 0 || (quoteRes.count ?? 0) > 0,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, companyId, nonce]);

  const persist = useCallback(
    async (next: FirstStepsState, progressPercent: number) => {
      setState(next);
      if (!user?.id) return;
      await supabase
        .from('profiles')
        .update({
          first_steps_state: next as never,
          onboarding_progress: progressPercent,
          ...(next.dismissed ? { onboarding_skipped_at: new Date().toISOString() } : {}),
        })
        .eq('id', user.id);
    },
    [user?.id],
  );

  const steps: FirstStep[] = useMemo(
    () =>
      STEP_DEFS.map((def) => ({
        ...def,
        done: signals[def.id],
        skipped: !signals[def.id] && (state.skipped ?? []).includes(def.id),
      })),
    [signals, state.skipped],
  );

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isComplete = steps.every((s) => s.done || s.skipped);

  const skipStep = useCallback(
    async (id: FirstStepId) => {
      const skipped = Array.from(new Set([...(state.skipped ?? []), id]));
      await persist({ ...state, skipped }, progressPercent);
    },
    [state, persist, progressPercent],
  );

  const unskipStep = useCallback(
    async (id: FirstStepId) => {
      const skipped = (state.skipped ?? []).filter((s) => s !== id);
      await persist({ ...state, skipped }, progressPercent);
    },
    [state, persist, progressPercent],
  );

  const dismiss = useCallback(async () => {
    await persist({ ...state, dismissed: true }, progressPercent);
  }, [state, persist, progressPercent]);

  const markCelebrated = useCallback(async () => {
    await persist({ ...state, celebrated: true }, progressPercent);
  }, [state, persist, progressPercent]);

  const value: OnboardingContextValue = {
    loading,
    steps,
    completedCount,
    totalCount,
    progressPercent,
    isComplete,
    shouldPrompt: !loading && !state.dismissed && !isComplete,
    dismissed: !!state.dismissed,
    celebrated: !!state.celebrated,
    skipStep,
    unskipStep,
    dismiss,
    markCelebrated,
    refresh,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
