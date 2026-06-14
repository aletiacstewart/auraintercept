import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerInteractionEvent {
  kind: 'ai_context' | 'call' | 'sms' | 'agent_action';
  occurred_at: string;
  agent: string | null;
  summary: string | null;
  payload: Record<string, any> | null;
  context_id: string | null;
}

interface Args {
  companyId?: string | null;
  email?: string | null;
  phone?: string | null;
  limit?: number;
  enabled?: boolean;
}

/**
 * Returns a merged, time-ordered history of every AI chat, voice call,
 * and SMS the customer has had with this company. Used to prefill
 * quote/invoice forms and surface "what the AI already knows" panels.
 */
export function useCustomerInteractionHistory({
  companyId,
  email,
  phone,
  limit = 25,
  enabled = true,
}: Args) {
  const normEmail = (email || '').trim().toLowerCase() || null;
  const normPhone = (phone || '').trim() || null;
  const hasIdentity = Boolean(normEmail || normPhone);

  return useQuery({
    queryKey: ['customer-interaction-history', companyId, normEmail, normPhone, limit],
    enabled: enabled && !!companyId && hasIdentity,
    staleTime: 30_000,
    queryFn: async (): Promise<CustomerInteractionEvent[]> => {
      const { data, error } = await supabase.rpc('get_customer_interaction_history', {
        p_company_id: companyId!,
        p_email: normEmail,
        p_phone: normPhone,
        p_limit: limit,
      });
      if (error) throw error;
      return (data || []) as CustomerInteractionEvent[];
    },
  });
}

/** Derive items the agent discussed (services, prices) from the latest AI context. */
export function deriveDiscussedItems(history: CustomerInteractionEvent[] | undefined) {
  if (!history?.length) return [] as Array<{ description: string; quantity: number; unit_price: number }>;
  const ctx = history.find((h) => h.kind === 'ai_context');
  const items = ctx?.payload?.context_data?.items_discussed;
  if (!Array.isArray(items)) return [];
  return items
    .filter((it: any) => it && (it.description || it.name))
    .map((it: any) => ({
      description: String(it.description || it.name || '').slice(0, 200),
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price ?? it.price ?? 0) || 0,
    }));
}

/** Build a one-line note summarizing the most recent AI interaction. */
export function buildContextNote(history: CustomerInteractionEvent[] | undefined) {
  if (!history?.length) return '';
  const latest = history[0];
  const when = new Date(latest.occurred_at).toLocaleString();
  if (latest.kind === 'call') {
    return `From voice call on ${when}: ${latest.payload?.summary || latest.summary || ''}`.trim();
  }
  if (latest.kind === 'ai_context') {
    const intent = latest.payload?.context_data?.last_intent;
    return `From AI ${latest.agent || 'agent'} on ${when}${intent ? ` — intent: ${intent}` : ''}`;
  }
  if (latest.kind === 'sms') {
    return `From SMS on ${when}: ${latest.payload?.message?.slice(0, 160) || ''}`;
  }
  return `From ${latest.kind} on ${when}`;
}