import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { findAgentDefinition } from '@/lib/agentCatalog';
import {
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Workflow,
} from 'lucide-react';
import { format } from 'date-fns';

interface EventRow {
  id: string;
  source_agent: string;
  target_agent: string | null;
  event_type: string;
  status: string;
  created_at: string;
  payload: Record<string, any>;
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'processed' | 'failed';

function agentLabel(type: string | null): string {
  if (!type) return 'broadcast';
  return findAgentDefinition(type)?.name ?? type;
}

/**
 * Company-wide agent event feed — the durable event bus in motion.
 * Shows every event announced (`pending`), claimed (`processing`) and
 * resolved (`processed`/`failed`) across all agents for this company.
 */
export function AgentEventFeed({ companyId }: { companyId: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchEvents = useCallback(async () => {
    let q = supabase
      .from('ai_agent_events')
      .select('id, source_agent, target_agent, event_type, status, created_at, payload')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(60);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, error } = await q;
    if (error) {
      console.error('event feed error', error);
      return;
    }
    setEvents((data ?? []) as EventRow[]);
    setLoading(false);
  }, [companyId, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    const interval = setInterval(fetchEvents, 10_000);
    const channel = supabase
      .channel('agent-event-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_agent_events', filter: `company_id=eq.${companyId}` },
        () => fetchEvents(),
      )
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    processed: 'default',
    failed: 'destructive',
    processing: 'secondary',
    pending: 'outline',
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Event flow</h3>
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'pending', 'processing', 'processed', 'failed'] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={fetchEvents}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Workflow className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No agent events yet.</p>
          <p className="text-xs">Events appear here as agents announce and pick up work.</p>
        </div>
      ) : (
        <ScrollArea className="h-[420px]">
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(e.status)}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {agentLabel(e.source_agent)}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {agentLabel(e.target_agent)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mt-1">{e.event_type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={statusVariant[e.status] ?? 'outline'} className="text-xs">
                      {e.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(e.created_at), 'MMM d, h:mm:ss a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
