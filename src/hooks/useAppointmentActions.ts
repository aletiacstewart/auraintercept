import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { APPOINTMENTS_QUERY_KEY } from '@/types/appointments';

type ActionName = 'cancel' | 'decline' | 'reschedule' | 'accept' | 'complete';

interface Params {
  companyId?: string | null;
  /** Called after any successful appointment action so the parent can close dialogs. */
  onActionDone?: (action: ActionName) => void;
}

async function notify(fn: string, body: Record<string, unknown>) {
  try {
    await supabase.functions.invoke(fn, { body });
  } catch (error) {
    console.error(`Failed to send ${fn} notification:`, error);
  }
}

/**
 * Every write action available from the appointment calendar.
 */
export function useAppointmentActions({ companyId, onActionDone }: Params) {
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
      if (error) throw error;
      await notify('send-appointment-email', { appointmentId, type: 'cancellation' });
      await notify('send-appointment-sms', { appointmentId, type: 'cancellation' });
      return appointmentId;
    },
    onSuccess: () => {
      refresh();
      toast.success('Appointment cancelled successfully');
      onActionDone?.('cancel');
    },
    onError: (error) => {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment');
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ jobId, appointmentId }: { jobId: string; appointmentId: string }) => {
      const { error: jobError } = await supabase.from('job_assignments').update({ status: 'declined' }).eq('id', jobId);
      if (jobError) throw jobError;

      const { error: aptError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      if (aptError) throw aptError;

      await notify('send-job-notification', {
        jobAssignmentId: jobId,
        notificationType: 'cancelled',
        recipientType: 'customer',
      });
      return jobId;
    },
    onSuccess: () => {
      refresh();
      toast.success('Appointment declined. Customer will be notified.');
      onActionDone?.('decline');
    },
    onError: (error) => {
      console.error('Failed to decline appointment:', error);
      toast.error('Failed to decline appointment');
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ appointmentId, newDatetime }: { appointmentId: string; newDatetime: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ datetime: newDatetime, status: 'scheduled' })
        .eq('id', appointmentId);
      if (error) throw error;
      await notify('send-appointment-email', { appointmentId, type: 'reschedule' });
      await notify('send-appointment-sms', { appointmentId, type: 'reschedule' });
      return appointmentId;
    },
    onSuccess: () => {
      refresh();
      toast.success('Appointment rescheduled! Customer will be notified.');
      onActionDone?.('reschedule');
    },
    onError: (error) => {
      console.error('Failed to reschedule appointment:', error);
      toast.error('Failed to reschedule appointment');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from('job_assignments').update({ status: 'accepted' }).eq('id', jobId);
      if (error) throw error;
      await notify('send-job-notification', {
        jobAssignmentId: jobId,
        notificationType: 'accepted',
        recipientType: 'customer',
      });
      return jobId;
    },
    onSuccess: () => {
      refresh();
      toast.success('Appointment accepted! Customer will be notified.');
      onActionDone?.('accept');
    },
    onError: (error) => {
      console.error('Failed to accept appointment:', error);
      toast.error('Failed to accept appointment');
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
      if (error) throw error;
      return appointmentId;
    },
    onSuccess: () => {
      refresh();
      toast.success('Appointment marked as completed');
      onActionDone?.('complete');
    },
    onError: (error) => {
      console.error('Failed to complete appointment:', error);
      toast.error('Failed to update appointment');
    },
  });

  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'full_sync', companyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      refresh();
      toast.success(`Synced ${data?.synced || 0} appointments to Google Calendar`);
    },
    onError: (error: Error) => {
      console.error('Bulk sync failed:', error);
      toast.error(error.message || 'Failed to sync appointments');
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'import_events', companyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      refresh();
      const results = data?.results || { imported: 0, skipped: 0 };
      toast.success(`Imported ${results.imported} events from Google Calendar (${results.skipped} skipped)`);
    },
    onError: (error: Error) => {
      console.error('Import failed:', error);
      toast.error(error.message || 'Failed to import from Google Calendar');
    },
  });

  return {
    refresh,
    cancelMutation,
    declineMutation,
    rescheduleMutation,
    acceptMutation,
    completeMutation,
    bulkSyncMutation,
    importMutation,
  };
}

export type AppointmentActions = ReturnType<typeof useAppointmentActions>;
