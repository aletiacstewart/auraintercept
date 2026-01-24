import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Sparkles, ChevronRight } from 'lucide-react';
import { AuraEventCard } from './AuraEventCard';
import { AuraAgentPulse, AgentStatus } from './AuraAgentPulse';
import { useNavigate } from 'react-router-dom';

interface AuraLiveStreamProps {
  companyId: string;
}

interface AgentEvent {
  id: string;
  source_agent: string;
  target_agent: string | null;
  event_type: string;
  status: string;
  payload: any;
  created_at: string;
}

// Determine agent status based on recent activity
function getAgentStatus(events: AgentEvent[], agentType: string): AgentStatus {
  const agentEvents = events.filter(e => e.source_agent === agentType);
  if (agentEvents.length === 0) return 'resting';
  
  const latestEvent = agentEvents[0];
  const eventAge = Date.now() - new Date(latestEvent.created_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (eventAge < fiveMinutes) {
    if (latestEvent.status === 'processing') return 'interacting';
    return 'active';
  }
  
  return 'resting';
}

// Get unique active agents from events
function getActiveAgents(events: AgentEvent[]): string[] {
  const fiveMinutes = 5 * 60 * 1000;
  const now = Date.now();
  
  const recentAgents = events
    .filter(e => now - new Date(e.created_at).getTime() < fiveMinutes)
    .map(e => e.source_agent);
  
  return [...new Set(recentAgents)];
}

export function AuraLiveStream({ companyId }: AuraLiveStreamProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AgentEvent[]>([]);

  // Fetch initial events
  const { data: initialEvents, isLoading } = useQuery({
    queryKey: ['aura-live-events', companyId],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('ai_agent_events')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (error) throw error;
      return (data || []) as AgentEvent[];
    },
    enabled: !!companyId,
  });

  // Set initial events
  useEffect(() => {
    if (initialEvents) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('aura-live-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_agent_events',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newEvent = payload.new as AgentEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 14)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const activeAgents = getActiveAgents(events);
  const displayEvents = events.slice(0, 8);

  return (
    <Card className="surface-elevated border-border/20 overflow-hidden">
      {/* Header with gradient accent */}
      <CardHeader className="pb-3 border-b border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Breathing activity indicator */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center aura-breathing">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <div className="absolute inset-0 rounded-full aura-pulse-ring ring-secondary/30" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-card-foreground flex items-center gap-2">
                Aura Live
                <Sparkles className="h-4 w-4 text-warning" />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Real-time wins and relief for your business
              </p>
            </div>
          </div>
          
          {/* Active agents count */}
          <Badge 
            variant="outline" 
            className="bg-aura-emerald/10 text-aura-emerald border-aura-emerald/30"
          >
            {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} working
          </Badge>
        </div>
        
        {/* Active Agents Bar */}
        {activeAgents.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
            <span className="text-xs text-muted-foreground">Active now:</span>
            <div className="flex items-center gap-1">
              {activeAgents.slice(0, 6).map(agent => (
                <AuraAgentPulse 
                  key={agent}
                  agentType={agent}
                  status={getAgentStatus(events, agent)}
                  size="sm"
                />
              ))}
              {activeAgents.length > 6 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{activeAgents.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="h-20 rounded-2xl bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            ) : displayEvents.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-secondary/50" />
                </div>
                <p className="text-card-foreground/70 text-sm mb-1">
                  Aura is ready and waiting
                </p>
                <p className="text-muted-foreground text-xs">
                  Agent activity will appear here in real-time
                </p>
              </div>
            ) : (
              // Event cards
              displayEvents.map(event => (
                <AuraEventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Footer with link to full activity */}
        {events.length > 0 && (
          <div className="p-3 border-t border-border/10 bg-muted/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-secondary hover:text-secondary hover:bg-secondary/10"
              onClick={() => navigate('/dashboard/ai-agents')}
            >
              View All Agent Activity
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
