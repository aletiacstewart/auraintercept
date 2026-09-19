import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
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
import { CalendarClock, Loader2 } from 'lucide-react';
import { TechnicianAssignmentDialog } from '@/components/appointments/TechnicianAssignmentDialog';
import { Appointment } from '@/types/appointments';
import { AppointmentActions } from '@/hooks/useAppointmentActions';

export interface AppointmentDialogState {
  cancel: boolean;
  decline: boolean;
  reschedule: boolean;
  assign: boolean;
}

interface AppointmentActionDialogsProps {
  appointment: Appointment | null;
  dialogs: AppointmentDialogState;
  setDialog: (key: keyof AppointmentDialogState, open: boolean) => void;
  rescheduleDate?: Date;
  setRescheduleDate: (date?: Date) => void;
  rescheduleTime: string;
  setRescheduleTime: (time: string) => void;
  actions: AppointmentActions;
}

/** Confirmation and form dialogs for cancel, decline, reschedule and technician assignment. */
export function AppointmentActionDialogs({
  appointment,
  dialogs,
  setDialog,
  rescheduleDate,
  setRescheduleDate,
  rescheduleTime,
  setRescheduleTime,
  actions,
}: AppointmentActionDialogsProps) {
  const { cancelMutation, declineMutation, rescheduleMutation } = actions;

  return (
    <>
      <AlertDialog open={dialogs.cancel} onOpenChange={(open) => setDialog('cancel', open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment with {appointment?.customer_name}?
              {appointment?.customer_email && ' A cancellation email will be sent to the customer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => appointment && cancelMutation.mutate(appointment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Appointment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogs.decline} onOpenChange={(open) => setDialog('decline', open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this appointment with {appointment?.customer_name}? The appointment will
              be cancelled and the customer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                appointment?.job_id &&
                declineMutation.mutate({ jobId: appointment.job_id, appointmentId: appointment.id })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                'Yes, Decline Appointment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FormShell
        id="reschedule-appointment"
        title="Reschedule Appointment"
        description={
          appointment ? `Choose a new date and time for ${appointment.customer_name}'s appointment.` : undefined
        }
        open={dialogs.reschedule}
        onOpenChange={(open) => setDialog('reschedule', open)}
        className="max-w-md"
      >
        <div className="space-y-4 pt-4">
          <div>
            <p className="mb-2 text-sm font-medium">Select Date</p>
            <Calendar
              mode="single"
              selected={rescheduleDate}
              onSelect={setRescheduleDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Select Time</p>
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
                if (appointment && rescheduleDate && rescheduleTime) {
                  const [hours, minutes] = rescheduleTime.split(':').map(Number);
                  const newDatetime = new Date(rescheduleDate);
                  newDatetime.setHours(hours, minutes, 0, 0);
                  rescheduleMutation.mutate({ appointmentId: appointment.id, newDatetime: newDatetime.toISOString() });
                }
              }}
            >
              {rescheduleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="mr-2 h-4 w-4" />
              )}
              Confirm Reschedule
            </Button>
            <Button variant="outline" onClick={() => setDialog('reschedule', false)}>
              Cancel
            </Button>
          </div>
        </div>
      </FormShell>

      {appointment && (
        <TechnicianAssignmentDialog
          open={dialogs.assign}
          onOpenChange={(open) => setDialog('assign', open)}
          appointment={{
            id: appointment.id,
            customer_name: appointment.customer_name,
            customer_address: appointment.customer_address,
            service_type: appointment.service_type,
            datetime: appointment.datetime,
            company_id: appointment.company_id,
          }}
          existingAssignment={
            appointment.job_id
              ? {
                  id: appointment.job_id,
                  employee_id: appointment.job_employee_id || null,
                  status: appointment.job_status || 'pending_acceptance',
                }
              : null
          }
        />
      )}
    </>
  );
}
