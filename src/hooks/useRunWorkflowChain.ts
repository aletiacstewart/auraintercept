import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WorkflowChain, WorkflowAction } from '@/components/ui/workflow-chain-buttons';

/**
 * Hydrates string placeholders like {{customer_name}} / {{lead_phone}} /
 * {{company_name}} / {{appointment_time}} inside a payload template.
 */
function hydrate(value: unknown, ctx: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? `{{${k}}}`);
  }
  if (Array.isArray(value)) return value.map((v) => hydrate(v, ctx));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = hydrate(v, ctx);
    }
    return out;
  }
  return value;
}

/** Pulls minimal company + latest lead / customer / appointment context. */
async function loadContext(companyId: string): Promise<Record<string, string>> {
  const ctx: Record<string, string> = {
    company_name: 'your business',
    customer_name: 'the customer',
    lead_name: 'the lead',
    lead_phone: '',
    lead_email: '',
    appointment_time: 'the scheduled time',
    invoice_total: '0.00',
  };

  const [company, lead, customer, appt] = await Promise.all([
    supabase.from('companies').select('name').eq('id', companyId).maybeSingle(),
    supabase.from('leads').select('name, phone, email').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('customers').select('first_name, last_name, phone, email').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('appointments').select('customer_name, datetime').eq('company_id', companyId).order('datetime', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (company.data?.name) ctx.company_name = company.data.name;
  if (lead.data) {
    ctx.lead_name = lead.data.name ?? ctx.lead_name;
    ctx.lead_phone = (lead.data as any).phone ?? '';
    ctx.lead_email = (lead.data as any).email ?? '';
    ctx.customer_name = lead.data.name ?? ctx.customer_name;
  }
  if (customer.data) {
    const full = [customer.data.first_name, customer.data.last_name].filter(Boolean).join(' ').trim();
    if (full) ctx.customer_name = full;
  }
  if (appt.data?.datetime) {
    try {
      ctx.appointment_time = new Date(appt.data.datetime as string).toLocaleString();
    } catch { /* ignore */ }
    if ((appt.data as any).customer_name) ctx.customer_name = (appt.data as any).customer_name;
  }
  return ctx;
}

export function useRunWorkflowChain() {
  const { companyId } = useAuth();
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async (chain: WorkflowChain) => {
    if (!companyId) {
      toast.error('Sign in to run workflows.');
      return;
    }
    if (!chain.actions || chain.actions.length === 0) {
      toast.info('No structured actions defined for this workflow yet.');
      return;
    }
    setIsRunning(true);
    const ctx = await loadContext(companyId);
    const runId = crypto.randomUUID();
    let queued = 0;
    let auto = 0;
    let failed = 0;

    for (const action of chain.actions) {
      const payload = hydrate(action.payload, ctx) as Record<string, unknown>;
      try {
        const { data, error } = await supabase.functions.invoke('agent-action-executor', {
          body: {
            company_id: companyId,
            agent_id: action.agent_id,
            action_type: action.action_type,
            payload: { ...payload, channel: action.channel, label: action.label, workflow_id: chain.id, run_id: runId },
            risk_tier: action.risk_tier ?? 'low',
            confidence: action.confidence ?? 0.85,
            estimated_value_usd: action.est_value_usd ?? 0,
            requested_by_event: `workflow:${chain.id}`,
          },
        });
        if (error) throw error;
        const d = data as { decision?: string } | null;
        if (d?.decision === 'auto_executed') auto++;
        else queued++;
      } catch (e) {
        failed++;
        // eslint-disable-next-line no-console
        console.error('Workflow action failed', action, e);
      }
    }
    setIsRunning(false);

    if (failed === chain.actions.length) {
      toast.error('Workflow failed to queue any actions.');
    } else {
      toast.success(`${chain.label}`, {
        description: `${queued} draft${queued === 1 ? '' : 's'} for approval${auto ? `, ${auto} auto-executed` : ''}${failed ? `, ${failed} failed` : ''}. View in Automation Queue.`,
        action: { label: 'Open Queue', onClick: () => { window.location.href = '/dashboard/automation'; } },
      });
    }
    return { runId, queued, auto, failed };
  }, [companyId]);

  return { run, isRunning };
}