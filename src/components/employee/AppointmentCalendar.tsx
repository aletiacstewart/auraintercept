import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useProfileGates } from '@/hooks/useProfileGates';
import { hasFieldTechnicians } from '@/lib/industryCapabilities';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { useCalendarAppointments, summarizeCalendarSync } from '@/hooks/useCalendarAppointments';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { Appointment } from '@/types/appointments';
import { CalendarGrid } from './calendar/CalendarGrid';
import { DayAppointmentList } from './calendar/DayAppointmentList';
import { AppointmentDetailsDialog } from './calendar/AppointmentDetailsDialog';
import { AppointmentActionDialogs, AppointmentDialogState } from './calendar/AppointmentActionDialogs';

const CLOSED_DIALOGS: AppointmentDialogState = {
  cancel: false,
  decline: false,
  reschedule: false,
  assign: false,
};

export function AppointmentCalendar() {
  const { user, userRole, companyId } = useAuth();
  const { pack } = useIndustryPack(companyId);
  const { hideDispatch, technicianNoun } = useProfileGates();
  const isFieldDispatch = hasFieldTechnicians(pack);
  const isAdmin = userRole === 'company_admin' || userRole === 'platform_admin';

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogs, setDialogs] = useState<AppointmentDialogState>(CLOSED_DIALOGS);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState('');

  const setDialog = (key: keyof AppointmentDialogState, open: boolean) =>
    setDialogs((prev) => ({ ...prev, [key]: open }));

  const { data: googleCalendarConnection } = useQuery({
    queryKey: ['google-calendar-connection', companyId],
    enabled: !!companyId && isAdmin,
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('google_calendar_connections')
        .select('sync_enabled, calendar_id')
        .eq('company_id', companyId)
        .eq('sync_enabled', true)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: appointments, isLoading } = useCalendarAppointments({
    userId: user?.id,
    companyId,
    month,
    isAdmin,
  });

  const actions = useAppointmentActions({
    companyId,
    onActionDone: (action) => {
      setDialogs(CLOSED_DIALOGS);
      if (action !== 'accept') setSelectedAppointment(null);
    },
  });

  const selectedDayAppointments =
    appointments?.filter((apt) => isSameDay(parseUTCDateTime(apt.datetime), selectedDate)) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <CalendarGrid
        appointments={appointments ?? []}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        month={month}
        onMonthChange={setMonth}
      />

      <DayAppointmentList
        selectedDate={selectedDate}
        appointments={selectedDayAppointments}
        totalAppointments={appointments?.length ?? 0}
        isLoading={isLoading}
        isAdmin={isAdmin}
        isFieldDispatch={isFieldDispatch}
        hasGoogleCalendar={!!googleCalendarConnection?.sync_enabled}
        syncSummary={summarizeCalendarSync(appointments)}
        actions={actions}
        onSelectAppointment={setSelectedAppointment}
        onDeclineAppointment={(appointment) => {
          setSelectedAppointment(appointment);
          setDialog('decline', true);
        }}
      />

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        isAdmin={isAdmin}
        hideDispatch={hideDispatch}
        technicianNoun={technicianNoun}
        isFieldDispatch={isFieldDispatch}
        actions={actions}
        onRequestCancel={() => setDialog('cancel', true)}
        onRequestDecline={() => setDialog('decline', true)}
        onRequestAssign={() => setDialog('assign', true)}
        onRequestReschedule={() => {
          if (!selectedAppointment) return;
          const aptDate = parseUTCDateTime(selectedAppointment.datetime);
          setRescheduleDate(aptDate);
          setRescheduleTime(format(aptDate, 'HH:mm'));
          setDialog('reschedule', true);
        }}
      />

      <AppointmentActionDialogs
        appointment={selectedAppointment}
        dialogs={dialogs}
        setDialog={setDialog}
        rescheduleDate={rescheduleDate}
        setRescheduleDate={setRescheduleDate}
        rescheduleTime={rescheduleTime}
        setRescheduleTime={setRescheduleTime}
        actions={actions}
      />
    </div>
  );
}
