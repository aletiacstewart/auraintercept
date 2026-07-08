import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { normalizeAgentName } from '@/lib/subscriptionAgentConfig';
import { PROFILE_SPECS, getProfileSpec, ProfileKey } from '@/lib/industryProfiles';
import { getProfileForBusinessType } from '@/lib/businessTypeProfileMap';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';

/**
 * Granular AgentId (from PROFILE_SPECS.agentsAlwaysOn) → consolidated
 * operative type used by ai_agent_configs. Keep in sync with the same map
 * in `BatchAgentActivation.tsx`.
 */
const GRANULAR_TO_OPERATIVE: Record<string, string> = {
  ai_receptionist: 'triage',
  booking_agent: 'customer_journey',
  follow_up_agent: 'customer_journey',
  review_agent: 'customer_journey',
  dispatch_gps: 'dispatch',
  check_in_agent: 'dispatch',
  route_agent: 'field_navigation',
  eta_agent: 'field_navigation',
  admin_agent: 'admin',
  quoting_agent: 'business_finance',
  invoice_agent: 'business_finance',
  inventory_agent: 'business_finance',
  campaign_agent: 'outreach',
  lead_agent: 'outreach',
  marketing_agent: 'outreach',
  creative_agent: 'creative_content',
  social_media_agent: 'creative_content',
  social_media_scheduler: 'creative_content',
  social_media_analytics: 'creative_content',
  web_presence_agent: 'web_presence',
  insights_agent: 'analytics_intelligence',
  performance_agent: 'analytics_intelligence',
  revenue_agent: 'analytics_intelligence',
  forecast_agent: 'analytics_intelligence',
};

/** Operatives that are Always-On for the given profile. */
function alwaysOnOperativesForProfile(key: ProfileKey | null): Set<string> {
  const spec = getProfileSpec(key);
  const out = new Set<string>();
  for (const gran of spec.agentsAlwaysOn) {
    const op = GRANULAR_TO_OPERATIVE[gran];
    if (op) out.add(op);
  }
  return out;
}

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

// Default agent definitions — derived from AGENT_REGISTRY (single source of truth).
// Add / rename / recategorize agents in src/lib/agentRegistry.ts.
const DEFAULT_AGENTS: AgentInfo[] = Object.values(AGENT_REGISTRY).map((entry) => ({
  type: entry.type,
  name: entry.name,
  category: entry.category,
  phase: entry.phase,
  is_enabled: false,
  settings: {},
}));

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
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
  const [groupedAgents, setGroupedAgents] = useState<Record<string, AgentInfo[]>>(groupAgentsByCategory(DEFAULT_AGENTS));
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

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

  const fetchAgents = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data: configs, error } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      const mergedAgents = DEFAULT_AGENTS.map(defaultAgent => {
        // Match either an exact-typed config row OR any legacy row that
        // normalizes to this consolidated operative (e.g. "booking" -> "customer_journey").
        // This way, accounts seeded with the old 24-agent IDs still light up the
        // current 10-operative UI without requiring a re-seed.
        const matchingConfigs = (configs ?? []).filter(c =>
          c.agent_type === defaultAgent.type ||
          normalizeAgentName(c.agent_type) === defaultAgent.type
        );
        if (matchingConfigs.length > 0) {
          // Shallow-merge settings across every matching row so legacy sibling
          // rows (e.g. both "booking" and "followup" for customer_journey)
          // contribute their settings instead of one silently winning.
          // Exact-typed row wins on key conflicts; legacy rows fill in gaps.
          const exact = matchingConfigs.find(c => c.agent_type === defaultAgent.type);
          const legacyRows = matchingConfigs.filter(c => c.agent_type !== defaultAgent.type);
          const mergedSettings: Record<string, any> = {};
          for (const c of legacyRows) {
            Object.assign(mergedSettings, (c.settings as Record<string, any>) || {});
          }
          if (exact) {
            Object.assign(mergedSettings, (exact.settings as Record<string, any>) || {});
          }
          const config = exact ?? matchingConfigs[0];
          const isEnabled = matchingConfigs.some(c => c.is_enabled);
          return {
            ...defaultAgent,
            is_enabled: isEnabled,
            settings: mergedSettings,
            config_id: config.id,
          };
        }
        return defaultAgent;
      });

      // Platform admins see every operative as Active in-memory (no DB write),
      // so the platform admin dashboard can preview behavior end-to-end.
      const finalAgents = userRole === 'platform_admin'
        ? mergedAgents.map(a => ({ ...a, is_enabled: true }))
        : mergedAgents;

      setAgents(finalAgents);
      setGroupedAgents(groupAgentsByCategory(finalAgents));
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents(DEFAULT_AGENTS);
      setGroupedAgents(groupAgentsByCategory(DEFAULT_AGENTS));
    } finally {
      setLoading(false);
    }
  }, [companyId, userRole]);

  useEffect(() => {
    if (companyId) {
      fetchAgents();
    }
  }, [companyId, fetchAgents]);

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

    // Phase 7 — Always-On lock. Refuse to disable operatives the company's
    // profile marks as Always-On. Enabling is always allowed.
    if (!enabled) {
      const { data: row } = await supabase
        .from('companies')
        .select('profile_key, industry_vertical')
        .eq('id', companyId)
        .maybeSingle();
      const r = row as { profile_key?: string | null; industry_vertical?: string | null } | null;
      let profileKey: ProfileKey | null = null;
      if (r?.profile_key && r.profile_key in PROFILE_SPECS) profileKey = r.profile_key as ProfileKey;
      else if (r?.industry_vertical) profileKey = getProfileForBusinessType(r.industry_vertical);
      const alwaysOn = alwaysOnOperativesForProfile(profileKey);
      if (alwaysOn.has(agentType)) {
        toast({
          title: 'Required operative',
          description: `${agentType} is required for your industry profile and cannot be turned off.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      const { data: existing, error: selectError } = await supabase
        .from('ai_agent_configs')
        .select('id')
        .eq('company_id', companyId)
        .eq('agent_type', agentType)
        .maybeSingle();
      
      if (selectError) throw selectError;
      
      if (existing) {
        const { error: updateError } = await supabase
          .from('ai_agent_configs')
          .update({ is_enabled: enabled })
          .eq('id', existing.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('ai_agent_configs')
          .insert({
            company_id: companyId,
            agent_type: agentType,
            is_enabled: enabled,
            settings: {},
          });
        
        if (insertError) throw insertError;
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
