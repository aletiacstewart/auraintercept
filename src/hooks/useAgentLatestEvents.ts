import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DecisionMode } from '@/components/ai/agents/DecisionModeBadge';

export interface AgentLatestEvent {
  id: string;
  source_agent: string;
  decision_mode: DecisionMode;
  confidence_score: number | null;
  action_description: string | null;
  created_at: string;
  requires_human_review: boolean;
}

export interface AgentLatestEventsMap {
  [agentType: string]: AgentLatestEvent | null;
}

export function useAgentLatestEvents(companyId: string | undefined, agentTypes: string[]) {
  return useQuery({
    queryKey: ['agent-latest-events', companyId, agentTypes.join(',')],
    queryFn: async (): Promise<AgentLatestEventsMap> => {
      if (!companyId || agentTypes.length === 0) {
        return {};
      }

      // Fetch the latest event for each agent type
      const { data, error } = await supabase
        .from('ai_agent_events')
        .select('id, source_agent, decision_mode, confidence_score, action_description, created_at, requires_human_review')
        .eq('company_id', companyId)
        .in('source_agent', agentTypes)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agent latest events:', error);
        return {};
      }

      // Group by agent and take only the latest
      const latestByAgent: AgentLatestEventsMap = {};
      
      for (const event of data || []) {
        if (!latestByAgent[event.source_agent]) {
          latestByAgent[event.source_agent] = {
            id: event.id,
            source_agent: event.source_agent,
            decision_mode: (event.decision_mode as DecisionMode) || 'auto',
            confidence_score: event.confidence_score,
            action_description: event.action_description,
            created_at: event.created_at,
            requires_human_review: event.requires_human_review || false,
          };
        }
      }

      return latestByAgent;
    },
    enabled: !!companyId && agentTypes.length > 0,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for live updates
  });
}
