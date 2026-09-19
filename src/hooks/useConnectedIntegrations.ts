import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionKey = 'calendar' | 'voice' | 'sms' | 'email' | 'crm' | 'payments';

export interface ConnectedIntegrations {
  /** Set of connection keys that are configured for this company. */
  connected: Set<ConnectionKey>;
  loading: boolean;
  /** Returns the required connections that are still missing. */
  missing: (required: string[]) => ConnectionKey[];
}

const LABELS: Record<ConnectionKey, string> = {
  calendar: 'Calendar',
  voice: 'Calls',
  sms: 'Texts',
  email: 'Email',
  crm: 'CRM',
  payments: 'Payments',
};

/** Plain-English name for a connection key, for use in "Needs X" messages. */
export const connectionLabel = (key: string) => LABELS[key as ConnectionKey] ?? key;

/**
 * Which core connections a company already has in place. Used to stop an agent
 * being switched on before the service it depends on exists.
 */
export function useConnectedIntegrations(companyId?: string | null): ConnectedIntegrations {
  const { data, isLoading } = useQuery({
    queryKey: ['connected-integrations', companyId],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      const [integ, calendar, crm] = await Promise.all([
        supabase
          .from('tenant_integrations_safe')
          .select('has_signalwire, has_resend, has_elevenlabs, has_stripe, signalwire_phone_number')
          .eq('company_id', companyId!)
          .maybeSingle(),
        supabase
          .from('google_calendar_connections')
          .select('id')
          .eq('company_id', companyId!)
          .eq('sync_enabled', true)
          .limit(1),
        supabase.from('crm_connections').select('status').eq('company_id', companyId!).limit(5),
      ]);

      const row = integ.data;
      const set = new Set<ConnectionKey>();
      const hasPhone = !!(row?.has_signalwire || row?.signalwire_phone_number);
      if ((calendar.data?.length ?? 0) > 0) set.add('calendar');
      if (hasPhone || row?.has_elevenlabs) set.add('voice');
      if (hasPhone) set.add('sms');
      if (row?.has_resend) set.add('email');
      if (row?.has_stripe) set.add('payments');
      if ((crm.data ?? []).some((c) => c.status === 'connected')) set.add('crm');
      return [...set];
    },
  });

  const connected = new Set<ConnectionKey>((data ?? []) as ConnectionKey[]);

  return {
    connected,
    loading: isLoading,
    missing: (required: string[]) =>
      (required as ConnectionKey[]).filter((r) => LABELS[r] && !connected.has(r)),
  };
}
