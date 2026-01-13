import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadAppointmentICS, getAppointmentIcsUrl } from '@/lib/calendarUtils';

interface AppointmentData {
  id: string;
  datetime: string;
  duration_minutes?: number;
  service_type: string;
  customer_name?: string;
  customer_address?: string;
  notes?: string;
  created_at?: string;
  customer_token?: string;
}

interface AddToCalendarButtonProps {
  appointment: AppointmentData;
  companyName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDropdown?: boolean;
}

export function AddToCalendarButton({
  appointment,
  companyName,
  variant = 'outline',
  size = 'default',
  showDropdown = true,
}: AddToCalendarButtonProps) {
  const handleDownload = () => {
    downloadAppointmentICS(appointment, companyName);
  };

  const handleGoogleCalendar = () => {
    const startDate = new Date(appointment.datetime);
    const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => 
      date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${appointment.service_type} with ${companyName}`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Service: ${appointment.service_type}\nProvider: ${companyName}${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}`,
      location: appointment.customer_address || '',
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const handleOutlook = () => {
    const startDate = new Date(appointment.datetime);
    const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      subject: `${appointment.service_type} with ${companyName}`,
      body: `Service: ${appointment.service_type}\nProvider: ${companyName}${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}`,
      location: appointment.customer_address || '',
    });

    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
  };

  if (!showDropdown) {
    return (
      <Button variant={variant} size={size} onClick={handleDownload}>
        <Calendar className="h-4 w-4 mr-2" />
        Add to Calendar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Calendar className="h-4 w-4 mr-2" />
          Download .ics file
          <span className="ml-auto text-xs text-card-foreground/50">All apps</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19.5 4H18V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H4.5C3.12 4 2 5.12 2 6.5v13C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 5.12 20.88 4 19.5 4zM20 19.5c0 .28-.22.5-.5.5h-15a.5.5 0 0 1-.5-.5V9h16v10.5z"/>
          </svg>
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.23V2.62q0-.47.32-.8.35-.32.8-.32H23.2q.47 0 .8.33.33.33.33.8V12zm-6 8.15V13.54l-5.38-1.8v.28q0 .49-.06.98-.06.49-.2.96-.14.47-.39.9-.25.43-.64.78-.39.37-.89.6l1.77.74v.47l-1.77-.76v.72l1.77.74v.46l-1.77-.73v.72l1.77.74v.46l-1.77-.73v.87h6.57zM7 17h2v-2.41H7V17zm0-3.18h2V11.4H7v2.42zm0-3.19h2V8.22H7v2.41zm0-3.18h2V5.04H7v2.41zm-5.23 12h4.46V6.77h-4.46v12.68z"/>
          </svg>
          Outlook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
