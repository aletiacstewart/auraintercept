import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormShell } from '@/components/ui/form-shell';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, XCircle, CheckCircle, Loader2, MapPin, MessageSquare, RefreshCw, CloudOff, Cloud, AlertTriangle, Download, UserPlus, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';
import { toast } from 'sonner';
import { CalendarSyncBadge } from '@/components/appointments/CalendarSyncBadge';
import { TechnicianAssignmentDialog } from '@/components/appointments/TechnicianAssignmentDialog';
import { IntakeSummary } from '@/components/forms/IntakeSummary';

interface CalendarEventMapping {
  google_event_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
}

interface Appointment {
  id: string;
  company_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  intake_data?: unknown;
  job_status?: string;
  job_id?: string;
  job_employee_id?: string | null;
  job_employee_name?: string | null;
  calendar_sync?: CalendarEventMapping | null;
}

export function AppointmentCalendar() {
  const { user, userRole, companyId } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'company_admin' || userRole === 'platform_admin';
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [month, setMonth] = useState<Date>(new Date());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Check if Google Calendar is connected for this company
  const { data: googleCalendarConnection } = useQuery({
    queryKey: ['google-calendar-connection', companyId],
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
    enabled: !!companyId && isAdmin,
  });

  const hasGoogleCalendar = !!googleCalendarConnection?.sync_enabled;

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;

      // Send cancellation notifications
      try {
        await supabase.functions.invoke('send-appointment-email', {
          body: { appointmentId, type: 'cancellation' }
        });
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }

      try {
        await supabase.functions.invoke('send-appointment-sms', {
          body: { appointmentId, type: 'cancellation' }
        });
      } catch (smsError) {
        console.error('Failed to send cancellation SMS:', smsError);
      }

      return appointmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      toast.success('Appointment cancelled successfully');
      setSelectedAppointment(null);
      setCancelDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment');
    },
  });

  // Decline job mutation
  const declineMutation = useMutation({
    mutationFn: async ({ jobId, appointmentId }: { jobId: string; appointmentId: string }) => {
      const { error: jobError } = await supabase
        .from('job_assignments')
        .update({ status: 'declined' })
        .eq('id', jobId);
      if (jobError) throw jobError;

      const { error: aptError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      if (aptError) throw aptError;

      try {
        await supabase.functions.invoke('send-job-notification', {
          body: { jobAssignmentId: jobId, notificationType: 'cancelled', recipientType: 'customer' }
        });
      } catch (notifyError) {
        console.error('Failed to send decline notification:', notifyError);
      }

      return jobId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      toast.success('Appointment declined. Customer will be notified.');
      setSelectedAppointment(null);
      setDeclineDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to decline appointment:', error);
      toast.error('Failed to decline appointment');
    },
  });

  // Reschedule appointment mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ appointmentId, newDatetime }: { appointmentId: string; newDatetime: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ datetime: newDatetime, status: 'scheduled' })
        .eq('id', appointmentId);
      if (error) throw error;

      try {
        await supabase.functions.invoke('send-appointment-email', {
          body: { appointmentId, type: 'reschedule' }
        });
      } catch (e) { console.error('Reschedule email failed:', e); }

      try {
        await supabase.functions.invoke('send-appointment-sms', {
          body: { appointmentId, type: 'reschedule' }
        });
      } catch (e) { console.error('Reschedule SMS failed:', e); }

      return appointmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      toast.success('Appointment rescheduled! Customer will be notified.');
      setSelectedAppointment(null);
      setRescheduleDialogOpen(false);
      setRescheduleDate(undefined);
      setRescheduleTime('');
    },
    onError: (error) => {
      console.error('Failed to reschedule appointment:', error);
      toast.error('Failed to reschedule appointment');
    },
  });

  // Accept job mutation
  const acceptMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('job_assignments')
        .update({ status: 'accepted' })
        .eq('id', jobId);
      
      if (error) throw error;

      // Send confirmation notification to customer
      try {
        await supabase.functions.invoke('send-job-notification', {
          body: { jobAssignmentId: jobId, notificationType: 'accepted', recipientType: 'customer' }
        });
      } catch (notifyError) {
        console.error('Failed to send acceptance notification:', notifyError);
      }

      return jobId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      toast.success('Appointment accepted! Customer will be notified.');
      setSelectedAppointment(null);
    },
    onError: (error) => {
      console.error('Failed to accept appointment:', error);
      toast.error('Failed to accept appointment');
    },
  });

  // Complete appointment mutation
  const completeMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
      
      if (error) throw error;
      return appointmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      toast.success('Appointment marked as completed');
      setSelectedAppointment(null);
    },
    onError: (error) => {
      console.error('Failed to complete appointment:', error);
      toast.error('Failed to update appointment');
    },
  });

  // Bulk sync all appointments to Google Calendar
  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'full_sync', companyId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      toast.success(`Synced ${data?.synced || 0} appointments to Google Calendar`);
    },
    onError: (error: any) => {
      console.error('Bulk sync failed:', error);
      toast.error(error.message || 'Failed to sync appointments');
    },
  });

  // Import events from Google Calendar
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'import_events', companyId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] });
      const results = data?.results || { imported: 0, skipped: 0 };
      toast.success(`Imported ${results.imported} events from Google Calendar (${results.skipped} skipped)`);
    },
    onError: (error: any) => {
      console.error('Import failed:', error);
      toast.error(error.message || 'Failed to import from Google Calendar');
    },
  });

  // Fetch appointments for the month - all company appointments for admins, or assigned jobs for employees
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['employee-calendar-appointments', user?.id, month, isAdmin, companyId],
    queryFn: async () => {
      if (!user?.id) return [];
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      // For admins: fetch ALL company appointments directly
      if (isAdmin && companyId) {
        const { data: allCompanyAppointments, error: companyError } = await supabase
          .from('appointments')
          .select('*')
          .eq('company_id', companyId)
          .gte('datetime', start.toISOString())
          .lte('datetime', end.toISOString());

        if (companyError) throw companyError;

        // Fetch calendar sync status
        const appointmentIds = (allCompanyAppointments || []).map(apt => apt.id);
        const { data: calendarMappings } = await supabase
          .from('calendar_event_mappings')
          .select('appointment_id, google_event_id, sync_status, last_synced_at')
          .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : ['00000000-0000-0000-0000-000000000000']);

        const syncMap = new Map(
          (calendarMappings || []).map(m => [m.appointment_id, m])
        );

        // Fetch job assignments for status info with employee names
        const { data: jobAssignments } = await supabase
          .from('job_assignments')
          .select('appointment_id, status, id, employee_id, profiles:employee_id(full_name)')
          .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : ['00000000-0000-0000-0000-000000000000']);

        const jobMap = new Map(
          (jobAssignments || []).map(ja => [ja.appointment_id, {
            ...ja,
            employee_name: (ja.profiles as any)?.full_name || null
          }])
        );

        return (allCompanyAppointments || [])
          .map(apt => ({
            ...apt,
            job_status: jobMap.get(apt.id)?.status,
            job_id: jobMap.get(apt.id)?.id,
            job_employee_id: jobMap.get(apt.id)?.employee_id,
            job_employee_name: jobMap.get(apt.id)?.employee_name,
            calendar_sync: syncMap.get(apt.id) || null,
          }))
          .sort((a, b) => parseUTCDateTime(a.datetime).getTime() - parseUTCDateTime(b.datetime).getTime());
      }
      
      // For employees: fetch via job_assignments to get assigned jobs
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
        .eq('employee_id', user.id)
        .not('status', 'eq', 'declined');

      if (jobError) throw jobError;

      // Also fetch directly assigned appointments (legacy or direct assignment)
      const { data: directAppointments, error: directError } = await supabase
        .from('appointments')
        .select('*')
        .eq('employee_id', user.id)
        .gte('datetime', start.toISOString())
        .lte('datetime', end.toISOString());

      if (directError) throw directError;

      // Fetch calendar sync status for all appointment IDs
      const allAppointmentIds = [
        ...(jobAssignments || []).filter(ja => ja.appointments).map(ja => ja.appointments!.id),
        ...(directAppointments || []).map(apt => apt.id)
      ];

      const { data: calendarMappings } = await supabase
        .from('calendar_event_mappings')
        .select('appointment_id, google_event_id, sync_status, last_synced_at')
        .in('appointment_id', allAppointmentIds.length > 0 ? allAppointmentIds : ['00000000-0000-0000-0000-000000000000']);

      const syncMap = new Map(
        (calendarMappings || []).map(m => [m.appointment_id, m])
      );

      // Combine both sources, filtering by date range
      const assignedAppointments: Appointment[] = (jobAssignments || [])
        .filter(ja => ja.appointments)
        .map(ja => ({
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
        .filter(apt => {
          const aptDate = parseUTCDateTime(apt.datetime);
          return aptDate >= start && aptDate <= end;
        });

      // Merge direct appointments (if not already in job assignments)
      const assignedIds = new Set(assignedAppointments.map(a => a.id));
      const directOnly = (directAppointments || [])
        .filter(apt => !assignedIds.has(apt.id))
        .map(apt => ({
          ...apt,
          job_status: undefined,
          job_id: undefined,
          calendar_sync: syncMap.get(apt.id) || null,
        }));

      const allAppointments = [...assignedAppointments, ...directOnly];
      
      return allAppointments.sort((a, b) => 
        parseUTCDateTime(a.datetime).getTime() - parseUTCDateTime(b.datetime).getTime()
      );
    },
    enabled: !!user?.id,
  });

  // Get appointments for selected date
  const selectedDayAppointments = appointments?.filter(
    (apt) => isSameDay(parseUTCDateTime(apt.datetime), selectedDate)
  ) ?? [];

  // Get dates with appointments for highlighting
  const datesWithAppointments = appointments?.map((apt) => parseUTCDateTime(apt.datetime)) ?? [];

  // Calculate sync status summary
  const syncSummary = appointments?.reduce(
    (acc, apt) => {
      if (!apt.calendar_sync?.google_event_id) {
        acc.notSynced++;
      } else if (apt.calendar_sync.sync_status === 'failed') {
        acc.failed++;
      } else {
        acc.synced++;
      }
      return acc;
    },
    { synced: 0, notSynced: 0, failed: 0 }
  ) ?? { synced: 0, notSynced: 0, failed: 0 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-cyan-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'no-show':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getJobStatusBadge = (jobStatus?: string) => {
    if (!jobStatus) return null;
    const colors: Record<string, string> = {
      pending_acceptance: 'bg-warning/10 text-warning',
      accepted: 'bg-secondary/10 text-secondary',
      en_route: 'bg-accent/10 text-accent',
      arrived: 'bg-secondary/10 text-secondary',
      in_progress: 'bg-accent/10 text-accent',
      completed: 'bg-secondary/10 text-secondary',
    };
    const labels: Record<string, string> = {
      pending_acceptance: 'Pending',
      accepted: 'Accepted',
      en_route: 'En Route',
      arrived: 'Arrived',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    return (
      <Badge variant="outline" className={cn('text-xs', colors[jobStatus] || 'bg-muted')}>
        {labels[jobStatus] || jobStatus}
      </Badge>
    );
  };

  // Group appointments by date for inline display
  const appointmentsByDate = appointments?.reduce((acc, apt) => {
    const dateKey = format(parseUTCDateTime(apt.datetime), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>) ?? {};

  // Custom day content renderer
  const renderDayContent = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[dateKey] || [];
    
    if (dayAppointments.length === 0) {
      return <span>{day.getDate()}</span>;
    }

    return (
      <div className="flex flex-col items-center w-full">
        <span className="font-medium">{day.getDate()}</span>
        <div className="flex flex-col gap-0.5 w-full mt-0.5 max-h-[40px] overflow-hidden">
          {dayAppointments.slice(0, 2).map((apt, idx) => (
            <div 
              key={apt.id} 
              className="text-[8px] leading-tight bg-accent/30 rounded px-0.5 truncate w-full text-center"
              title={`${format(parseUTCDateTime(apt.datetime), 'h:mm a')} - ${apt.service_type}${apt.job_employee_name ? ` (${apt.job_employee_name})` : ''}`}
            >
              {format(parseUTCDateTime(apt.datetime), 'h:mma').toLowerCase()}
            </div>
          ))}
          {dayAppointments.length > 2 && (
            <div className="text-[7px] text-foreground text-center">
              +{dayAppointments.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select a date to view appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={month}
            onMonthChange={setMonth}
            className={cn("p-0 pointer-events-auto")}
            classNames={{
              cell: "h-auto w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn("h-auto min-h-[50px] w-12 p-1 font-normal aria-selected:opacity-100 flex flex-col items-center justify-start hover:bg-accent/50 rounded-md"),
              head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem]",
            }}
            components={{
              DayContent: ({ date }) => renderDayContent(date),
            }}
            modifiers={{
              hasAppointment: datesWithAppointments,
            }}
            modifiersStyles={{
              hasAppointment: {
                fontWeight: 'bold',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {selectedDayAppointments.length} appointment{selectedDayAppointments.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </div>
            {isAdmin && hasGoogleCalendar && (
              <div className="flex flex-col gap-2">
                {/* Sync Status Summary */}
                {appointments && appointments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <Cloud className="w-3 h-3" />
                      <span>{syncSummary.synced} synced</span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground">
                      <CloudOff className="w-3 h-3" />
                      <span>{syncSummary.notSynced} not synced</span>
                    </div>
                    {syncSummary.failed > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{syncSummary.failed} failed</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Import from Google
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkSyncMutation.mutate()}
                    disabled={bulkSyncMutation.isPending}
                  >
                    {bulkSyncMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync to Google
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : selectedDayAppointments.length > 0 ? (
            <div className="space-y-3">
              {selectedDayAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.customer_name}</p>
                        <p className="text-sm text-foreground">{appointment.service_type}</p>
                        {appointment.customer_address && (
                          <p className="text-xs text-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {appointment.customer_address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">
                        {format(parseUTCDateTime(appointment.datetime), 'h:mm a')}
                      </p>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="outline" className={cn('text-xs', getStatusColor(appointment.status))}>
                          {appointment.status}
                        </Badge>
                        {getJobStatusBadge(appointment.job_status)}
                        {appointment.job_status === 'pending_acceptance' && appointment.job_id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                              disabled={acceptMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptMutation.mutate(appointment.job_id!);
                              }}
                            >
                              {acceptMutation.isPending ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20"
                              disabled={declineMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(appointment);
                                setDeclineDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                        <CalendarSyncBadge
                          syncStatus={appointment.calendar_sync?.sync_status}
                          lastSyncedAt={appointment.calendar_sync?.last_synced_at}
                          googleEventId={appointment.calendar_sync?.google_event_id}
                          appointmentId={appointment.id}
                          companyId={appointment.company_id}
                          onRetrySuccess={() => queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] })}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                  {/* Show customer notes preview */}
                  {appointment.notes && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-foreground flex items-start gap-1">
                        <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{appointment.notes}</span>
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground">No appointments on this day</p>
              <p className="text-sm text-foreground">Select another date or enjoy your day off!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment && format(parseUTCDateTime(selectedAppointment.datetime), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {selectedAppointment.customer_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedAppointment.customer_name}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className={cn(getStatusColor(selectedAppointment.status))}>
                      {selectedAppointment.status}
                    </Badge>
                    {getJobStatusBadge(selectedAppointment.job_status)}
                    <CalendarSyncBadge
                      syncStatus={selectedAppointment.calendar_sync?.sync_status}
                      lastSyncedAt={selectedAppointment.calendar_sync?.last_synced_at}
                      googleEventId={selectedAppointment.calendar_sync?.google_event_id}
                      appointmentId={selectedAppointment.id}
                      companyId={selectedAppointment.company_id}
                      onRetrySuccess={() => queryClient.invalidateQueries({ queryKey: ['employee-calendar-appointments'] })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(parseUTCDateTime(selectedAppointment.datetime), 'h:mm a')} - {selectedAppointment.duration_minutes} minutes
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-foreground">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedAppointment.service_type}</span>
                </div>

                {selectedAppointment.customer_address && (
                  <div className="flex items-start gap-3 text-sm text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{selectedAppointment.customer_address}</span>
                  </div>
                )}

                {selectedAppointment.customer_phone && (
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedAppointment.customer_phone}`} className="text-primary hover:underline">
                      {selectedAppointment.customer_phone}
                    </a>
                  </div>
                )}

                {selectedAppointment.customer_email && (
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedAppointment.customer_email}`} className="text-primary hover:underline">
                      {selectedAppointment.customer_email}
                    </a>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Customer Notes
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap text-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}

                <IntakeSummary
                  intakeData={selectedAppointment.intake_data as Record<string, unknown> | null | undefined}
                  serviceType={selectedAppointment.service_type}
                />
              </div>

              {/* Assigned Technician Info */}
              {selectedAppointment.job_employee_name && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Assigned Technician</p>
                    <p className="text-sm text-foreground">{selectedAppointment.job_employee_name}</p>
                  </div>
                  {isAdmin && selectedAppointment.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignDialogOpen(true)}
                    >
                      Reassign
                    </Button>
                  )}
                </div>
              )}

              {/* Assign Technician Button for Admins */}
              {isAdmin && selectedAppointment.status === 'scheduled' && !selectedAppointment.job_employee_id && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Technician
                </Button>
              )}

              {selectedAppointment.job_status === 'pending_acceptance' && selectedAppointment.job_id && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => acceptMutation.mutate(selectedAppointment.job_id!)}
                    disabled={acceptMutation.isPending}
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeclineDialogOpen(true)}
                    disabled={declineMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}

              {/* Reschedule button for active appointments */}
              {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const aptDate = parseUTCDateTime(selectedAppointment.datetime);
                    setRescheduleDate(aptDate);
                    setRescheduleTime(format(aptDate, 'HH:mm'));
                    setRescheduleDialogOpen(true);
                  }}
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
              )}

              {selectedAppointment.status === 'scheduled' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => completeMutation.mutate(selectedAppointment.id)}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Mark Complete
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {selectedAppointment.customer_phone && (
                  <OutboundCallDialog
                    trigger={
                      <Button variant="outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Customer
                      </Button>
                    }
                    defaultPhone={selectedAppointment.customer_phone}
                    defaultName={selectedAppointment.customer_name}
                    appointmentDetails={{
                      service: selectedAppointment.service_type,
                      datetime: selectedAppointment.datetime,
                    }}
                  />
                )}
                <Button variant="ghost" onClick={() => setSelectedAppointment(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment with {selectedAppointment?.customer_name}? 
              {selectedAppointment?.customer_email && ' A cancellation email will be sent to the customer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAppointment && cancelMutation.mutate(selectedAppointment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Appointment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Confirmation Dialog */}
      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this appointment with {selectedAppointment?.customer_name}? 
              The appointment will be cancelled and the customer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAppointment?.job_id && declineMutation.mutate({ 
                jobId: selectedAppointment.job_id, 
                appointmentId: selectedAppointment.id 
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                'Yes, Decline Appointment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Form */}
      <FormShell
        id="reschedule-appointment"
        title="Reschedule Appointment"
        description={selectedAppointment ? `Choose a new date and time for ${selectedAppointment.customer_name}'s appointment.` : undefined}
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        className="max-w-md"
      >
          <div className="space-y-4 pt-4">
            <div>
              <p className="text-sm font-medium mb-2">Select Date</p>
              <Calendar
                mode="single"
                selected={rescheduleDate}
                onSelect={setRescheduleDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Select Time</p>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                disabled={!rescheduleDate || !rescheduleTime || rescheduleMutation.isPending}
                onClick={() => {
                  if (selectedAppointment && rescheduleDate && rescheduleTime) {
                    const [hours, minutes] = rescheduleTime.split(':').map(Number);
                    const newDatetime = new Date(rescheduleDate);
                    newDatetime.setHours(hours, minutes, 0, 0);
                    rescheduleMutation.mutate({
                      appointmentId: selectedAppointment.id,
                      newDatetime: newDatetime.toISOString(),
                    });
                  }
                }}
              >
                {rescheduleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarClock className="w-4 h-4 mr-2" />
                )}
                Confirm Reschedule
              </Button>
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
      </FormShell>

      {selectedAppointment && (
        <TechnicianAssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          appointment={{
            id: selectedAppointment.id,
            customer_name: selectedAppointment.customer_name,
            customer_address: selectedAppointment.customer_address,
            service_type: selectedAppointment.service_type,
            datetime: selectedAppointment.datetime,
            company_id: selectedAppointment.company_id,
          }}
          existingAssignment={selectedAppointment.job_id ? {
            id: selectedAppointment.job_id,
            employee_id: selectedAppointment.job_employee_id || null,
            status: selectedAppointment.job_status || 'pending_acceptance',
          } : null}
        />
      )}
    </div>
  );
}
