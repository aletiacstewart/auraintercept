import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Truck,
  CheckCircle2,
  Navigation,
  Phone,
  AlertCircle,
  Search,
  Timer
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';

interface Appointment {
  id: string;
  service_type: string;
  datetime: string;
  status: string;
  customer_name: string;
  customer_address: string | null;
  customer_phone: string | null;
}

interface JobAssignment {
  id: string;
  status: string;
  employee_id: string | null;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_arrival_minutes: number | null;
  technician_lat: number | null;
  technician_lng: number | null;
  customer_lat: number | null;
  customer_lng: number | null;
  notes: string | null;
}

interface Technician {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
}

interface AppointmentWithJob extends Appointment {
  job_assignment: JobAssignment | null;
  technician: Technician | null;
}

interface AppointmentTrackingViewProps {
  companyId: string;
  onCancel?: () => void;
}

export function AppointmentTrackingView({ companyId, onCancel }: AppointmentTrackingViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  

  // Search for appointments
  const { data: appointments = [], isLoading: searchLoading } = useQuery({
    queryKey: ['track-appointments', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      
      const { data: appts, error } = await supabase
        .from('appointments')
        .select(`
          id, service_type, datetime, status, customer_name, customer_address, customer_phone
        `)
        .eq('company_id', companyId)
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`)
        .order('datetime', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (appts || []) as Appointment[];
    },
    enabled: !!companyId && searchQuery.length >= 2,
  });

  // Fetch job assignment for selected appointment
  const { data: appointmentDetails } = useQuery({
    queryKey: ['appointment-details', selectedAppointment?.id],
    queryFn: async () => {
      if (!selectedAppointment) return null;

      // Get job assignment
      const { data: jobData } = await supabase
        .from('job_assignments')
        .select('*')
        .eq('appointment_id', selectedAppointment.id)
        .maybeSingle();

      let technician: Technician | null = null;
      if (jobData?.employee_id) {
        const { data: techData } = await supabase
          .from('profiles')
          .select('id, full_name, phone_number, avatar_url')
          .eq('id', jobData.employee_id)
          .single();
        technician = techData as Technician;
      }

      return {
        ...selectedAppointment,
        job_assignment: jobData as JobAssignment | null,
        technician,
      } as AppointmentWithJob;
    },
    enabled: !!selectedAppointment,
    refetchInterval: selectedAppointment?.status === 'scheduled' ? 30000 : false, // Auto-refresh for active appointments
  });

  const getJobStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return { 
          badge: <Badge variant="secondary">Pending Assignment</Badge>,
          icon: <Clock className="h-5 w-5 text-white" />,
          message: 'Waiting for technician assignment'
        };
      case 'accepted':
        return { 
          badge: <Badge className="bg-blue-100 text-blue-700">Technician Assigned</Badge>,
          icon: <User className="h-5 w-5 text-blue-600" />,
          message: 'A technician has been assigned to your appointment'
        };
      case 'en_route':
        return { 
          badge: <Badge className="bg-amber-100 text-amber-700">On The Way</Badge>,
          icon: <Truck className="h-5 w-5 text-amber-600 animate-pulse" />,
          message: 'Your technician is on the way!'
        };
      case 'arrived':
        return { 
          badge: <Badge className="bg-green-100 text-green-700">Arrived</Badge>,
          icon: <MapPin className="h-5 w-5 text-green-600" />,
          message: 'Your technician has arrived'
        };
      case 'in_progress':
        return { 
          badge: <Badge className="bg-purple-100 text-purple-700">In Progress</Badge>,
          icon: <Timer className="h-5 w-5 text-purple-600" />,
          message: 'Work is in progress'
        };
      case 'completed':
        return { 
          badge: <Badge className="bg-green-100 text-green-700">Completed</Badge>,
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          message: 'Service has been completed'
        };
      case 'cancelled':
        return { 
          badge: <Badge variant="destructive">Cancelled</Badge>,
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
          message: 'This appointment has been cancelled'
        };
      default:
        return { 
          badge: <Badge variant="outline">{status}</Badge>,
          icon: <Clock className="h-5 w-5 text-white" />,
          message: ''
        };
    }
  };

  const handleSelectAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
  };

  const handleBack = () => {
    if (selectedAppointment) {
      setSelectedAppointment(null);
    } else {
      onCancel?.();
    }
  };

  // Appointment Detail View
  if (selectedAppointment && appointmentDetails) {
    const job = appointmentDetails.job_assignment;
    const tech = appointmentDetails.technician;
    const statusInfo = getJobStatusInfo(job?.status || 'pending_acceptance');

    return (
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Appointment Status</h3>
        </div>

        {/* Status Card */}
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {statusInfo.icon}
              <div className="flex-1">
                {statusInfo.badge}
                <p className="text-sm text-white mt-1">{statusInfo.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ETA Card - Show when technician is en route */}
        {job?.status === 'en_route' && job.estimated_arrival_minutes && (
          <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Navigation className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    ETA: ~{job.estimated_arrival_minutes} minutes
                  </p>
                  {job.en_route_at && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Left {formatDistanceToNow(new Date(job.en_route_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-white" />
              <span>{format(parseUTCDateTime(appointmentDetails.datetime), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-white" />
              <span>{format(parseUTCDateTime(appointmentDetails.datetime), 'h:mm a')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-white" />
              <span>{appointmentDetails.service_type}</span>
            </div>
            {appointmentDetails.customer_address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-white mt-0.5" />
                <span>{appointmentDetails.customer_address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technician Card */}
        {tech && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Technician</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {tech.avatar_url ? (
                    <img 
                      src={tech.avatar_url} 
                      alt={tech.full_name || 'Technician'} 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{tech.full_name || 'Assigned Technician'}</p>
                  {tech.phone_number && (
                    <a 
                      href={`tel:${tech.phone_number}`}
                      className="text-sm text-primary flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {tech.phone_number}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {job && (job.accepted_at || job.en_route_at || job.arrived_at || job.completed_at) && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.accepted_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-white">
                      Technician assigned: {format(new Date(job.accepted_at), 'h:mm a')}
                    </span>
                  </div>
                )}
                {job.en_route_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-white">
                      Started driving: {format(new Date(job.en_route_at), 'h:mm a')}
                    </span>
                  </div>
                )}
                {job.arrived_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-white">
                      Arrived: {format(new Date(job.arrived_at), 'h:mm a')}
                    </span>
                  </div>
                )}
                {job.started_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-white">
                      Work started: {format(new Date(job.started_at), 'h:mm a')}
                    </span>
                  </div>
                )}
                {job.completed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                    <span className="text-white">
                      Completed: {format(new Date(job.completed_at), 'h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Search View
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 mb-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Track My Appointment</h3>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-4 w-4 text-white" />
          <span className="text-sm font-medium">Find Your Appointment</span>
        </div>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter your name or phone number..."
          className="h-9 text-sm"
        />
        <p className="text-xs text-white mt-1">
          We'll look up your appointments and show you the status.
        </p>
      </div>

      {/* Results */}
      <div className="border rounded-lg max-h-80 overflow-y-auto">
        {searchQuery.length < 2 ? (
          <div className="p-6 text-center text-sm text-white">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Enter at least 2 characters to search
          </div>
        ) : searchLoading ? (
          <div className="p-4 text-center text-sm text-white">Searching...</div>
        ) : appointments.length === 0 ? (
          <AuraEmptyState
            icon={MapPin}
            title="No appointments found"
            description="Appointments will show up here once they're booked. Try asking Aura to schedule one."
            compact
          />
        ) : (
          <div className="divide-y">
            {appointments.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => handleSelectAppointment(apt)}
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{apt.service_type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white">
                      <Calendar className="h-3 w-3" />
                      {format(parseUTCDateTime(apt.datetime), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <Badge variant={apt.status === 'completed' ? 'secondary' : 'default'}>
                    {apt.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
