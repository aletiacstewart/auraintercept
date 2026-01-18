import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Activity,
  Clock,
  Navigation,
  MapPin,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Wrench,
  Phone,
  ArrowRight,
} from 'lucide-react';

interface JobAssignment {
  id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  customer_address: string | null;
  estimated_arrival_minutes: number | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    service_type: string;
    datetime: string;
  } | null;
  employee: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending_acceptance: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-secondary', bgColor: 'bg-secondary/10', icon: CheckCircle },
  en_route: { label: 'En Route', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10', icon: Navigation },
  arrived: { label: 'Arrived', color: 'text-accent', bgColor: 'bg-accent/10', icon: MapPin },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: Play },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: XCircle },
};

const STATUS_ORDER = ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed'];

interface JobStatusMonitorProps {
  companyId: string;
}

export function JobStatusMonitor({ companyId }: JobStatusMonitorProps) {
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'all'>('active');

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['job-monitor', companyId, selectedTab],
    queryFn: async () => {
      let query = supabase
        .from('job_assignments')
        .select(`
          *,
          appointments:appointment_id (
            id,
            customer_name,
            customer_phone,
            service_type,
            datetime
          ),
          employee:employee_id (
            id,
            full_name,
            phone_number
          )
        `)
        .eq('company_id', companyId)
        .order('assigned_at', { ascending: false })
        .limit(50);

      if (selectedTab === 'active') {
        query = query.in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress']);
      } else if (selectedTab === 'completed') {
        query = query.in('status', ['completed', 'declined', 'cancelled']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JobAssignment[];
    },
    enabled: !!companyId,
    refetchInterval: 15000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('job-monitor-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_assignments',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, refetch]);

  // Calculate stats
  const stats = {
    total: jobs?.length || 0,
    pending: jobs?.filter(j => j.status === 'pending_acceptance').length || 0,
    enRoute: jobs?.filter(j => j.status === 'en_route').length || 0,
    inProgress: jobs?.filter(j => j.status === 'in_progress').length || 0,
    completed: jobs?.filter(j => j.status === 'completed').length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Job Status Monitor
            </CardTitle>
            <CardDescription>Real-time technician job tracking</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="p-3 rounded-lg border text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-3 rounded-lg border text-center bg-yellow-50">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="p-3 rounded-lg border text-center bg-purple-50">
            <div className="text-2xl font-bold text-purple-600">{stats.enRoute}</div>
            <div className="text-xs text-muted-foreground">En Route</div>
          </div>
          <div className="p-3 rounded-lg border text-center bg-orange-50">
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="p-3 rounded-lg border text-center bg-green-50">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Jobs</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab}>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Wrench className="h-8 w-8 mb-2" />
                  <p>No jobs found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function JobCard({ job }: { job: JobAssignment }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending_acceptance;
  const StatusIcon = statusConfig.icon;
  const appointment = job.appointments;
  const employee = job.employee;

  return (
    <div 
      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{appointment?.service_type || 'Unknown Service'}</span>
            <Badge variant="outline" className={`${statusConfig.color} border-current`}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {appointment?.customer_name || 'Unknown'}
            </span>
            {employee && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span className="flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  {employee.full_name || 'Unassigned'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="text-right text-sm">
          <div className="font-medium">
            {appointment?.datetime ? format(new Date(appointment.datetime), 'h:mm a') : '-'}
          </div>
          <div className="text-muted-foreground">
            {formatDistanceToNow(new Date(job.assigned_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t">
          {/* Status Timeline */}
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-2">
            {STATUS_ORDER.map((status, index) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const isActive = job.status === status;
              const isPast = STATUS_ORDER.indexOf(job.status) > index;
              const timestamp = getStatusTimestamp(job, status);

              return (
                <div key={status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-1.5 rounded-full ${
                        isActive ? config.bgColor : isPast ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon className={`h-3 w-3 ${isActive ? config.color : isPast ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    {timestamp && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  {index < STATUS_ORDER.length - 1 && (
                    <div className={`w-4 h-0.5 ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {appointment?.customer_phone && (
              <a 
                href={`tel:${appointment.customer_phone}`}
                className="flex items-center gap-2 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
                Customer: {appointment.customer_phone}
              </a>
            )}
            {employee?.phone_number && (
              <a 
                href={`tel:${employee.phone_number}`}
                className="flex items-center gap-2 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
                Tech: {employee.phone_number}
              </a>
            )}
            {job.customer_address && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-3 w-3" />
                {job.customer_address}
              </div>
            )}
            {job.estimated_arrival_minutes && job.status === 'en_route' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                ETA: {job.estimated_arrival_minutes} min
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusTimestamp(job: JobAssignment, status: string): string | null {
  switch (status) {
    case 'pending_acceptance': return job.assigned_at;
    case 'accepted': return job.accepted_at;
    case 'en_route': return job.en_route_at;
    case 'arrived': return job.arrived_at;
    case 'in_progress': return job.started_at;
    case 'completed': return job.completed_at;
    default: return null;
  }
}
