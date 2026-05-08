import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Search, 
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  User,
  Bot
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';

interface ConversationEvent {
  id: string;
  source_agent: string;
  target_agent: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface ConversationHistoryBrowserProps {
  companyId: string;
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Booking Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  dispatch: 'Dispatch/GPS Console',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  marketing: 'Marketing Agent',
  social_content: 'Creative Content Agent',
  social_scheduler: 'Social Scheduler Agent',
  social_analytics: 'Social Media Analytics',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  processed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
  failed: { bg: 'bg-red-500/10', text: 'text-red-500', icon: AlertCircle },
};

export function ConversationHistoryBrowser({ companyId }: ConversationHistoryBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [companyId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_agent_events')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setConversations(data as ConversationEvent[]);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique agents for filter
  const uniqueAgents = Array.from(new Set(conversations.map(c => c.source_agent))).sort();

  // Apply filters
  const filteredConversations = conversations.filter(conv => {
    if (agentFilter !== 'all' && conv.source_agent !== agentFilter) return false;
    if (statusFilter !== 'all' && conv.status !== statusFilter) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const agentName = AGENT_DISPLAY_NAMES[conv.source_agent]?.toLowerCase() || conv.source_agent;
      const eventType = conv.event_type.toLowerCase();
      const payloadStr = JSON.stringify(conv.payload || {}).toLowerCase();
      if (!agentName.includes(searchLower) && 
          !eventType.includes(searchLower) && 
          !payloadStr.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Conversation History
            </CardTitle>
            <CardDescription>Browse past operative interactions and handoffs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchConversations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[180px]">
              <Bot className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Operatives" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operatives</SelectItem>
              {uniqueAgents.map(agent => (
                <SelectItem key={agent} value={agent}>
                  {AGENT_DISPLAY_NAMES[agent] || agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredConversations.length} of {conversations.length} events
        </p>

        {/* Conversation List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <AuraEmptyState icon={MessageSquare} title="No conversations found" description="Try adjusting your filters or wait for more activity" />
            ) : (
              filteredConversations.map((conv) => {
                const StatusIcon = STATUS_STYLES[conv.status]?.icon || Clock;
                const statusStyle = STATUS_STYLES[conv.status] || STATUS_STYLES.pending;
                const isExpanded = expandedId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className="border rounded-lg p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : conv.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Source Agent */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {AGENT_DISPLAY_NAMES[conv.source_agent] || conv.source_agent}
                        </span>
                      </div>

                      {/* Handoff Arrow */}
                      {conv.target_agent && (
                        <>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <Bot className="h-4 w-4 text-secondary" />
                            <span className="text-sm">
                              {AGENT_DISPLAY_NAMES[conv.target_agent] || conv.target_agent}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex-1" />

                      {/* Event Type */}
                      <Badge variant="outline" className="text-xs">
                        {conv.event_type.replace(/_/g, ' ')}
                      </Badge>

                      {/* Status */}
                      <Badge className={`${statusStyle.bg} ${statusStyle.text} text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {conv.status}
                      </Badge>

                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                        {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <span className="ml-2">{new Date(conv.created_at).toLocaleString()}</span>
                          </div>
                          {conv.processed_at && (
                            <div>
                              <span className="text-muted-foreground">Processed:</span>
                              <span className="ml-2">{new Date(conv.processed_at).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        {conv.error_message && (
                          <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 inline mr-2" />
                            {conv.error_message}
                          </div>
                        )}
                        {conv.payload && Object.keys(conv.payload).length > 0 && (
                          <div className="p-2 bg-muted rounded">
                            <pre className="text-xs overflow-auto max-h-[200px]">
                              {JSON.stringify(conv.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}