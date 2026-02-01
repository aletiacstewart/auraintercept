import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Use the database enum type directly
export type DbJobType = Database['public']['Enums']['employee_job_type'];

export interface FeaturePermissions {
  can_access_appointments: boolean;
  can_access_customers: boolean;
  can_access_invoices: boolean;
  can_access_quotes: boolean;
  can_access_leads: boolean;
  can_access_inventory: boolean;
  can_access_campaigns: boolean;
  can_access_analytics: boolean;
  can_access_field_ops: boolean;
  can_access_warranties: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

export interface RolePermission extends FeaturePermissions {
  id: string;
  company_id: string;
  job_type: DbJobType;
  created_at: string;
  updated_at: string;
}

export interface AgentAccess {
  id: string;
  company_id: string;
  job_type: DbJobType;
  agent_type: string;
  is_enabled: boolean;
  created_at: string;
}

// Platform default permissions for each role
export const PLATFORM_DEFAULT_PERMISSIONS: Record<DbJobType, Partial<FeaturePermissions>> = {
  technician: {
    can_access_appointments: true,
    can_access_customers: true,
    can_access_field_ops: true,
    can_access_inventory: true,
    can_create: true,
    can_edit: true,
  },
  booking_agent: {
    can_access_appointments: true,
    can_access_customers: true,
    can_create: true,
    can_edit: true,
  },
  dispatch: {
    can_access_appointments: true,
    can_access_customers: true,
    can_access_field_ops: true,
    can_access_inventory: true,
    can_create: true,
    can_edit: true,
  },
  customer_service: {
    can_access_appointments: true,
    can_access_customers: true,
    can_access_quotes: true,
    can_access_leads: true,
    can_access_invoices: true,
    can_access_warranties: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_export: true,
  },
  manager: {
    can_access_appointments: true,
    can_access_customers: true,
    can_access_quotes: true,
    can_access_leads: true,
    can_access_invoices: true,
    can_access_warranties: true,
    can_access_inventory: true,
    can_access_analytics: true,
    can_access_field_ops: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_export: true,
  },
  billing: {
    can_access_invoices: true,
    can_access_quotes: true,
    can_access_warranties: true,
    can_create: true,
    can_edit: true,
  },
  marketing: {
    can_access_campaigns: true,
    can_access_leads: true,
    can_access_customers: true,
    can_access_analytics: true,
    can_create: true,
    can_edit: true,
  },
  inventory: {
    can_access_inventory: true,
    can_access_warranties: true,
    can_create: true,
    can_edit: true,
  },
  analytics: {
    can_access_analytics: true,
    can_access_appointments: true,
    can_access_customers: true,
    can_export: true,
  },
};

// Platform default AI agents for each role
export const PLATFORM_DEFAULT_AGENTS: Record<DbJobType, string[]> = {
  technician: ['dispatch', 'route', 'eta', 'checkin', 'inventory'],
  booking_agent: ['triage', 'booking', 'followup', 'review'],
  dispatch: ['dispatch', 'route', 'eta', 'triage', 'inventory'],
  customer_service: ['triage', 'followup', 'review', 'booking', 'quoting', 'warranty'],
  manager: ['triage', 'booking', 'followup', 'review', 'quoting', 'warranty', 'dispatch', 'route', 'eta', 'insights', 'forecast', 'social_content', 'social_scheduler', 'social_analytics', 'marketing'],
  billing: ['quoting', 'invoice', 'warranty'],
  marketing: ['campaign', 'insights', 'social_content', 'social_scheduler', 'social_analytics'],
  inventory: ['inventory', 'warranty'],
  analytics: ['insights', 'forecast', 'social_analytics'],
};

// All available AI agents
export const ALL_AI_AGENTS = [
  { id: 'triage', name: 'Triage Agent', description: 'Routes inquiries and handles initial assessment' },
  { id: 'booking', name: 'Booking Agent', description: 'Manages appointment scheduling' },
  { id: 'followup', name: 'Follow-up Agent', description: 'Handles post-service follow-ups' },
  { id: 'review', name: 'Review Agent', description: 'Manages customer reviews and feedback' },
  { id: 'quoting', name: 'Quoting Agent', description: 'Generates and manages quotes' },
  { id: 'dispatch', name: 'Dispatch Agent', description: 'Manages technician dispatch' },
  { id: 'route', name: 'Route Agent', description: 'Optimizes service routes' },
  { id: 'eta', name: 'ETA Agent', description: 'Provides arrival time estimates' },
  { id: 'checkin', name: 'Check-in Agent', description: 'Manages technician check-ins' },
  { id: 'inventory', name: 'Inventory Agent', description: 'Manages inventory tracking' },
  { id: 'invoice', name: 'Invoice Agent', description: 'Handles invoicing tasks' },
  { id: 'campaign', name: 'Campaign Agent', description: 'Manages marketing campaigns' },
  { id: 'insights', name: 'Insights Agent', description: 'Provides business analytics' },
  { id: 'forecast', name: 'Forecast Agent', description: 'Demand and trend forecasting' },
];

// All feature areas
export const ALL_FEATURES = [
  { id: 'appointments', field: 'can_access_appointments', name: 'Appointments', description: 'View and manage appointments' },
  { id: 'customers', field: 'can_access_customers', name: 'Customers', description: 'View and manage customer records' },
  { id: 'invoices', field: 'can_access_invoices', name: 'Invoices', description: 'View and manage invoices' },
  { id: 'quotes', field: 'can_access_quotes', name: 'Quotes', description: 'View and manage quotes' },
  { id: 'leads', field: 'can_access_leads', name: 'Leads', description: 'View and manage leads' },
  { id: 'inventory', field: 'can_access_inventory', name: 'Inventory', description: 'View and manage inventory' },
  { id: 'campaigns', field: 'can_access_campaigns', name: 'Campaigns', description: 'View and manage marketing campaigns' },
  { id: 'analytics', field: 'can_access_analytics', name: 'Analytics', description: 'View analytics and reports' },
  { id: 'field_ops', field: 'can_access_field_ops', name: 'Field Operations', description: 'View and manage field operations' },
  { id: 'warranties', field: 'can_access_warranties', name: 'Warranties', description: 'View and manage warranties' },
];

export const GRANULAR_PERMISSIONS = [
  { id: 'create', field: 'can_create', name: 'Create', description: 'Can create new records' },
  { id: 'edit', field: 'can_edit', name: 'Edit', description: 'Can edit existing records' },
  { id: 'delete', field: 'can_delete', name: 'Delete', description: 'Can delete records' },
  { id: 'export', field: 'can_export', name: 'Export', description: 'Can export data' },
];

export function useRolePermissions(companyId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all role permissions for the company
  const { data: rolePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['role-permissions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('company_role_permissions')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!companyId,
  });

  // Fetch all agent access for the company
  const { data: agentAccess, isLoading: agentLoading } = useQuery({
    queryKey: ['agent-access', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('company_role_agent_access')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data as AgentAccess[];
    },
    enabled: !!companyId,
  });

  // Get permissions for a specific role (with defaults fallback)
  const getPermissionsForRole = useCallback((jobType: DbJobType): FeaturePermissions => {
    const customPermission = rolePermissions?.find(p => p.job_type === jobType);
    if (customPermission) {
      return {
        can_access_appointments: customPermission.can_access_appointments,
        can_access_customers: customPermission.can_access_customers,
        can_access_invoices: customPermission.can_access_invoices,
        can_access_quotes: customPermission.can_access_quotes,
        can_access_leads: customPermission.can_access_leads,
        can_access_inventory: customPermission.can_access_inventory,
        can_access_campaigns: customPermission.can_access_campaigns,
        can_access_analytics: customPermission.can_access_analytics,
        can_access_field_ops: customPermission.can_access_field_ops,
        can_access_warranties: customPermission.can_access_warranties,
        can_create: customPermission.can_create,
        can_edit: customPermission.can_edit,
        can_delete: customPermission.can_delete,
        can_export: customPermission.can_export,
      };
    }
    // Return platform defaults
    const defaults = PLATFORM_DEFAULT_PERMISSIONS[jobType] || {};
    return {
      can_access_appointments: defaults.can_access_appointments ?? false,
      can_access_customers: defaults.can_access_customers ?? false,
      can_access_invoices: defaults.can_access_invoices ?? false,
      can_access_quotes: defaults.can_access_quotes ?? false,
      can_access_leads: defaults.can_access_leads ?? false,
      can_access_inventory: defaults.can_access_inventory ?? false,
      can_access_campaigns: defaults.can_access_campaigns ?? false,
      can_access_analytics: defaults.can_access_analytics ?? false,
      can_access_field_ops: defaults.can_access_field_ops ?? false,
      can_access_warranties: defaults.can_access_warranties ?? false,
      can_create: defaults.can_create ?? false,
      can_edit: defaults.can_edit ?? false,
      can_delete: defaults.can_delete ?? false,
      can_export: defaults.can_export ?? false,
    };
  }, [rolePermissions]);

  // Get agent access for a specific role (with defaults fallback)
  const getAgentAccessForRole = useCallback((jobType: DbJobType): string[] => {
    const customAccess = agentAccess?.filter(a => a.job_type === jobType && a.is_enabled);
    if (customAccess && customAccess.length > 0) {
      return customAccess.map(a => a.agent_type);
    }
    // Return platform defaults if no custom config
    return PLATFORM_DEFAULT_AGENTS[jobType] || [];
  }, [agentAccess]);

  // Check if role has custom permissions set
  const hasCustomPermissions = useCallback((jobType: DbJobType): boolean => {
    return !!rolePermissions?.find(p => p.job_type === jobType);
  }, [rolePermissions]);

  // Check if role has custom agent access set
  const hasCustomAgentAccess = useCallback((jobType: DbJobType): boolean => {
    return !!agentAccess?.find(a => a.job_type === jobType);
  }, [agentAccess]);

  // Upsert feature permissions for a role
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ jobType, permissions }: { jobType: DbJobType; permissions: Partial<FeaturePermissions> }) => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase
        .from('company_role_permissions')
        .upsert({
          company_id: companyId,
          job_type: jobType,
          ...permissions,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id,job_type',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', companyId] });
      toast.success('Permissions updated');
    },
    onError: (error) => {
      console.error('Failed to update permissions:', error);
      toast.error('Failed to update permissions');
    },
  });

  // Update agent access for a role
  const updateAgentAccessMutation = useMutation({
    mutationFn: async ({ jobType, agentType, isEnabled }: { jobType: DbJobType; agentType: string; isEnabled: boolean }) => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase
        .from('company_role_agent_access')
        .upsert({
          company_id: companyId,
          job_type: jobType,
          agent_type: agentType,
          is_enabled: isEnabled,
        }, {
          onConflict: 'company_id,job_type,agent_type',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-access', companyId] });
      toast.success('Agent access updated');
    },
    onError: (error) => {
      console.error('Failed to update agent access:', error);
      toast.error('Failed to update agent access');
    },
  });

  // Bulk update agent access for a role
  const bulkUpdateAgentAccessMutation = useMutation({
    mutationFn: async ({ jobType, agents }: { jobType: DbJobType; agents: { agentType: string; isEnabled: boolean }[] }) => {
      if (!companyId) throw new Error('No company ID');
      
      const records = agents.map(a => ({
        company_id: companyId,
        job_type: jobType,
        agent_type: a.agentType,
        is_enabled: a.isEnabled,
      }));

      const { error } = await supabase
        .from('company_role_agent_access')
        .upsert(records, {
          onConflict: 'company_id,job_type,agent_type',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-access', companyId] });
      toast.success('Agent access updated');
    },
    onError: (error) => {
      console.error('Failed to update agent access:', error);
      toast.error('Failed to update agent access');
    },
  });

  // Reset role to platform defaults
  const resetToDefaultsMutation = useMutation({
    mutationFn: async (jobType: DbJobType) => {
      if (!companyId) throw new Error('No company ID');
      
      // Delete custom permissions
      await supabase
        .from('company_role_permissions')
        .delete()
        .eq('company_id', companyId)
        .eq('job_type', jobType);
      
      // Delete custom agent access
      await supabase
        .from('company_role_agent_access')
        .delete()
        .eq('company_id', companyId)
        .eq('job_type', jobType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['agent-access', companyId] });
      toast.success('Reset to platform defaults');
    },
    onError: (error) => {
      console.error('Failed to reset to defaults:', error);
      toast.error('Failed to reset to defaults');
    },
  });

  return {
    rolePermissions,
    agentAccess,
    isLoading: permissionsLoading || agentLoading,
    getPermissionsForRole,
    getAgentAccessForRole,
    hasCustomPermissions,
    hasCustomAgentAccess,
    updatePermissions: updatePermissionsMutation.mutate,
    updateAgentAccess: updateAgentAccessMutation.mutate,
    bulkUpdateAgentAccess: bulkUpdateAgentAccessMutation.mutate,
    resetToDefaults: resetToDefaultsMutation.mutate,
    isUpdating: updatePermissionsMutation.isPending || updateAgentAccessMutation.isPending || bulkUpdateAgentAccessMutation.isPending,
    isResetting: resetToDefaultsMutation.isPending,
  };
}
