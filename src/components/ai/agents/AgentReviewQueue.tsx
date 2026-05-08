import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Filter,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { DecisionModeBadge, DecisionMode } from './DecisionModeBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { AgentOverrideModal } from './AgentOverrideModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewItem {
  id: string;
  source_agent: string;
  event_type: string;
  decision_mode: DecisionMode;
  confidence_score: number | null;
  action_description: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

interface AgentReviewQueueProps {
  companyId: string;
  className?: string;
}

const AGENT_NAMES: Record<string, string> = {
  triage: 'Triage Agent',
  booking: 'Booking Agent',
  dispatch: 'Dispatch/GPS Console',
  followup: 'Follow-up Agent',
  invoice: 'Invoice Agent',
  marketing: 'Marketing Agent',
  social: 'Creative Content Agent',
  analytics: 'Analytics Agent'
};

export const AgentReviewQueue: React.FC<AgentReviewQueueProps> = ({
  companyId,
  className
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [selectedOverride, setSelectedOverride] = useState<ReviewItem | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ai_agent_events')
        .select('id, source_agent, event_type, decision_mode, confidence_score, action_description, created_at, payload')
        .eq('company_id', companyId)
        .eq('requires_human_review', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (agentFilter !== 'all') {
        query = query.eq('source_agent', agentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = (data || []) as ReviewItem[];
      
      if (confidenceFilter !== 'all') {
        filteredData = filteredData.filter(item => {
          const score = item.confidence_score || 0;
          if (confidenceFilter === 'low') return score < 0.5;
          if (confidenceFilter === 'medium') return score >= 0.5 && score < 0.8;
          if (confidenceFilter === 'high') return score >= 0.8;
          return true;
        });
      }

      setItems(filteredData);
    } catch (error) {
      console.error('Failed to fetch review items:', error);
      toast.error('Failed to load review queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('review-queue')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agent_events',
        filter: `company_id=eq.${companyId}`
      }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, agentFilter, confidenceFilter]);

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (!user || selectedItems.size === 0) return;

    setIsBulkProcessing(true);
    try {
      const status = action === 'approve' ? 'processed' : 'failed';
      
      const { error } = await supabase
        .from('ai_agent_events')
        .update({
          status,
          requires_human_review: false,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          override_reason: `Bulk ${action}`
        })
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast.success(`${selectedItems.size} items ${action}ed`);
      setSelectedItems(new Set());
      fetchItems();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Failed to process items');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const uniqueAgents = Array.from(new Set(items.map(i => i.source_agent)));

  return (
    <>
      <Card className={cn('flex flex-col', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-500" />
              Review Queue
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {items.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchItems} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent}>
                    {AGENT_NAMES[agent] || agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="All Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                {selectedItems.size} selected
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleBulkAction('approve')}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Approve All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleBulkAction('reject')}
                disabled={isBulkProcessing}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject All
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No items need review right now
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3 py-2 border-b text-xs text-muted-foreground">
                  <Checkbox
                    checked={selectedItems.size === items.length && items.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="flex-1">Agent / Action</span>
                  <span className="w-20">Confidence</span>
                  <span className="w-16">Time</span>
                  <span className="w-16"></span>
                </div>
                
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {AGENT_NAMES[item.source_agent] || item.source_agent}
                        </span>
                        <DecisionModeBadge mode={item.decision_mode} size="sm" showIcon={false} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.action_description || item.event_type}
                      </p>
                    </div>
                    <div className="w-20">
                      <ConfidenceIndicator score={item.confidence_score} size="sm" showLabel={false} />
                    </div>
                    <div className="w-16">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: false })}
                      </span>
                    </div>
                    <div className="w-16">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setSelectedOverride(item)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedOverride && (
        <AgentOverrideModal
          open={!!selectedOverride}
          onOpenChange={(open) => !open && setSelectedOverride(null)}
          eventId={selectedOverride.id}
          agentName={AGENT_NAMES[selectedOverride.source_agent] || selectedOverride.source_agent}
          currentDecision={selectedOverride.action_description || selectedOverride.event_type}
          decisionMode={selectedOverride.decision_mode}
          confidenceScore={selectedOverride.confidence_score}
          onOverrideComplete={() => {
            setSelectedOverride(null);
            fetchItems();
          }}
        />
      )}
    </>
  );
};

export default AgentReviewQueue;
