import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { findAgentDefinition } from '@/lib/agentCatalog';
import { BellRing, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface IssueRow {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  metadata: Record<string, any> | null;
}

function agentLabel(type: string | null): string {
  if (!type) return 'Platform';
  return findAgentDefinition(type)?.name ?? type;
}

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

/**
 * Open agent-health alerts for this company — rows the alert rules in
 * `agent-alerts.ts` raise into `platform_issues` (issue_type='ai_agent_error').
 * Acknowledge an alert, or resolve it once handled.
 */
export function AgentAlerts({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: issues, isLoading } = useQuery<IssueRow[]>({
    queryKey: ['agent-alerts', companyId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_issues')
        .select('id, title, description, severity, status, created_at, resolved_at, metadata')
        .eq('company_id', companyId)
        .eq('issue_type', 'ai_agent_error')
        .in('status', ['new', 'acknowledged', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as IssueRow[];
    },
  });

  const update = async (id: string, status: 'acknowledged' | 'resolved') => {
    setBusy(id);
    try {
      const patch: Record<string, unknown> = { status };
      if (status === 'resolved') {
        patch.resolved_at = new Date().toISOString();
        patch.resolution_notes = 'Resolved from the Agents observability panel.';
      }
      const { error } = await supabase
        .from('platform_issues')
        .update(patch as any)
        .eq('id', id);
      if (error) throw error;
      toast.success(status === 'resolved' ? 'Alert resolved' : 'Alert acknowledged');
      qc.invalidateQueries({ queryKey: ['agent-alerts', companyId] });
      qc.invalidateQueries({ queryKey: ['agent-health-metrics', companyId] });
    } catch (e: any) {
      toast.error(e?.message || 'Could not update the alert');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Open alerts</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => qc.invalidateQueries({ queryKey: ['agent-alerts', companyId] })}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !issues || issues.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Check className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No open agent alerts.</p>
          <p className="text-xs">
            Alerts appear here when an agent's error rate, latency or silence
            crosses a threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((i) => {
            const agentType = (i.metadata as any)?.agent_type ?? null;
            const rule = (i.metadata as any)?.rule_id ?? null;
            return (
              <div key={i.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={SEVERITY_VARIANT[i.severity] ?? 'outline'}
                        className="text-xs capitalize"
                      >
                        {i.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {agentLabel(agentType)}
                      </Badge>
                      {rule && (
                        <span className="text-xs text-muted-foreground">
                          rule: {rule}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">{i.title}</p>
                    {i.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {i.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(i.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {i.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === i.id}
                        onClick={() => update(i.id, 'acknowledged')}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={busy === i.id}
                      onClick={() => update(i.id, 'resolved')}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
