import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RunWithAuraConfirmDialog } from '@/components/ai/RunWithAuraConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type WorkflowSideEffectChannel =
  | 'sms'
  | 'email'
  | 'voice'
  | 'assignment'
  | 'calendar'
  | 'db'
  | 'none';

export interface WorkflowSideEffect {
  channel: WorkflowSideEffectChannel;
  description: string;
}

export interface WorkflowPreview {
  reads?: string[];
  writes?: string[];
  sideEffects?: WorkflowSideEffect[];
  estimatedVolume?: string;
}

export type WorkflowActionChannel = 'sms' | 'email' | 'appointment' | 'invoice' | 'task' | 'voice';

export interface WorkflowAction {
  /** Agent that owns this step (matches AGENTS list in Automation page). */
  agent_id: string;
  /** Side-effect type the executor knows how to perform. */
  action_type: 'draft_sms' | 'draft_email' | 'create_appointment' | 'draft_invoice' | 'task';
  channel: WorkflowActionChannel;
  /** Short human label shown in the run summary. */
  label: string;
  risk_tier?: 'low' | 'medium' | 'high';
  confidence?: number;
  est_value_usd?: number;
  /** Payload template — strings may contain {{customer_name}} / {{lead_phone}} / {{company_name}} placeholders. */
  payload: Record<string, unknown>;
}

export interface WorkflowChain {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  steps: string[];
  command: string;
  /** Optional route to the working surface for this workflow (e.g. /dashboard/quotes). */
  targetRoute?: string;
  /** Optional transparency metadata shown in the "Review before Aura runs" dialog. */
  preview?: WorkflowPreview;
  /** Optional structured actions; when present, Run with Aura writes real rows
   *  into agent_proposed_actions instead of only prompting Aura inline. */
  actions?: WorkflowAction[];
}

interface WorkflowChainButtonsProps {
  chains: WorkflowChain[];
  onTrigger: (chain: WorkflowChain) => void;
}

export const WorkflowChainButtons: React.FC<WorkflowChainButtonsProps> = ({ chains, onTrigger }) => {
  const navigate = useNavigate();
  const [pending, setPending] = React.useState<WorkflowChain | null>(null);
  const { companyId } = useAuth();
  const qc = useQueryClient();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['workflow-pending-actions', companyId],
    enabled: !!companyId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('agent_proposed_actions')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId!)
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  React.useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`wf-pending-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_proposed_actions', filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ['workflow-pending-actions', companyId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, qc]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Zap className="h-4 w-4 text-primary" />
          End-to-End Workflows
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => navigate('/dashboard/automation')}
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
          Review &amp; Approve Automation
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px]">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => (
          <Card
            key={chain.id}
            className="group border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all"
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <chain.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">{chain.label}</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{chain.description}</p>
              <div className="flex items-center gap-1 flex-wrap">
                {chain.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {step}
                    </span>
                    {i < chain.steps.length - 1 && (
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 text-xs flex-1"
                  onClick={() => setPending(chain)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Run with Aura
                </Button>
                {chain.targetRoute && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => navigate(chain.targetRoute!)}
                  >
                    Open Page
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <RunWithAuraConfirmDialog
        chain={pending}
        onCancel={() => setPending(null)}
        onConfirm={(chain) => {
          setPending(null);
          onTrigger(chain);
        }}
      />
    </div>
  );
};
