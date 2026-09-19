import { useQuery } from '@tanstack/react-query';
import { endOfMonth, startOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { APPOINTMENTS_QUERY_KEY, Appointment, CalendarSyncSummary } from '@/types/appointments';

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

interface Params {
  userId?: string;
  companyId?: string | null;
  month: Date;
  isAdmin: boolean;
}

async function fetchSyncMap(appointmentIds: string[]) {
  const { data } = await supabase
    .from('calendar_event_mappings')
    .select('appointment_id, google_event_id, sync_status, last_synced_at')
    .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : [EMPTY_UUID]);

  return new Map((data || []).map((m) => [m.appointment_id, m]));
}

/**
 * Appointments shown on the calendar for the visible month.
 * Admins see every company appointment; employees see the jobs assigned to them.
 */
export function useCalendarAppointments({ userId, companyId, month, isAdmin }: Params) {
  return useQuery({
    queryKey: [APPOINTMENTS_QUERY_KEY, userId, month, isAdmin, companyId],
    enabled: !!userId,
    queryFn: async (): Promise<Appointment[]> => {
      if (!userId) return [];
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      if (isAdmin && companyId) {
        const { data: companyAppointments, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('company_id', companyId)
          .gte('datetime', start.toISOString())
          .lte('datetime', end.toISOString());
        if (error) throw error;

        const appointmentIds = (companyAppointments || []).map((apt) => apt.id);
        const syncMap = await fetchSyncMap(appointmentIds);

        const { data: jobAssignments } = await supabase
          .from('job_assignments')
          .select('appointment_id, status, id, employee_id, profiles:employee_id(full_name)')
          .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : [EMPTY_UUID]);

        const jobMap = new Map(
          (jobAssignments || []).map((ja) => [
            ja.appointment_id,
            { ...ja, employee_name: (ja.profiles as { full_name?: string } | null)?.full_name || null },
          ]),
        );

        return (companyAppointments || [])
          .map((apt) => ({
            ...apt,
            job_status: jobMap.get(apt.id)?.status,
            job_id: jobMap.get(apt.id)?.id,
            job_employee_id: jobMap.get(apt.id)?.employee_id,
            job_employee_name: jobMap.get(apt.id)?.employee_name,
            calendar_sync: syncMap.get(apt.id) || null,
          }))
          .sort((a, b) => parseUTCDateTime(a.datetime).getTime() - parseUTCDateTime(b.datetime).getTime());
      }

      const { data: jobAssignments, error: jobError } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          appointments:appointment_id (
            id,
            company_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            service_type,
            datetime,
            duration_minutes,
            status,
            notes,
            intake_data
          )
        `)
        .eq('employee_id', userId)
        .not('status', 'eq', 'declined');
      if (jobError) throw jobError;

      const { data: directAppointments, error: directError } = await supabase
        .from('appointments')
        .select('*')
        .eq('employee_id', userId)
        .gte('datetime', start.toISOString())
        .lte('datetime', end.toISOString());
      if (directError) throw directError;

      const syncMap = await fetchSyncMap([
        ...(jobAssignments || []).filter((ja) => ja.appointments).map((ja) => ja.appointments!.id),
        ...(directAppointments || []).map((apt) => apt.id),
      ]);

      const assignedAppointments: Appointment[] = (jobAssignments || [])
        .filter((ja) => ja.appointments)
        .map((ja) => ({
          id: ja.appointments!.id,
          company_id: ja.appointments!.company_id,
          customer_name: ja.appointments!.customer_name,
          customer_email: ja.appointments!.customer_email,
          customer_phone: ja.appointments!.customer_phone,
          customer_address: ja.appointments!.customer_address,
          service_type: ja.appointments!.service_type,
          datetime: ja.appointments!.datetime,
          duration_minutes: ja.appointments!.duration_minutes,
          status: ja.appointments!.status,
          notes: ja.appointments!.notes,
          intake_data: (ja.appointments as { intake_data?: Record<string, unknown> | null }).intake_data ?? null,
          job_status: ja.status,
          job_id: ja.id,
          calendar_sync: syncMap.get(ja.appointments!.id) || null,
        }))
        .filter((apt) => {
          const aptDate = parseUTCDateTime(apt.datetime);
          return aptDate >= start && aptDate <= end;
        });

      const assignedIds = new Set(assignedAppointments.map((a) => a.id));
      const directOnly = (directAppointments || [])
        .filter((apt) => !assignedIds.has(apt.id))
        .map((apt) => ({
          ...apt,
          job_status: undefined,
          job_id: undefined,
          calendar_sync: syncMap.get(apt.id) || null,
        }));

      return [...assignedAppointments, ...directOnly].sort(
        (a, b) => parseUTCDateTime(a.datetime).getTime() - parseUTCDateTime(b.datetime).getTime(),
      );
    },
  });
}

export function summarizeCalendarSync(appointments?: Appointment[]): CalendarSyncSummary {
  return (
    appointments?.reduce(
      (acc, apt) => {
        if (!apt.calendar_sync?.google_event_id) acc.notSynced++;
        else if (apt.calendar_sync.sync_status === 'failed') acc.failed++;
        else acc.synced++;
        return acc;
      },
      { synced: 0, notSynced: 0, failed: 0 } as CalendarSyncSummary,
    ) ?? { synced: 0, notSynced: 0, failed: 0 }
  );
}
