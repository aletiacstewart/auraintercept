import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInMinutes, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  CheckCircle,
  Clock,
  Phone,
  User,
  Wrench,
  RefreshCw,
  MapPin,
  FileText,
  Package,
  Car,
  Play,
  Timer,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CompletedJob {
  id: string;
  appointment_id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  customer_address: string | null;
  notes: string | null;
  parts_used: string | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    service_type: string;
    datetime: string;
    duration_minutes: number;
    notes: string | null;
  } | null;
}

export function CompletedJobsHistory() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this-month');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last-3-months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'all':
        return { start: null, end: null };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['completed-jobs', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('job_assignments')
        .select(`
          *,
          appointments:appointment_id (
            id,
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            datetime,
            duration_minutes,
            notes
          )
        `)
        .eq('employee_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (start && end) {
        query = query
          .gte('completed_at', start.toISOString())
          .lte('completed_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CompletedJob[];
    },
    enabled: !!user?.id,
  });

  // Filter jobs by search term
  const filteredJobs = jobs?.filter(job => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      job.appointments?.customer_name.toLowerCase().includes(searchLower) ||
      job.appointments?.service_type.toLowerCase().includes(searchLower) ||
      job.notes?.toLowerCase().includes(searchLower) ||
      job.parts_used?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate totals for the period
  const totalJobs = filteredJobs?.length || 0;
  const totalWorkMinutes = filteredJobs?.reduce((acc, job) => {
    if (job.started_at && job.completed_at) {
      return acc + differenceInMinutes(new Date(job.completed_at), new Date(job.started_at));
    }
    return acc;
  }, 0) || 0;
  const totalTravelMinutes = filteredJobs?.reduce((acc, job) => {
    if (job.en_route_at && job.arrived_at) {
      return acc + differenceInMinutes(new Date(job.arrived_at), new Date(job.en_route_at));
    }
    return acc;
  }, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalJobs}</p>
                <p className="text-xs text-muted-foreground">Jobs Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(totalWorkMinutes / 60 * 10) / 10}h</p>
                <p className="text-xs text-muted-foreground">Work Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(totalTravelMinutes / 60 * 10) / 10}h</p>
                <p className="text-xs text-muted-foreground">Travel Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, service, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Completed Jobs
          </CardTitle>
          <CardDescription>
            {filteredJobs?.length || 0} jobs found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredJobs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No completed jobs found for this period</p>
            </div>
          ) : (
            filteredJobs?.map((job) => (
              <CompletedJobCard 
                key={job.id} 
                job={job} 
                isExpanded={expandedJob === job.id}
                onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CompletedJobCardProps {
  job: CompletedJob;
  isExpanded: boolean;
  onToggle: () => void;
}

function CompletedJobCard({ job, isExpanded, onToggle }: CompletedJobCardProps) {
  const appointment = job.appointments;
  if (!appointment) return null;

  const travelTimeMinutes = job.en_route_at && job.arrived_at 
    ? differenceInMinutes(new Date(job.arrived_at), new Date(job.en_route_at))
    : null;
  
  const workTimeMinutes = job.started_at && job.completed_at
    ? differenceInMinutes(new Date(job.completed_at), new Date(job.started_at))
    : null;

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      {/* Header - Always visible */}
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">{appointment.service_type}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {appointment.customer_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right text-sm">
            <p className="font-medium">
              {job.completed_at && format(new Date(job.completed_at), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground">
              {job.completed_at && format(new Date(job.completed_at), 'h:mm a')}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Stats - Always visible */}
      <div className="flex gap-4 mt-3 text-xs">
        {travelTimeMinutes !== null && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Car className="w-3 h-3" />
            <span>{travelTimeMinutes} min travel</span>
          </div>
        )}
        {workTimeMinutes !== null && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wrench className="w-3 h-3" />
            <span>{workTimeMinutes} min work</span>
          </div>
        )}
        {job.parts_used && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="w-3 h-3" />
            <span>Parts used</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Scheduled: {format(new Date(appointment.datetime), 'MMM d, h:mm a')}</span>
            </div>
            {appointment.customer_phone && (
              <a 
                href={`tel:${appointment.customer_phone}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="w-4 h-4" />
                <span>{appointment.customer_phone}</span>
              </a>
            )}
            {job.customer_address && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="w-4 h-4" />
                <span>{job.customer_address}</span>
              </div>
            )}
          </div>

          {/* Time Tracking Details */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Timer className="w-3 h-3" />
              Time Tracking
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {job.en_route_at && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Travel Started</p>
                    <p className="font-medium">{format(new Date(job.en_route_at), 'h:mm a')}</p>
                  </div>
                </div>
              )}
              {job.arrived_at && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Arrived</p>
                    <p className="font-medium">{format(new Date(job.arrived_at), 'h:mm a')}</p>
                  </div>
                </div>
              )}
              {job.started_at && (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Job Started</p>
                    <p className="font-medium">{format(new Date(job.started_at), 'h:mm a')}</p>
                  </div>
                </div>
              )}
              {job.completed_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-medium">{format(new Date(job.completed_at), 'h:mm a')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 pt-2 border-t border-border/50 text-xs">
              {travelTimeMinutes !== null && (
                <div className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  <span className="text-muted-foreground">Travel:</span>
                  <span className="font-medium">{travelTimeMinutes} min</span>
                </div>
              )}
              {workTimeMinutes !== null && (
                <div className="flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  <span className="text-muted-foreground">Work:</span>
                  <span className="font-medium">{workTimeMinutes} min</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
                <FileText className="w-3 h-3" />
                Job Notes
              </p>
              <p className="text-sm">{job.notes}</p>
            </div>
          )}

          {/* Parts Used */}
          {job.parts_used && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
                <Package className="w-3 h-3" />
                Parts Used
              </p>
              <p className="text-sm">{job.parts_used}</p>
            </div>
          )}

          {/* Customer Notes (if any) */}
          {appointment.notes && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Customer Notes
              </p>
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}