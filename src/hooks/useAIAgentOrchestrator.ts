import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AgentInfo {
  type: string;
  name: string;
  category: string;
  phase: number;
  is_enabled: boolean;
  settings: Record<string, any>;
  config_id?: string;
}

export interface AgentContext {
  id: string;
  company_id: string;
  conversation_id?: string;
  appointment_id?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_name?: string;
  context_data: Record<string, any>;
  active_agent: string;
  handoff_history: Array<{
    from_agent: string;
    to_agent: string;
    reason: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  id: string;
  company_id: string;
  source_agent: string;
  target_agent?: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  created_at: string;
}

// Default agent definitions - 22 total agents
const DEFAULT_AGENTS: AgentInfo[] = [
  // Customer Engagement (Phase 1) - 4 agents
  { type: 'triage', name: 'AI Receptionist', category: 'customer_engagement', phase: 1, is_enabled: false, settings: {} },
  { type: 'booking', name: 'Scheduling Agent', category: 'customer_engagement', phase: 1, is_enabled: false, settings: {} },
  { type: 'followup', name: 'Follow-up Agent', category: 'customer_engagement', phase: 1, is_enabled: false, settings: {} },
  { type: 'review', name: 'Social Media Review Agent', category: 'customer_engagement', phase: 1, is_enabled: false, settings: {} },
  // Field Operations (Phase 2) - 4 agents
  { type: 'dispatch', name: 'Dispatch Agent', category: 'field_operations', phase: 2, is_enabled: false, settings: {} },
  { type: 'route', name: 'Route Agent', category: 'field_operations', phase: 2, is_enabled: false, settings: {} },
  { type: 'eta', name: 'ETA Agent', category: 'field_operations', phase: 2, is_enabled: false, settings: {} },
  { type: 'checkin', name: 'Check-in Agent', category: 'field_operations', phase: 2, is_enabled: false, settings: {} },
  // Business Operations (Phase 3) - 5 agents
  { type: 'quoting', name: 'Quoting Agent', category: 'business_operations', phase: 3, is_enabled: false, settings: {} },
  { type: 'invoice', name: 'Invoice Agent', category: 'business_operations', phase: 3, is_enabled: false, settings: {} },
  { type: 'inventory', name: 'Inventory Agent', category: 'business_operations', phase: 3, is_enabled: false, settings: {} },
  { type: 'warranty', name: 'Warranty Agent', category: 'business_operations', phase: 3, is_enabled: false, settings: {} },
  { type: 'admin', name: 'Admin Agent', category: 'business_operations', phase: 3, is_enabled: false, settings: {} },
  // Marketing & Sales (Phase 4) - 5 agents
  { type: 'promo', name: 'Promo Agent', category: 'marketing_sales', phase: 4, is_enabled: false, settings: {} },
  { type: 'referral', name: 'Referral Agent', category: 'marketing_sales', phase: 4, is_enabled: false, settings: {} },
  { type: 'winback', name: 'Win-back Agent', category: 'marketing_sales', phase: 4, is_enabled: false, settings: {} },
  { type: 'seasonal', name: 'Seasonal Agent', category: 'marketing_sales', phase: 4, is_enabled: false, settings: {} },
  { type: 'marketing', name: 'Marketing Agent', category: 'marketing_sales', phase: 4, is_enabled: false, settings: {} },
  // Analytics (Phase 5) - 4 agents
  { type: 'insights', name: 'Insights Agent', category: 'analytics', phase: 5, is_enabled: false, settings: {} },
  { type: 'forecast', name: 'Forecast Agent', category: 'analytics', phase: 5, is_enabled: false, settings: {} },
  { type: 'revenue', name: 'Revenue Agent', category: 'analytics', phase: 5, is_enabled: false, settings: {} },
  { type: 'performance', name: 'Performance Agent', category: 'analytics', phase: 5, is_enabled: false, settings: {} },
];

function groupAgentsByCategory(agentList: AgentInfo[]): Record<string, AgentInfo[]> {
  return agentList.reduce((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = [];
    }
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, AgentInfo[]>);
}

export function useAIAgentOrchestrator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
  const [groupedAgents, setGroupedAgents] = useState<Record<string, AgentInfo[]>>(groupAgentsByCategory(DEFAULT_AGENTS));
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Get company ID
  useEffect(() => {
    async function fetchCompanyId() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (data?.company_id) {
        setCompanyId(data.company_id);
      } else {
        setLoading(false);
      }
    }
    
    fetchCompanyId();
  }, [user]);

  // Fetch all agents - now using direct DB query with defaults
  const fetchAgents = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch existing configs from database
      const { data: configs, error } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      // Merge defaults with database configs
      const mergedAgents = DEFAULT_AGENTS.map(defaultAgent => {
        const config = configs?.find(c => c.agent_type === defaultAgent.type);
        if (config) {
          return {
            ...defaultAgent,
            is_enabled: config.is_enabled || false,
            settings: (config.settings as Record<string, any>) || {},
            config_id: config.id,
          };
        }
        return defaultAgent;
      });
      
      setAgents(mergedAgents);
      setGroupedAgents(groupAgentsByCategory(mergedAgents));
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Keep defaults on error
      setAgents(DEFAULT_AGENTS);
      setGroupedAgents(groupAgentsByCategory(DEFAULT_AGENTS));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchAgents();
    }
  }, [companyId, fetchAgents]);

  // Toggle agent enabled state
  const toggleAgent = async (agentType: string, enabled: boolean) => {
    if (!companyId) {
      console.error('No company ID available for toggling agent');
      toast({
        title: 'Error',
        description: 'No company associated with your account',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Check if config exists
      const { data: existing, error: selectError } = await supabase
        .from('ai_agent_configs')
        .select('id')
        .eq('company_id', companyId)
        .eq('agent_type', agentType)
        .maybeSingle();
      
      if (selectError) {
        console.error('Error checking agent config:', selectError);
        throw selectError;
      }
      
      if (existing) {
        const { error: updateError } = await supabase
          .from('ai_agent_configs')
          .update({ is_enabled: enabled })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('Error updating agent config:', updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('ai_agent_configs')
          .insert({
            company_id: companyId,
            agent_type: agentType,
            is_enabled: enabled,
            settings: {},
          });
        
        if (insertError) {
          console.error('Error inserting agent config:', insertError);
          throw insertError;
        }
      }
      
      await fetchAgents();
      
      toast({
        title: enabled ? 'Agent Enabled' : 'Agent Disabled',
        description: `${agentType} agent has been ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      console.error('Error toggling agent:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update agent',
        variant: 'destructive',
      });
    }
  };

  // Update agent settings
  const updateAgentSettings = async (agentType: string, settings: Record<string, any>) => {
    if (!companyId) return;
    
    try {
      const { data: existing } = await supabase
        .from('ai_agent_configs')
        .select('id, settings')
        .eq('company_id', companyId)
        .eq('agent_type', agentType)
        .single();
      
      const existingSettings = (existing?.settings as Record<string, any>) || {};
      const mergedSettings = { ...existingSettings, ...settings };
      
      if (existing) {
        await supabase
          .from('ai_agent_configs')
          .update({ settings: mergedSettings })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ai_agent_configs')
          .insert({
            company_id: companyId,
            agent_type: agentType,
            is_enabled: false,
            settings: mergedSettings,
          });
      }
      
      await fetchAgents();
      
      toast({
        title: 'Settings Updated',
        description: `${agentType} agent settings have been saved`,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  // Emit an event
  const emitEvent = async (
    sourceAgent: string,
    eventType: string,
    payload: Record<string, any>,
    contextId?: string
  ) => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'emit_event',
          companyId,
          agentType: sourceAgent,
          eventType,
          payload,
          contextId,
        },
      });
      
      if (error) throw error;
      
      console.log(`Event emitted: ${eventType}`, data);
      return data;
    } catch (error) {
      console.error('Error emitting event:', error);
      throw error;
    }
  };

  // Create a new context
  const createContext = async (contextData: Partial<AgentContext>): Promise<AgentContext | undefined> => {
    if (!companyId) return undefined;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'create_context',
          companyId,
          payload: { ...contextData },
        },
      });
      
      if (error) throw error;
      
      return data.context;
    } catch (error) {
      console.error('Error creating context:', error);
      throw error;
    }
  };

  // Get context
  const getContext = async (contextId: string): Promise<AgentContext | null> => {
    if (!companyId) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'get_context',
          companyId,
          contextId,
        },
      });
      
      if (error) throw error;
      
      return data.context;
    } catch (error) {
      console.error('Error getting context:', error);
      return null;
    }
  };

  // Handoff to another agent
  const handoff = async (
    contextId: string,
    toAgent: string,
    reason: string,
    additionalContext?: Record<string, any>
  ) => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'handoff',
          companyId,
          contextId,
          agentType: toAgent,
          payload: {
            reason,
            additional_context: additionalContext,
          },
        },
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error during handoff:', error);
      throw error;
    }
  };

  // Subscribe to real-time events
  const subscribeToEvents = (callback: (event: AgentEvent) => void) => {
    if (!companyId) return () => {};
    
    const channel = supabase
      .channel('ai-agent-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_agent_events',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          callback(payload.new as AgentEvent);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    agents,
    groupedAgents,
    loading,
    companyId,
    toggleAgent,
    updateAgentSettings,
    emitEvent,
    createContext,
    getContext,
    handoff,
    subscribeToEvents,
    refetch: fetchAgents,
  };
}
