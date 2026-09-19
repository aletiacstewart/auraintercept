import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CalendarClock,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';
import { CalendarSyncBadge } from '@/components/appointments/CalendarSyncBadge';
import { IntakeSummary } from '@/components/forms/IntakeSummary';
import { Appointment } from '@/types/appointments';
import { AppointmentActions } from '@/hooks/useAppointmentActions';
import { getAppointmentStatusColor, JobStatusBadge } from './appointmentStatus';

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  isAdmin: boolean;
  hideDispatch: boolean;
  technicianNoun: string;
  isFieldDispatch: boolean;
  actions: AppointmentActions;
  onRequestCancel: () => void;
  onRequestDecline: () => void;
  onRequestReschedule: () => void;
  onRequestAssign: () => void;
}

/** Full detail view for a single appointment, with all of its actions. */
export function AppointmentDetailsDialog({
  appointment,
  onClose,
  isAdmin,
  hideDispatch,
  technicianNoun,
  isFieldDispatch,
  actions,
  onRequestCancel,
  onRequestDecline,
  onRequestReschedule,
  onRequestAssign,
}: AppointmentDetailsDialogProps) {
  const { acceptMutation, declineMutation, completeMutation, refresh } = actions;

  return (
    <Dialog open={!!appointment} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            {appointment && format(parseUTCDateTime(appointment.datetime), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="gradient-primary flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-primary-foreground">
                {appointment.customer_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{appointment.customer_name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn(getAppointmentStatusColor(appointment.status))}>
                    {appointment.status}
                  </Badge>
                  <JobStatusBadge jobStatus={appointment.job_status} isFieldDispatch={isFieldDispatch} />
                  <CalendarSyncBadge
                    syncStatus={appointment.calendar_sync?.sync_status}
                    lastSyncedAt={appointment.calendar_sync?.last_synced_at}
                    googleEventId={appointment.calendar_sync?.google_event_id}
                    appointmentId={appointment.id}
                    companyId={appointment.company_id}
                    onRetrySuccess={refresh}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(parseUTCDateTime(appointment.datetime), 'h:mm a')} - {appointment.duration_minutes} minutes
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.service_type}</span>
              </div>

              {appointment.customer_address && (
                <div className="flex items-start gap-3 text-sm text-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{appointment.customer_address}</span>
                </div>
              )}

              {appointment.customer_phone && (
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${appointment.customer_phone}`} className="text-primary hover:underline">
                    {appointment.customer_phone}
                  </a>
                </div>
              )}

              {appointment.customer_email && (
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${appointment.customer_email}`} className="text-primary hover:underline">
                    {appointment.customer_email}
                  </a>
                </div>
              )}

              {appointment.notes && (
                <div className="pt-2">
                  <p className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Customer Notes
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                    {appointment.notes}
                  </p>
                </div>
              )}

              <IntakeSummary
                intakeData={appointment.intake_data as Record<string, unknown> | null | undefined}
                serviceType={appointment.service_type}
              />
            </div>

            {appointment.job_employee_name && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Assigned Technician</p>
                  <p className="text-sm text-foreground">{appointment.job_employee_name}</p>
                </div>
                {isAdmin && !hideDispatch && appointment.status === 'scheduled' && (
                  <Button variant="outline" size="sm" onClick={onRequestAssign}>
                    Reassign
                  </Button>
                )}
              </div>
            )}

            {isAdmin && !hideDispatch && appointment.status === 'scheduled' && !appointment.job_employee_id && (
              <Button variant="outline" className="w-full" onClick={onRequestAssign}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign {technicianNoun}
              </Button>
            )}

            {appointment.job_status === 'pending_acceptance' && appointment.job_id && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  onClick={() => acceptMutation.mutate(appointment.job_id!)}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={onRequestDecline}
                  disabled={declineMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>
            )}

            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <Button variant="outline" className="w-full" onClick={onRequestReschedule}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
            )}

            {appointment.status === 'scheduled' && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => completeMutation.mutate(appointment.id)}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark Complete
                </Button>
                <Button variant="destructive" className="flex-1" onClick={onRequestCancel}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {appointment.customer_phone && (
                <OutboundCallDialog
                  trigger={
                    <Button variant="outline" className="flex-1">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Customer
                    </Button>
                  }
                  defaultPhone={appointment.customer_phone}
                  defaultName={appointment.customer_name}
                  appointmentDetails={{ service: appointment.service_type, datetime: appointment.datetime }}
                />
              )}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
