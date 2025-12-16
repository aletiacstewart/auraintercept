import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface AgentEvent {
  id: string;
  source_agent: string;
  target_agent: string | null;
  event_type: string;
  payload: Record<string, any>;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface AgentEventLogProps {
  agentType: string;
  companyId: string | null;
}

export function AgentEventLog({ agentType, companyId }: AgentEventLogProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_agent_events')
        .select('*')
        .eq('company_id', companyId)
        .or(`source_agent.eq.${agentType},target_agent.eq.${agentType}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents((data || []) as AgentEvent[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime events
    if (!companyId) return;
    
    const channel = supabase
      .channel('agent-events-log')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agent_events',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, agentType]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      processed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline',
    };
    return variants[status] || 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Event Log</CardTitle>
          <CardDescription>
            Recent events involving this agent
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events recorded yet</p>
            <p className="text-sm">Events will appear here when the agent processes requests</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(event.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.source_agent}
                          </Badge>
                          {event.target_agent && (
                            <>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs">
                                {event.target_agent}
                              </Badge>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1">{event.event_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadge(event.status)} className="text-xs">
                        {event.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>

                  {expandedEvent === event.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Payload</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </div>
                        {event.processed_at && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Processed At
                            </p>
                            <p className="text-xs">
                              {format(new Date(event.processed_at), 'MMM d, yyyy h:mm:ss a')}
                            </p>
                          </div>
                        )}
                        {event.error_message && (
                          <div>
                            <p className="text-xs font-medium text-destructive mb-1">Error</p>
                            <p className="text-xs text-destructive">{event.error_message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
