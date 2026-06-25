import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

type Channel = 'sms' | 'email' | 'appointment' | 'invoice';

const CHANNEL_ACTION_TYPES: Record<Channel, string[]> = {
  sms: ['draft_sms'],
  email: ['draft_email'],
  appointment: ['create_appointment'],
  invoice: ['draft_invoice'],
};

interface Props {
  channel: Channel;
  title?: string;
}

export function PendingAuraDraftsPanel({ channel, title }: Props) {
  const { companyId } = useAuth();
  const qc = useQueryClient();
  const types = CHANNEL_ACTION_TYPES[channel];

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['pending-aura-drafts', companyId, channel],
    enabled: !!companyId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_proposed_actions')
        .select('id, action_type, agent_id, status, payload, confidence, risk_tier, created_at, result_summary')
        .eq('company_id', companyId!)
        .in('action_type', types)
        .in('status', ['pending', 'auto_executed', 'approved', 'failed'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, op }: { id: string; op: 'approve' | 'reject' }) => {
      const { data, error } = await supabase.functions.invoke(`agent-action-executor?op=${op}`, {
        body: { id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.op === 'approve' ? 'Approved & sent to channel' : 'Rejected');
      qc.invalidateQueries({ queryKey: ['pending-aura-drafts'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Action failed'),
  });

  if (!companyId) return null;
  const items = drafts ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              {title ?? 'Pending Aura Drafts'}
            </CardTitle>
            <CardDescription>Drafts queued by Run-with-Aura workflows awaiting your review.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/automation" className="gap-1 text-xs">
              Full Queue <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((a: any) => {
          const summary =
            a.payload?.message || a.payload?.subject || a.payload?.label || a.action_type;
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-md border bg-background p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{a.agent_id}</Badge>
                  <Badge
                    variant={a.status === 'pending' ? 'secondary' : a.status === 'failed' ? 'destructive' : 'default'}
                    className="text-[10px]"
                  >
                    {a.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm truncate">{summary}</p>
                {a.result_summary && (
                  <p className="text-xs text-muted-foreground mt-0.5">{a.result_summary}</p>
                )}
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => review.mutate({ id: a.id, op: 'approve' })}
                    disabled={review.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => review.mutate({ id: a.id, op: 'reject' })}
                    disabled={review.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}