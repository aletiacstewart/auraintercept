import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Calendar,
  FileText,
  Receipt,
  Send,
  UserPlus,
  AlertCircle,
  Eye,
  Mail,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { DispatcherMapView } from './DispatcherMapView';
import { RealTimeETASidebar } from './RealTimeETASidebar';
import { TechnicianAssignmentDialog } from '@/components/appointments/TechnicianAssignmentDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  technician_lat: number | null;
  technician_lng: number | null;
  estimated_arrival_minutes: number | null;
  customer_notified_en_route: boolean | null;
  customer_notified_arrived: boolean | null;
  employee_id: string | null;
  appointment_id: string | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    service_type: string;
    datetime: string;
    notes: string | null;
  } | null;
  employee: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    location_updated_at: string | null;
  } | null;
}

interface TechnicianLocation {
  id: string;
  full_name: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  location_updated_at: string | null;
  activeJobStatus?: string;
}

interface Quote {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  appointment_id: string | null;
}

interface Invoice {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  appointment_id: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; iconColor: string; icon: React.ElementType }> = {
  pending_acceptance: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', iconColor: 'text-yellow-400', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-blue-400', bgColor: 'bg-blue-500/20', iconColor: 'text-blue-400', icon: CheckCircle },
  en_route: { label: 'En Route', color: 'text-accent', bgColor: 'bg-accent/20', iconColor: 'text-accent', icon: Navigation },
  arrived: { label: 'On Site', color: 'text-accent', bgColor: 'bg-accent/20', iconColor: 'text-accent', icon: MapPin },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bgColor: 'bg-orange-500/20', iconColor: 'text-orange-400', icon: Play },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20', iconColor: 'text-green-400', icon: CheckCircle },
};

interface FieldOpsManagerProps {
  companyId: string;
}

export function FieldOpsManager({ companyId }: FieldOpsManagerProps) {
  const [activeView, setActiveView] = useState<'map' | 'agenda' | 'calendar'>('map');
  const [showETASidebar, setShowETASidebar] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyAutoSend, setNotifyAutoSend] = useState(true);
  const queryClient = useQueryClient();

  // Fetch all jobs (active and completed) for dispatchers
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['field-ops-manager-jobs', companyId],
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
            datetime,
            notes
          ),
          employee:employee_id (
            id,
            full_name,
            phone_number,
            current_latitude,
            current_longitude,
            location_updated_at
          )
        `)
        .eq('company_id', companyId)
        .order('assigned_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as JobAssignment[];
    },
    enabled: !!companyId,
    refetchInterval: 15000,
  });

  // Fetch all technicians for location tracking
  const { data: technicians = [] } = useQuery({
    queryKey: ['technician-locations', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          current_latitude,
          current_longitude,
          location_updated_at
        `)
        .eq('company_id', companyId)
        .not('current_latitude', 'is', null);

      if (error) throw error;
      return data as TechnicianLocation[];
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  // Fetch quotes for appointments  
  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ['appointment-quotes', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, customer_name, total_amount, status, created_at, appointment_id')
        .eq('company_id', companyId)
        .not('appointment_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Quote[];
    },
    enabled: !!companyId,
  });

  // Fetch invoices for appointments
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['appointment-invoices', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, customer_name, total, status, created_at, appointment_id')
        .eq('company_id', companyId)
        .not('appointment_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Invoice[];
    },
    enabled: !!companyId,
  });

  // Fetch all appointments for calendar view
  const { data: appointments = [] } = useQuery({
    queryKey: ['field-ops-appointments', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId)
        .gte('datetime', new Date().toISOString().split('T')[0])
        .order('datetime', { ascending: true })
        .limit(200);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ jobId, message, channels }: { jobId: string; message: string; channels: { email: boolean; sms: boolean } }) => {
      const { error } = await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: jobId,
          notificationType: 'update',
          recipientType: 'customer',
          customMessage: message,
          channels
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notification sent to customer');
      setShowNotifyDialog(false);
      setNotifyMessage('');
    },
    onError: (error) => {
      console.error('Notification error:', error);
      toast.error('Failed to send notification');
    }
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

  // Active jobs (not completed)
  const activeJobs = useMemo(() => {
    return jobs?.filter(j => j.status !== 'completed' && j.status !== 'cancelled') || [];
  }, [jobs]);

  // Get quotes/invoices for a specific appointment
  const getAppointmentFinancials = (appointmentId: string | null | undefined) => {
    if (!appointmentId) return { quotes: [], invoices: [] };
    return {
      quotes: quotes.filter(q => q.appointment_id === appointmentId),
      invoices: invoices.filter(i => i.appointment_id === appointmentId)
    };
  };

  // Stats
  const stats = {
    total: activeJobs.length,
    pending: jobsByStatus.pending_acceptance?.length || 0,
    enRoute: jobsByStatus.en_route?.length || 0,
    onSite: (jobsByStatus.arrived?.length || 0) + (jobsByStatus.in_progress?.length || 0),
    completed: jobsByStatus.completed?.length || 0,
    trackingTechs: technicians.filter(t => t.current_latitude && t.current_longitude).length,
  };

  const handleAssignTechnician = (job: JobAssignment) => {
    setSelectedJob(job);
    setShowAssignDialog(true);
  };

  const handleNotifyCustomer = (job: JobAssignment) => {
    setSelectedJob(job);
    setNotifyMessage(`Update regarding your ${job.appointments?.service_type || 'service'} appointment: `);
    setShowNotifyDialog(true);
  };

  const handleSendNotification = (channels: { email: boolean; sms: boolean }) => {
    if (!selectedJob || !notifyMessage.trim()) return;
    sendNotificationMutation.mutate({
      jobId: selectedJob.id,
      message: notifyMessage,
      channels
    });
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Truck className="h-6 w-6 text-accent" />
              Field Ops Manager
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Dispatch, track & manage field operations
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Quick Stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="Active" value={stats.total} variant="default" />
              <StatBadge label="En Route" value={stats.enRoute} variant="accent" />
              <StatBadge label="On Site" value={stats.onSite} variant="accent" />
              <StatBadge label="Tracking" value={stats.trackingTechs} icon={MapPin} variant="success" />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="border-accent/50 text-accent hover:bg-accent/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'map' | 'agenda' | 'calendar')}>
            <TabsList className="bg-muted">
              <TabsTrigger 
                value="map" 
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Map className="h-4 w-4 mr-2" />
                Map View
              </TabsTrigger>
              <TabsTrigger 
                value="agenda"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <List className="h-4 w-4 mr-2" />
                Agenda View
              </TabsTrigger>
              <TabsTrigger 
                value="calendar"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowETASidebar(!showETASidebar)}
            className="text-accent hover:bg-accent/20"
          >
            <Clock className="h-4 w-4 mr-2" />
            {showETASidebar ? 'Hide' : 'Show'} ETA Panel
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main View */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'map' ? (
            <DispatcherMapView 
              jobs={activeJobs} 
              isLoading={isLoading}
              onJobSelect={(job) => setSelectedJob(job as any)}
            />
          ) : activeView === 'agenda' ? (
            <AgendaView 
              jobs={activeJobs} 
              completedJobs={jobsByStatus.completed || []}
              isLoading={isLoading} 
              jobsByStatus={jobsByStatus}
              onAssign={handleAssignTechnician}
              onNotify={handleNotifyCustomer}
              getAppointmentFinancials={getAppointmentFinancials}
            />
          ) : (
            <CalendarView 
              appointments={appointments}
              jobs={jobs || []}
              onAssign={handleAssignTechnician}
            />
          )}
        </div>

        {/* ETA Sidebar */}
        {showETASidebar && (
          <RealTimeETASidebar jobs={activeJobs} companyId={companyId} />
        )}
      </div>

      {/* Assignment Dialog */}
      {selectedJob && selectedJob.appointments && (
        <TechnicianAssignmentDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          appointment={{
            id: selectedJob.appointments.id,
            customer_name: selectedJob.appointments.customer_name,
            customer_email: selectedJob.appointments.customer_email,
            customer_phone: selectedJob.appointments.customer_phone,
            customer_address: selectedJob.customer_address,
            service_type: selectedJob.appointments.service_type,
            datetime: selectedJob.appointments.datetime,
            company_id: companyId
          }}
          existingAssignment={selectedJob.employee_id ? {
            id: selectedJob.id,
            employee_id: selectedJob.employee_id,
            status: selectedJob.status
          } : undefined}
        />
      )}

      {/* Notify Customer Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Notify Customer
            </DialogTitle>
            <DialogDescription>
              Send an update to {selectedJob?.appointments?.customer_name || 'the customer'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendNotification({ email: true, sms: false })}
                  disabled={sendNotificationMutation.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendNotification({ email: false, sms: true })}
                  disabled={sendNotificationMutation.isPending}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS Only
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotifyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSendNotification({ email: true, sms: true })}
              disabled={sendNotificationMutation.isPending || !notifyMessage.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Both
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  completedJobs: JobAssignment[];
  isLoading: boolean;
  jobsByStatus: Record<string, JobAssignment[]>;
  onAssign: (job: JobAssignment) => void;
  onNotify: (job: JobAssignment) => void;
  getAppointmentFinancials: (appointmentId: string | null | undefined) => { quotes: Quote[]; invoices: Invoice[] };
}

function AgendaView({ jobs, completedJobs, isLoading, jobsByStatus, onAssign, onNotify, getAppointmentFinancials }: AgendaViewProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const statusOrder = ['in_progress', 'arrived', 'en_route', 'accepted', 'pending_acceptance'];

  return (
    <ScrollArea className="h-full p-4 bg-background">
      <div className="space-y-6">
        {/* Active Jobs */}
        {statusOrder.map((status) => {
          const statusJobs = jobsByStatus[status];
          if (!statusJobs || statusJobs.length === 0) return null;
          
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                </div>
                <h3 className="font-semibold text-lg">{config.label}</h3>
                <Badge variant="outline" className="border-accent/50 text-accent">
                  {statusJobs.length}
                </Badge>
              </div>

              <div className="grid gap-3">
                {statusJobs.map((job) => (
                  <AgendaJobCard 
                    key={job.id} 
                    job={job} 
                    onAssign={onAssign}
                    onNotify={onNotify}
                    financials={getAppointmentFinancials(job.appointments?.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No active jobs</p>
          </div>
        )}

        {/* Completed Jobs Toggle */}
        {completedJobs.length > 0 && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Completed Jobs ({completedJobs.length})
              </span>
              <span>{showCompleted ? '▲' : '▼'}</span>
            </Button>
            
            {showCompleted && (
              <div className="grid gap-3 mt-3">
                {completedJobs.slice(0, 10).map((job) => (
                  <AgendaJobCard 
                    key={job.id} 
                    job={job} 
                    onAssign={onAssign}
                    onNotify={onNotify}
                    financials={getAppointmentFinancials(job.appointments?.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function AgendaJobCard({ 
  job, 
  onAssign, 
  onNotify,
  financials 
}: { 
  job: JobAssignment; 
  onAssign: (job: JobAssignment) => void;
  onNotify: (job: JobAssignment) => void;
  financials: { quotes: Quote[]; invoices: Invoice[] };
}) {
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending_acceptance;
  const Icon = config.icon;
  const isOnSite = job.status === 'arrived' || job.status === 'in_progress';

  return (
    <Card className="bg-card border-border hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon with On-Site Indicator */}
          <div className="relative">
            <div className={cn("p-3 rounded-xl shrink-0", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            {isOnSite && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                <MapPin className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold truncate">
                {job.appointments?.service_type || 'Service'}
              </span>
              <Badge 
                variant="outline" 
                className={cn("border-current text-xs", config.color)}
              >
                {config.label}
              </Badge>
              {isOnSite && (
                <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  On Site
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {job.appointments?.customer_name || 'Customer'}
              </span>
              {job.employee ? (
                <>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    {job.employee.full_name || 'Technician'}
                  </span>
                </>
              ) : (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-xs">
                  Unassigned
                </Badge>
              )}
            </div>

            {job.customer_address && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.customer_address}</span>
              </div>
            )}

            {/* ETA, Notifications & Financials */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {job.estimated_arrival_minutes && job.status === 'en_route' && (
                <div className="flex items-center gap-1.5 text-accent text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  ETA: {job.estimated_arrival_minutes} min
                </div>
              )}
              {job.customer_notified_en_route && (
                <div className="flex items-center gap-1 text-green-400 text-xs">
                  <Bell className="h-3 w-3" />
                  Notified
                </div>
              )}
              
              {/* Quotes & Invoices */}
              {financials.quotes.length > 0 && (
                <div className="flex items-center gap-1 text-blue-400 text-xs">
                  <FileText className="h-3 w-3" />
                  {financials.quotes.length} Quote{financials.quotes.length > 1 ? 's' : ''}
                </div>
              )}
              {financials.invoices.length > 0 && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs">
                  <Receipt className="h-3 w-3" />
                  {financials.invoices.length} Invoice{financials.invoices.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Time & Actions */}
          <div className="text-right shrink-0">
            <div className="font-semibold text-accent">
              {job.appointments?.datetime 
                ? format(new Date(job.appointments.datetime), 'h:mm a') 
                : '-'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(job.assigned_at), { addSuffix: true })}
            </div>

            <div className="flex gap-2 mt-3 flex-wrap justify-end">
              {/* Assign/Reassign Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-blue-400 hover:bg-blue-500/20"
                onClick={() => onAssign(job)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              
              {/* Notify Customer Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-accent hover:bg-accent/20"
                onClick={() => onNotify(job)}
              >
                <Bell className="h-4 w-4" />
              </Button>

              {/* Call Customer */}
              {job.appointments?.customer_phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:bg-muted"
                  onClick={() => window.open(`tel:${job.appointments?.customer_phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CalendarViewProps {
  appointments: any[];
  jobs: JobAssignment[];
  onAssign: (job: JobAssignment) => void;
}

function CalendarView({ appointments, jobs, onAssign }: CalendarViewProps) {
  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    appointments.forEach(apt => {
      const date = format(new Date(apt.datetime), 'yyyy-MM-dd');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(apt);
    });
    return grouped;
  }, [appointments]);

  const dates = Object.keys(appointmentsByDate).sort();

  return (
    <ScrollArea className="h-full p-4 bg-background">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Upcoming Appointments
          </h2>
          <Badge variant="outline" className="text-accent border-accent/50">
            {appointments.length} total
          </Badge>
        </div>

        {dates.map(date => (
          <div key={date} className="space-y-3">
            <div className="sticky top-0 bg-background/95 backdrop-blur py-2 border-b border-border">
              <h3 className="font-semibold">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>
            <div className="grid gap-2">
              {appointmentsByDate[date].map((apt) => {
                const job = jobs.find(j => j.appointment_id === apt.id);
                const config = job ? STATUS_CONFIG[job.status] : null;
                
                return (
                  <Card key={apt.id} className="bg-card border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-accent font-mono font-semibold">
                            {format(new Date(apt.datetime), 'h:mm a')}
                          </div>
                          <div>
                            <p className="font-medium">{apt.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{apt.service_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {config && (
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", config.color)}
                            >
                              {config.label}
                            </Badge>
                          )}
                          {job?.employee?.full_name ? (
                            <Badge variant="secondary" className="text-xs">
                              <Wrench className="h-3 w-3 mr-1" />
                              {job.employee.full_name}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => job && onAssign(job)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {dates.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No upcoming appointments</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
