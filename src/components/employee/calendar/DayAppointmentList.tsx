import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Cloud,
  CloudOff,
  Download,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { CalendarSyncBadge } from '@/components/appointments/CalendarSyncBadge';
import { Appointment, CalendarSyncSummary } from '@/types/appointments';
import { AppointmentActions } from '@/hooks/useAppointmentActions';
import { getAppointmentStatusColor, JobStatusBadge } from './appointmentStatus';

interface DayAppointmentListProps {
  selectedDate: Date;
  appointments: Appointment[];
  totalAppointments: number;
  isLoading: boolean;
  isAdmin: boolean;
  isFieldDispatch: boolean;
  hasGoogleCalendar: boolean;
  syncSummary: CalendarSyncSummary;
  actions: AppointmentActions;
  onSelectAppointment: (appointment: Appointment) => void;
  onDeclineAppointment: (appointment: Appointment) => void;
}

/** The right-hand list of appointments for the selected day. */
export function DayAppointmentList({
  selectedDate,
  appointments,
  totalAppointments,
  isLoading,
  isAdmin,
  isFieldDispatch,
  hasGoogleCalendar,
  syncSummary,
  actions,
  onSelectAppointment,
  onDeclineAppointment,
}: DayAppointmentListProps) {
  const { acceptMutation, declineMutation, bulkSyncMutation, importMutation, refresh } = actions;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3">
          <div>
            <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </div>

          {isAdmin && hasGoogleCalendar && (
            <div className="flex flex-col gap-2">
              {totalAppointments > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <Cloud className="h-3 w-3" />
                    <span>{syncSummary.synced} synced</span>
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <CloudOff className="h-3 w-3" />
                    <span>{syncSummary.notSynced} not synced</span>
                  </div>
                  {syncSummary.failed > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
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
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <button
                key={appointment.id}
                className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => onSelectAppointment(appointment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-lg text-primary-foreground">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.customer_name}</p>
                      <p className="text-sm text-foreground">{appointment.service_type}</p>
                      {appointment.customer_address && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-foreground">
                          <MapPin className="h-3 w-3" />
                          {appointment.customer_address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="font-medium">{format(parseUTCDateTime(appointment.datetime), 'h:mm a')}</p>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={cn('text-xs', getAppointmentStatusColor(appointment.status))}>
                        {appointment.status}
                      </Badge>
                      <JobStatusBadge jobStatus={appointment.job_status} isFieldDispatch={isFieldDispatch} />
                      {appointment.job_status === 'pending_acceptance' && appointment.job_id && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 border-green-500/30 bg-green-500/10 px-2 text-xs text-green-600 hover:bg-green-500/20"
                            disabled={acceptMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptMutation.mutate(appointment.job_id!);
                            }}
                          >
                            {acceptMutation.isPending ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 border-red-500/30 bg-red-500/10 px-2 text-xs text-red-600 hover:bg-red-500/20"
                            disabled={declineMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeclineAppointment(appointment);
                            }}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
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
                        onRetrySuccess={refresh}
                        compact
                      />
                    </div>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-2 border-t border-border/50 pt-2">
                    <p className="flex items-start gap-1 text-xs text-foreground">
                      <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-2">{appointment.notes}</span>
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-foreground">No appointments on this day</p>
            <p className="text-sm text-foreground">Select another date or enjoy your day off!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
