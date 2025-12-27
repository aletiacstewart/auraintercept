import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CRMConnection {
  id: string;
  provider: 'hubspot' | 'salesforce' | 'zoho' | 'pipedrive';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSyncAt: string | null;
  syncContacts: boolean;
  syncLeads: boolean;
  syncDeals: boolean;
  syncActivities: boolean;
}

export interface CRMContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
}

export interface CRMActivity {
  id?: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject?: string;
  body?: string;
  contactId?: string;
  timestamp?: string;
}

export function useCRMConnection() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  // Check CRM connection status
  const { data: connectionStatus, isLoading: isCheckingConnection, refetch: refetchConnection } = useQuery({
    queryKey: ['crm-connection', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data: connection } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (!connection) {
        return {
          connected: false,
          provider: null,
          status: 'disconnected' as const,
          lastSyncAt: null,
        };
      }

      return {
        connected: connection.status === 'connected',
        provider: connection.provider,
        status: connection.status,
        lastSyncAt: connection.last_sync_at,
        syncContacts: connection.sync_contacts,
        syncLeads: connection.sync_leads,
        syncDeals: connection.sync_deals,
        syncActivities: connection.sync_activities,
      };
    },
    enabled: !!companyId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Sync customer to CRM
  const syncCustomerMutation = useMutation({
    mutationFn: async (params: {
      customerEmail: string;
      customerName: string;
      customerPhone?: string;
      localCustomerId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('crm-adapter', {
        body: {
          action: 'sync_customer',
          ...params,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connection'] });
    },
  });

  // Log activity to CRM
  const logActivityMutation = useMutation({
    mutationFn: async (params: {
      activity: CRMActivity;
    }) => {
      const { data, error } = await supabase.functions.invoke('crm-adapter', {
        body: {
          action: 'log_activity',
          ...params,
        },
      });

      if (error) throw error;
      return data;
    },
  });

  // Sync appointment to CRM
  const syncAppointmentMutation = useMutation({
    mutationFn: async (params: {
      appointmentData: {
        service_type: string;
        datetime: string;
        notes?: string;
      };
      crmContactId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('crm-adapter', {
        body: {
          action: 'sync_appointment',
          ...params,
        },
      });

      if (error) throw error;
      return data;
    },
  });

  // Helper to sync customer if CRM is connected (non-blocking)
  const trySyncCustomer = async (
    customerEmail: string,
    customerName: string,
    customerPhone?: string,
    showToast = false
  ) => {
    if (!connectionStatus?.connected) return null;

    try {
      const result = await syncCustomerMutation.mutateAsync({
        customerEmail,
        customerName,
        customerPhone,
      });
      
      if (showToast && result?.data) {
        toast.success('Customer synced to CRM');
      }
      
      return result;
    } catch (error) {
      console.warn('CRM sync failed (non-blocking):', error);
      return null;
    }
  };

  // Helper to log activity if CRM is connected (non-blocking)
  const tryLogActivity = async (activity: CRMActivity, showToast = false) => {
    if (!connectionStatus?.connected) return null;

    try {
      const result = await logActivityMutation.mutateAsync({ activity });
      
      if (showToast && result?.data) {
        toast.success('Activity logged to CRM');
      }
      
      return result;
    } catch (error) {
      console.warn('CRM activity log failed (non-blocking):', error);
      return null;
    }
  };

  // Helper to sync appointment if CRM is connected (non-blocking)
  const trySyncAppointment = async (
    appointmentData: { service_type: string; datetime: string; notes?: string },
    crmContactId?: string,
    showToast = false
  ) => {
    if (!connectionStatus?.connected) return null;

    try {
      const result = await syncAppointmentMutation.mutateAsync({
        appointmentData,
        crmContactId,
      });
      
      if (showToast && result?.data) {
        toast.success('Appointment synced to CRM');
      }
      
      return result;
    } catch (error) {
      console.warn('CRM appointment sync failed (non-blocking):', error);
      return null;
    }
  };

  return {
    // Connection status
    isConnected: connectionStatus?.connected ?? false,
    provider: connectionStatus?.provider ?? null,
    status: connectionStatus?.status ?? 'disconnected',
    lastSyncAt: connectionStatus?.lastSyncAt ?? null,
    isCheckingConnection,
    refetchConnection,

    // Sync settings
    syncContacts: connectionStatus?.syncContacts ?? false,
    syncLeads: connectionStatus?.syncLeads ?? false,
    syncDeals: connectionStatus?.syncDeals ?? false,
    syncActivities: connectionStatus?.syncActivities ?? false,

    // Mutations
    syncCustomer: syncCustomerMutation.mutate,
    logActivity: logActivityMutation.mutate,
    syncAppointment: syncAppointmentMutation.mutate,

    // Non-blocking helpers
    trySyncCustomer,
    tryLogActivity,
    trySyncAppointment,

    // Loading states
    isSyncingCustomer: syncCustomerMutation.isPending,
    isLoggingActivity: logActivityMutation.isPending,
    isSyncingAppointment: syncAppointmentMutation.isPending,
  };
}
