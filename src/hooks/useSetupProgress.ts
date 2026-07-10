import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  Briefcase,
  MessageSquare,
  Bot,
  Globe,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

// Custom event name for setup progress refresh
export const SETUP_PROGRESS_REFRESH_EVENT = 'setup-progress-refresh';

/**
 * Dispatch an event to trigger a refresh of the SetupProgressBar
 * Call this after successfully saving any settings that affect setup completion
 */
export function triggerSetupProgressRefresh() {
  window.dispatchEvent(new CustomEvent(SETUP_PROGRESS_REFRESH_EVENT));
}

/**
 * Manually mark a setup step complete (or clear the override) for the current
 * company. Writes to `company_setup_step_overrides` and fires a refresh so
 * SetupProgressBar recomputes immediately.
 */
export async function setSetupStepOverride(
  companyId: string,
  stepId: string,
  completed: boolean,
): Promise<{ error: string | null }> {
  if (!companyId || !stepId) return { error: 'Missing company or step' };
  try {
    if (completed) {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('company_setup_step_overrides')
        .upsert(
          {
            company_id: companyId,
            step_id: stepId,
            completed_by: userData?.user?.id ?? null,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,step_id' },
        );
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from('company_setup_step_overrides')
        .delete()
        .eq('company_id', companyId)
        .eq('step_id', stepId);
      if (error) return { error: error.message };
    }
    triggerSetupProgressRefresh();
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  completed: boolean;
}

// Canonical 6-step first-run checklist. Kept small and outcome-oriented so a
// brand new company always sees a clear path to "live".
const FALLBACK_STEPS: SetupStep[] = [
  { id: 'business',       label: 'Business info',   description: 'Name, phone, address, hours',   icon: Building2,     href: '/dashboard/quick-setup?tab=company',        completed: false },
  { id: 'services',       label: 'Services',        description: 'List what you offer',           icon: Briefcase,     href: '/dashboard/knowledge?tab=services',         completed: false },
  { id: 'communications', label: 'Communications',  description: 'Phone or email sender',         icon: MessageSquare, href: '/dashboard/quick-setup?tab=communications', completed: false },
  { id: 'operatives',     label: 'AI Operatives',   description: 'Activate at least one agent',   icon: Bot,           href: '/dashboard/ai-agents',                       completed: false },
  { id: 'web-presence',   label: 'Web presence',    description: 'Create your smart website',     icon: Globe,         href: '/dashboard/smart-website',                   completed: false },
  { id: 'go-live',        label: 'Go live',         description: 'Publish so customers can find you', icon: Rocket,     href: '/dashboard/smart-website?tab=publish',       completed: false },
];

export interface SetupProgressState {
  loading: boolean;
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

export function useSetupProgress(): SetupProgressState {
  const { companyId } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>(FALLBACK_STEPS);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener(SETUP_PROGRESS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(SETUP_PROGRESS_REFRESH_EVENT, handleRefresh);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!companyId) {
        // No company yet — still render the canonical checklist as all-incomplete.
        if (!cancelled) {
          setSteps(FALLBACK_STEPS);
          setLoading(false);
        }
        return;
      }
      setLoading(true);

      try {
        const [companyRes, servicesRes, hoursRes, agentsRes, siteRes, integrationsRes, overridesRes] = await Promise.all([
          supabase.from('companies').select('name, contact_phone, business_phone, contact_address, address, public_app_url').eq('id', companyId).maybeSingle(),
          supabase.from('services').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('business_hours').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('ai_agent_configs').select('id, is_enabled').eq('company_id', companyId),
          supabase.from('smart_websites').select('id, is_published').eq('company_id', companyId).maybeSingle(),
          supabase.from('tenant_integrations').select('signalwire_phone_number, resend_api_key').eq('company_id', companyId).maybeSingle(),
          supabase.from('company_setup_step_overrides').select('step_id').eq('company_id', companyId),
        ]);

        const company = companyRes.data as any;
        const integrations = integrationsRes.data as any;
        const site = siteRes.data as any;
        const overrideSet = new Set<string>(
          ((overridesRes.data as Array<{ step_id: string }> | null) ?? []).map((r) => r.step_id),
        );

        const businessComplete = !!(
          company?.name &&
          (company?.contact_phone || company?.business_phone) &&
          (company?.contact_address || company?.address) &&
          (hoursRes.count || 0) > 0
        );

        const servicesComplete = (servicesRes.count || 0) > 0;

        const commsComplete = !!(
          (integrations?.signalwire_phone_number && integrations.signalwire_phone_number.trim() !== '') ||
          (integrations?.resend_api_key && integrations.resend_api_key.trim() !== '')
        );

        const operativesComplete = (agentsRes.data || []).some((a: any) => a.is_enabled);

        const webComplete = !!site?.id;
        const liveComplete = !!(site?.is_published || company?.public_app_url);

        const nextSteps: SetupStep[] = FALLBACK_STEPS.map((s) => {
          // Manual override always wins — admins can mark a step done even if
          // the derived signal doesn't reflect it yet.
          if (overrideSet.has(s.id)) return { ...s, completed: true };
          switch (s.id) {
            case 'business':       return { ...s, completed: businessComplete };
            case 'services':       return { ...s, completed: servicesComplete };
            case 'communications': return { ...s, completed: commsComplete };
            case 'operatives':     return { ...s, completed: operativesComplete };
            case 'web-presence':   return { ...s, completed: webComplete };
            case 'go-live':        return { ...s, completed: liveComplete };
            default:               return s;
          }
        });

        if (!cancelled) setSteps(nextSteps);
      } catch (err) {
        console.error('useSetupProgress failed:', err);
        // On failure, keep the canonical incomplete checklist rather than "0 of 0".
        if (!cancelled) setSteps(FALLBACK_STEPS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [companyId, refreshKey]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return { loading, steps, completedCount, totalCount, progressPercent };
}
