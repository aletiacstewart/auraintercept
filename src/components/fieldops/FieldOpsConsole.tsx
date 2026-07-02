import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Map, 
  List, 
  Clock, 
  Navigation, 
  MapPin, 
  Play, 
  CheckCircle,
  RefreshCw,
  User,
  Wrench,
  Phone,
  ArrowRight,
  Bell,
  Truck,
  Users,
  ClipboardList
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { DispatcherMapView } from './DispatcherMapView';
import { RealTimeETASidebar } from './RealTimeETASidebar';
import { JobStatusMonitor } from '@/components/ai/agents/JobStatusMonitor';
import { cn } from '@/lib/utils';

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
  customer_lat: number | null;
  customer_lng: number | null;
  estimated_arrival_minutes: number | null;
  customer_notified_en_route: boolean | null;
  customer_notified_arrived: boolean | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    service_type: string;
    datetime: string;
  } | null;
  employee: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

// Aura Intercept themed status config with Cyan accents
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; iconColor: string; icon: React.ElementType }> = {
  pending_acceptance: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', iconColor: 'text-yellow-400', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-secondary', bgColor: 'bg-secondary/20', iconColor: 'text-secondary', icon: CheckCircle },
  en_route: { label: 'En Route', color: 'text-accent', bgColor: 'bg-accent/20', iconColor: 'text-accent', icon: Navigation },
  arrived: { label: 'On Site', color: 'text-accent', bgColor: 'bg-accent/20', iconColor: 'text-accent', icon: MapPin },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bgColor: 'bg-orange-500/20', iconColor: 'text-orange-400', icon: Play },
  completed: { label: 'Completed', color: 'text-accent', bgColor: 'bg-accent/20', iconColor: 'text-accent', icon: CheckCircle },
};

interface FieldOpsConsoleProps {
  companyId: string;
}

export function FieldOpsConsole({ companyId }: FieldOpsConsoleProps) {
  const [activeView, setActiveView] = useState<'map' | 'agenda' | 'jobs'>('map');
  const [showETASidebar, setShowETASidebar] = useState(true);

  // Fetch all active jobs for dispatchers
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['dispatcher-jobs', companyId],
    queryFn: async () => {
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
            datetime
          ),
          employee:employee_id (
            id,
            full_name,
            phone_number
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as JobAssignment[];
    },
    enabled: !!companyId,
    refetchInterval: 15000,
  });

  // Group jobs by status
  const jobsByStatus = useMemo(() => {
    if (!jobs) return {};
    return jobs.reduce((acc, job) => {
      const status = job.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(job);
      return acc;
    }, {} as Record<string, JobAssignment[]>);
  }, [jobs]);

  // Stats
  const stats = {
    total: jobs?.length || 0,
    pending: jobsByStatus.pending_acceptance?.length || 0,
    enRoute: jobsByStatus.en_route?.length || 0,
    onSite: (jobsByStatus.arrived?.length || 0) + (jobsByStatus.in_progress?.length || 0),
    notified: jobs?.filter(j => j.customer_notified_en_route || j.customer_notified_arrived).length || 0,
  };

  return (
    <div className="flex flex-col text-white" style={{ background: 'rgba(2,8,18,0.97)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(0,229,255,0.12)', background: 'rgba(2,6,14,0.98)', borderTop: '3px solid rgba(0,229,255,0.6)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Truck className="h-6 w-6 text-cyan-400" />
              Field Operations Console
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Real-time dispatcher view • Aura Intercept
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <StatBadge label="Active" value={stats.total} variant="default" />
              <StatBadge label="En Route" value={stats.enRoute} variant="accent" />
              <StatBadge label="On Site" value={stats.onSite} variant="accent" />
              <StatBadge label="Notified" value={stats.notified} icon={Bell} variant="success" />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between mt-4">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'map' | 'agenda' | 'jobs')}>
            <TabsList style={{ background: 'rgba(255,255,255,0.05)' }}>
              <TabsTrigger value="map" className="flex items-center gap-1.5 data-[state=active]:text-cyan-400">
                <Map className="h-3.5 w-3.5" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex items-center gap-1.5 data-[state=active]:text-cyan-400">
                <List className="h-3.5 w-3.5" />
                Agenda View
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-1.5 data-[state=active]:text-cyan-400">
                <ClipboardList className="h-3.5 w-3.5" />
                Job Status
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeView !== 'jobs' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowETASidebar(!showETASidebar)}
              className="text-cyan-400 hover:bg-cyan-400/10"
            >
              <Clock className="h-4 w-4 mr-2" />
              {showETASidebar ? 'Hide' : 'Show'} ETA Panel
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Main View */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'map' ? (
            <DispatcherMapView jobs={jobs || []} isLoading={isLoading} />
          ) : activeView === 'agenda' ? (
            <AgendaView jobs={jobs || []} isLoading={isLoading} jobsByStatus={jobsByStatus} />
          ) : (
            <div className="p-4 h-full overflow-auto">
              <JobStatusMonitor companyId={companyId} />
            </div>
          )}
        </div>

        {/* ETA Sidebar */}
        {showETASidebar && activeView !== 'jobs' && (
          <RealTimeETASidebar jobs={jobs || []} companyId={companyId} />
        )}
      </div>
    </div>
  );
}

function StatBadge({ 
  label, 
  value, 
  icon: Icon,
  variant = 'default' 
}: { 
  label: string; 
  value: number; 
  icon?: React.ElementType;
  variant?: 'default' | 'accent' | 'success';
}) {
  const variants = {
    default: 'bg-muted text-foreground',
    accent: 'bg-accent/20 text-accent',
    success: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2", variants[variant])}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}

interface AgendaViewProps {
  jobs: JobAssignment[];
  isLoading: boolean;
  jobsByStatus: Record<string, JobAssignment[]>;
}

function AgendaView({ jobs, isLoading, jobsByStatus }: AgendaViewProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'rgba(2,8,18,0.97)' }}>
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const statusOrder = ['in_progress', 'arrived', 'en_route', 'accepted', 'pending_acceptance'];

  return (
    <ScrollArea className="h-full p-4" style={{ background: 'rgba(3,9,20,0.95)' }}>
      <div className="space-y-6">
        {statusOrder.map((status) => {
          const statusJobs = jobsByStatus[status];
          if (!statusJobs || statusJobs.length === 0) return null;
          
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
                <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{config.label}</h3>
                <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                  {statusJobs.length}
                </Badge>
              </div>

              <div className="grid gap-3">
                {statusJobs.map((job) => (
                  <AgendaJobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto text-white/70 mb-4" />
            <p className="text-white/40">No active jobs</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function AgendaJobCard({ job }: { job: JobAssignment }) {
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending_acceptance;
  const Icon = config.icon;

  return (
    <div className="rounded-xl border transition-colors hover:border-cyan-400/20" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={cn("p-3 rounded-xl shrink-0", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>

          {/* Job Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold truncate text-foreground">
                {job.appointments?.service_type || 'Service'}
              </span>
              <Badge 
                variant="outline" 
                className={cn("border-current text-xs", config.color)}
              >
                {config.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {job.appointments?.customer_name || 'Customer'}
              </span>
              {job.employee && (
                <>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    {job.employee.full_name || 'Technician'}
                  </span>
                </>
              )}
            </div>

            {job.customer_address && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-white/40">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.customer_address}</span>
              </div>
            )}

            {/* ETA & Notification Status */}
            <div className="flex items-center gap-4 mt-3">
              {job.estimated_arrival_minutes && job.status === 'en_route' && (
                <div className="flex items-center gap-1.5 text-cyan-400 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  ETA: {job.estimated_arrival_minutes} min
                </div>
              )}
              {job.customer_notified_en_route && (
                <div className="flex items-center gap-1 text-green-400 text-xs">
                  <Bell className="h-3 w-3" />
                  Customer notified
                </div>
              )}
            </div>
          </div>

          {/* Time & Actions */}
          <div className="text-right shrink-0">
            <div className="font-semibold text-cyan-400">
              {job.appointments?.datetime 
                ? format(parseUTCDateTime(job.appointments.datetime), 'h:mm a') 
                : '-'}
            </div>
            <div className="text-xs text-white/40 mt-1">
              {formatDistanceToNow(new Date(job.assigned_at), { addSuffix: true })}
            </div>

            <div className="flex gap-2 mt-3">
              {job.appointments?.customer_phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-cyan-400 hover:bg-cyan-400/10"
                  onClick={() => window.open(`tel:${job.appointments?.customer_phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {job.employee?.phone_number && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/10"
                  onClick={() => window.open(`tel:${job.employee?.phone_number}`)}
                >
                  <Users className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
