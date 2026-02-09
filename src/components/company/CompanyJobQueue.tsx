import { forwardRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { parseUTCDateTime } from '@/lib/dateUtils';
import {
  CheckCircle,
  XCircle,
  Navigation,
  MapPin,
  Play,
  Clock,
  Phone,
  User,
  Wrench,
  RefreshCw,
  Briefcase,
  Users,
} from 'lucide-react';

interface JobAssignment {
  id: string;
  appointment_id: string;
  employee_id: string | null;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  customer_address: string | null;
  estimated_arrival_minutes: number | null;
  notes: string | null;
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
  employee: {
    id: string;
    full_name: string;
    email: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending_acceptance: { label: 'Pending', color: 'text-warning', bgColor: 'bg-warning/10', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-secondary', bgColor: 'bg-secondary/10', icon: CheckCircle },
  en_route: { label: 'En Route', color: 'text-accent', bgColor: 'bg-accent/10', icon: Navigation },
  arrived: { label: 'Arrived', color: 'text-secondary', bgColor: 'bg-secondary/10', icon: MapPin },
  in_progress: { label: 'In Progress', color: 'text-accent', bgColor: 'bg-accent/10', icon: Play },
  completed: { label: 'Completed', color: 'text-secondary', bgColor: 'bg-secondary/10', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: XCircle },
};

export function CompanyJobQueue() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all active job assignments for the company
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
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
          ),
          employee:employee_id (
            id,
            full_name,
            email
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as JobAssignment[];
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  // Fetch completed jobs for the company (last 30 days)
  const { data: completedJobs, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['company-completed-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
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
          ),
          employee:employee_id (
            id,
            full_name,
            email
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as JobAssignment[];
    },
    enabled: !!companyId,
    refetchInterval: 60000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('company-job-assignments-realtime')
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

  // Group jobs by status
  const activeJobs = jobs?.filter(j => ['en_route', 'arrived', 'in_progress'].includes(j.status)) || [];
  const pendingJobs = jobs?.filter(j => j.status === 'pending_acceptance') || [];
  const acceptedJobs = jobs?.filter(j => j.status === 'accepted') || [];

  // Group completed jobs by employee
  const completedByEmployee = (completedJobs || []).reduce((acc, job) => {
    const employeeName = job.employee?.full_name || 'Unassigned';
    if (!acc[employeeName]) {
      acc[employeeName] = [];
    }
    acc[employeeName].push(job);
    return acc;
  }, {} as Record<string, JobAssignment[]>);

  if (isLoading || isLoadingCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            All Company Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalJobs = (activeJobs?.length || 0) + (pendingJobs?.length || 0) + (acceptedJobs?.length || 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              All Company Jobs
              <Badge variant="secondary">{totalJobs}</Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              View-only job queue for CRM sync and monitoring
            </CardDescription>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active Jobs ({activeJobs.length})
            </h3>
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Pending Jobs */}
        {pendingJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Awaiting Response ({pendingJobs.length})
            </h3>
            <div className="space-y-2">
              {pendingJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Accepted Jobs */}
        {acceptedJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Upcoming Jobs ({acceptedJobs.length})
            </h3>
            <div className="space-y-2">
              {acceptedJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalJobs === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">No Active Jobs</p>
            <p className="text-sm text-muted-foreground">
              Job assignments will appear here when created
            </p>
          </div>
        )}

        {/* Completed Jobs by Employee */}
        {Object.keys(completedByEmployee).length > 0 && (
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Completed Jobs (Last 30 Days) — {completedJobs?.length || 0} total
            </h3>
            <div className="space-y-4">
              {Object.entries(completedByEmployee).map(([employeeName, employeeJobs]) => (
                <div key={employeeName} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{employeeName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {employeeJobs.length} completed
                    </Badge>
                  </div>
                  <div className="space-y-2 pl-6">
                    {employeeJobs.slice(0, 5).map((job) => (
                      <CompletedJobRow key={job.id} job={job} />
                    ))}
                    {employeeJobs.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        + {employeeJobs.length - 5} more completed jobs
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const JobRow = forwardRef<HTMLDivElement, { job: JobAssignment }>(({ job }, ref) => {
  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending_acceptance;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      ref={ref}
      className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
    >
      {/* Status Badge */}
      <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
      </div>

      {/* Job Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">
            {job.appointments?.customer_name || 'Unknown Customer'}
          </span>
          <Badge variant="outline" className="text-xs text-foreground border-border">
            {job.appointments?.service_type || 'Service'}
          </Badge>
          <Badge className={`text-xs ${statusConfig.bgColor} ${statusConfig.color} border-0`}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          {job.appointments?.datetime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseUTCDateTime(job.appointments.datetime), 'MMM d, h:mm a')}
            </span>
          )}
          {job.customer_address && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="h-3 w-3" />
              {job.customer_address}
            </span>
          )}
          {job.appointments?.customer_phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {job.appointments.customer_phone}
            </span>
          )}
        </div>

        {/* Assigned Employee */}
        <div className="flex items-center gap-2 text-xs">
          <User className="h-3 w-3 text-muted-foreground" />
          {job.employee ? (
            <span className="text-foreground font-medium">{job.employee.full_name}</span>
          ) : (
            <span className="text-muted-foreground italic">Unassigned</span>
          )}
          {job.assigned_at && (
            <span className="text-muted-foreground">
              • Assigned {formatDistanceToNow(new Date(job.assigned_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
JobRow.displayName = 'JobRow';

const CompletedJobRow = forwardRef<HTMLDivElement, { job: JobAssignment }>(({ job }, ref) => {
  return (
    <div ref={ref} className="flex items-center gap-3 p-2 rounded-md border bg-muted/30 text-sm">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate">{job.appointments?.customer_name || 'Unknown'}</span>
        <span className="text-muted-foreground"> — </span>
        <span className="text-muted-foreground">{job.appointments?.service_type || 'Service'}</span>
      </div>
      {job.completed_at && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {format(new Date(job.completed_at), 'MMM d')}
        </span>
      )}
    </div>
  );
});
CompletedJobRow.displayName = 'CompletedJobRow';
