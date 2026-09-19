import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { Appointment } from '@/types/appointments';

interface CalendarGridProps {
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
}

/** Month view with a small preview of each day's appointments. */
export function CalendarGrid({
  appointments,
  selectedDate,
  onSelectDate,
  month,
  onMonthChange,
}: CalendarGridProps) {
  const appointmentsByDate = appointments.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const dateKey = format(parseUTCDateTime(apt.datetime), 'yyyy-MM-dd');
    (acc[dateKey] ||= []).push(apt);
    return acc;
  }, {});

  const datesWithAppointments = appointments.map((apt) => parseUTCDateTime(apt.datetime));

  const renderDayContent = (day: Date) => {
    const dayAppointments = appointmentsByDate[format(day, 'yyyy-MM-dd')] || [];
    if (dayAppointments.length === 0) return <span>{day.getDate()}</span>;

    return (
      <div className="flex w-full flex-col items-center">
        <span className="font-medium">{day.getDate()}</span>
        <div className="mt-0.5 flex max-h-[40px] w-full flex-col gap-0.5 overflow-hidden">
          {dayAppointments.slice(0, 2).map((apt) => (
            <div
              key={apt.id}
              className="w-full truncate rounded bg-accent/30 px-0.5 text-center text-[8px] leading-tight"
              title={`${format(parseUTCDateTime(apt.datetime), 'h:mm a')} - ${apt.service_type}${
                apt.job_employee_name ? ` (${apt.job_employee_name})` : ''
              }`}
            >
              {format(parseUTCDateTime(apt.datetime), 'h:mma').toLowerCase()}
            </div>
          ))}
          {dayAppointments.length > 2 && (
            <div className="text-center text-[7px] text-foreground">+{dayAppointments.length - 2} more</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </CardTitle>
        <CardDescription className="text-muted-foreground">Select a date to view appointments</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center overflow-x-auto p-2 sm:p-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          month={month}
          onMonthChange={onMonthChange}
          className={cn('pointer-events-auto p-0')}
          classNames={{
            cell: 'h-auto w-9 sm:w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
            day: cn(
              'h-auto min-h-[44px] sm:min-h-[50px] w-9 sm:w-12 p-1 font-normal aria-selected:opacity-100 flex flex-col items-center justify-start hover:bg-accent/50 rounded-md',
            ),
            head_cell: 'text-muted-foreground rounded-md w-9 sm:w-12 font-normal text-[0.7rem] sm:text-[0.8rem]',
          }}
          components={{ DayContent: ({ date }) => renderDayContent(date) }}
          modifiers={{ hasAppointment: datesWithAppointments }}
          modifiersStyles={{ hasAppointment: { fontWeight: 'bold' } }}
        />
      </CardContent>
    </Card>
  );
}
