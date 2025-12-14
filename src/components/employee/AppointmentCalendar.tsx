import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_type: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

export function AppointmentCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [month, setMonth] = useState<Date>(new Date());

  // Fetch appointments for the month
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['employee-appointments', user?.id, month],
    queryFn: async () => {
      if (!user?.id) return [];
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('employee_id', user.id)
        .gte('datetime', start.toISOString())
        .lte('datetime', end.toISOString())
        .order('datetime', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
    enabled: !!user?.id,
  });

  // Get appointments for selected date
  const selectedDayAppointments = appointments?.filter(
    (apt) => isSameDay(new Date(apt.datetime), selectedDate)
  ) ?? [];

  // Get dates with appointments for highlighting
  const datesWithAppointments = appointments?.map((apt) => new Date(apt.datetime)) ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'no-show':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <Card className="border-border/50 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </CardTitle>
          <CardDescription>
            Select a date to view appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={month}
            onMonthChange={setMonth}
            className={cn("p-0 pointer-events-auto")}
            modifiers={{
              hasAppointment: datesWithAppointments,
            }}
            modifiersStyles={{
              hasAppointment: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>
            {selectedDayAppointments.length} appointment{selectedDayAppointments.length !== 1 ? 's' : ''} scheduled
          </CardDescription>
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
                        <p className="text-sm text-muted-foreground">{appointment.service_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {format(new Date(appointment.datetime), 'h:mm a')}
                      </p>
                      <Badge variant="outline" className={cn('mt-1', getStatusColor(appointment.status))}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No appointments on this day</p>
              <p className="text-sm text-muted-foreground">Select another date or enjoy your day off!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment && format(new Date(selectedAppointment.datetime), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {selectedAppointment.customer_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedAppointment.customer_name}</p>
                  <Badge variant="outline" className={cn(getStatusColor(selectedAppointment.status))}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedAppointment.datetime), 'h:mm a')} - {selectedAppointment.duration_minutes} minutes
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedAppointment.service_type}</span>
                </div>

                {selectedAppointment.customer_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedAppointment.customer_phone}`} className="text-primary hover:underline">
                      {selectedAppointment.customer_phone}
                    </a>
                  </div>
                )}

                {selectedAppointment.customer_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedAppointment.customer_email}`} className="text-primary hover:underline">
                      {selectedAppointment.customer_email}
                    </a>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                {selectedAppointment.customer_phone && (
                  <OutboundCallDialog
                    trigger={
                      <Button variant="default" className="flex-1">
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
                <Button variant="outline" className="flex-1" onClick={() => setSelectedAppointment(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
