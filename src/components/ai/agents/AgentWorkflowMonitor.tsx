import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Zap,
  Users,
  Truck,
  Briefcase,
  Megaphone,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';

interface AgentEvent {
  id: string;
  source_agent: string;
  target_agent: string | null;
  event_type: string;
  payload: any;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  triage: Users,
  booking: Users,
  followup: Users,
  review: Users,
  dispatch: Truck,
  route: Truck,
  eta: Truck,
  checkin: Truck,
  quoting: Briefcase,
  invoice: Briefcase,
  inventory: Briefcase,
  admin: Briefcase,
  campaign: Megaphone,
  lead: Megaphone,
  marketing: Megaphone,
  insights: BarChart3,
  forecast: BarChart3,
  performance: BarChart3,
  revenue: BarChart3,
  creative: Zap,
  web_presence: Zap,
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: 'bg-yellow-500', icon: Clock },
  processing: { color: 'bg-blue-500', icon: Activity },
  processed: { color: 'bg-green-500', icon: CheckCircle2 },
  failed: { color: 'bg-red-500', icon: XCircle },
};

interface AgentWorkflowMonitorProps {
  companyId: string;
}

export function AgentWorkflowMonitor({ companyId }: AgentWorkflowMonitorProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchEvents();
    
    // Subscribe to real-time events
    const channel = supabase
      .channel('agent-events-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agent_events',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [payload.new as AgentEvent, ...prev].slice(0, 100));
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => 
              prev.map(e => e.id === (payload.new as AgentEvent).id ? payload.new as AgentEvent : e)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_agent_events')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setEvents(data as AgentEvent[]);
    }
    setLoading(false);
  };

  const filteredEvents = events.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      e.source_agent?.toLowerCase().includes(q) ||
      (e.target_agent || '').toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    processed: events.filter(e => e.status === 'processed').length,
    failed: events.filter(e => e.status === 'failed').length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Workflow Monitor
            </CardTitle>
            <CardDescription>Real-time operative events and handoffs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`p-3 rounded-lg border transition-colors ${filter === 'all' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-lg border transition-colors ${filter === 'pending' ? 'bg-yellow-500/10 border-yellow-500' : 'hover:bg-muted'}`}
          >
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </button>
          <button
            onClick={() => setFilter('processed')}
            className={`p-3 rounded-lg border transition-colors ${filter === 'processed' ? 'bg-green-500/10 border-green-500' : 'hover:bg-muted'}`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`p-3 rounded-lg border transition-colors ${filter === 'failed' ? 'bg-red-500/10 border-red-500' : 'hover:bg-muted'}`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </button>
        </div>

        {/* Search */}
        <div className="mb-3">
          <Input
            placeholder="Search by agent or event type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9"
          />
        </div>

        {/* Events List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mb-2" />
                <p>No events found</p>
                <p className="text-sm">Agent events will appear here in real-time</p>
              </div>
            ) : (
              pagedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {filteredEvents.length > pageSize && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false);
  const SourceIcon = AGENT_ICONS[event.source_agent] || Zap;
  const TargetIcon = event.target_agent ? AGENT_ICONS[event.target_agent] || Zap : null;
  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
        
        {/* Source Agent */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <SourceIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{event.source_agent}</span>
        </div>

        {/* Arrow and Target */}
        {event.target_agent && (
          <>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 min-w-[100px]">
              {TargetIcon && <TargetIcon className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-medium capitalize">{event.target_agent}</span>
            </div>
          </>
        )}

        {/* Event Type Badge */}
        <Badge variant="outline" className="ml-auto">
          {event.event_type.replace(/_/g, ' ')}
        </Badge>

        {/* Status Badge */}
        <Badge 
          variant={event.status === 'processed' ? 'default' : event.status === 'failed' ? 'destructive' : 'secondary'}
          className="flex items-center gap-1"
        >
          <StatusIcon className="h-3 w-3" />
          {event.status}
        </Badge>

        {/* Timestamp */}
        <span
          className="text-xs text-muted-foreground min-w-[80px] text-right"
          title={format(new Date(event.created_at), "MMM d, yyyy · h:mm a")}
        >
          {format(new Date(event.created_at), 'MMM d, yyyy')}
          <span className="block text-[10px] opacity-70">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </span>
        </span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">{new Date(event.created_at).toLocaleString()}</span>
            </div>
            {event.processed_at && (
              <div>
                <span className="text-muted-foreground">Processed:</span>
                <span className="ml-2">{new Date(event.processed_at).toLocaleString()}</span>
              </div>
            )}
          </div>
          {event.error_message && (
            <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {event.error_message}
            </div>
          )}
          {event.payload && Object.keys(event.payload).length > 0 && (
            <div className="p-2 bg-muted rounded">
              <pre className="text-xs overflow-auto max-h-[200px]">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
