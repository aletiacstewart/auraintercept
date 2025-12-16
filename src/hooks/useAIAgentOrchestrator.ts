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

export function useAIAgentOrchestrator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [groupedAgents, setGroupedAgents] = useState<Record<string, AgentInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Get company ID
  useEffect(() => {
    async function fetchCompanyId() {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (data?.company_id) {
        setCompanyId(data.company_id);
      }
    }
    
    fetchCompanyId();
  }, [user]);

  // Fetch all agents
  const fetchAgents = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: { action: 'list_agents', companyId },
      });
      
      if (error) throw error;
      
      setAgents(data.agents || []);
      setGroupedAgents(data.grouped || {});
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI agents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Toggle agent enabled state
  const toggleAgent = async (agentType: string, enabled: boolean) => {
    if (!companyId) return;
    
    try {
      // Check if config exists
      const { data: existing } = await supabase
        .from('ai_agent_configs')
        .select('id')
        .eq('company_id', companyId)
        .eq('agent_type', agentType)
        .single();
      
      if (existing) {
        await supabase
          .from('ai_agent_configs')
          .update({ is_enabled: enabled })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ai_agent_configs')
          .insert({
            company_id: companyId,
            agent_type: agentType,
            is_enabled: enabled,
            settings: {},
          });
      }
      
      await fetchAgents();
      
      toast({
        title: enabled ? 'Agent Enabled' : 'Agent Disabled',
        description: `${agentType} agent has been ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to update agent',
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
