import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Bell, 
  BellOff, 
  Navigation, 
  User, 
  CheckCircle,
  AlertCircle,
  Send,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface JobAssignment {
  id: string;
  status: string;
  customer_address: string | null;
  estimated_arrival_minutes: number | null;
  customer_notified_en_route: boolean | null;
  customer_notified_arrived: boolean | null;
  en_route_at: string | null;
  arrived_at: string | null;
  appointments: {
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    service_type: string;
    datetime: string;
  } | null;
  employee: {
    full_name: string | null;
  } | null;
}

interface RealTimeETASidebarProps {
  jobs: JobAssignment[];
  companyId: string;
}

export function RealTimeETASidebar({ jobs, companyId }: RealTimeETASidebarProps) {
  // Filter jobs that are en route or recently arrived
  const relevantJobs = jobs.filter(j => 
    j.status === 'en_route' || j.status === 'arrived' || j.status === 'in_progress'
  );

  const notifiedCount = relevantJobs.filter(j => 
    j.customer_notified_en_route || j.customer_notified_arrived
  ).length;

  const pendingNotifications = relevantJobs.filter(j => 
    (j.status === 'en_route' && !j.customer_notified_en_route) ||
    (j.status === 'arrived' && !j.customer_notified_arrived)
  );

  const handleSendNotification = async (job: JobAssignment, type: 'en_route' | 'arrived') => {
    try {
      const { error } = await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: type,
          recipientType: 'customer'
        }
      });

      if (error) throw error;

      toast.success('Customer notified', {
        description: `${job.appointments?.customer_name} has been notified`
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    }
  };

  return (
    <div className="h-full bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Real-Time ETAs</h2>
            <p className="text-xs text-white/70">Customer notifications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium">{notifiedCount}</span>
            <span className="text-white/70">notified</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BellOff className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">{pendingNotifications.length}</span>
            <span className="text-white/70">pending</span>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {relevantJobs.length === 0 ? (
            <div className="text-center py-8">
              <Navigation className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No technicians en route</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                ETAs will appear here when technicians are dispatched
              </p>
            </div>
          ) : (
            relevantJobs.map((job) => (
              <ETAJobCard 
                key={job.id} 
                job={job} 
                onSendNotification={handleSendNotification}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {pendingNotifications.length > 0 && (
        <div className="p-4 border-t border-border">
          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => {
              pendingNotifications.forEach(job => {
                const type = job.status === 'en_route' ? 'en_route' : 'arrived';
                handleSendNotification(job, type);
              });
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Notify All Pending ({pendingNotifications.length})
          </Button>
        </div>
      )}
    </div>
  );
}

function ETAJobCard({ 
  job, 
  onSendNotification 
}: { 
  job: JobAssignment; 
  onSendNotification: (job: JobAssignment, type: 'en_route' | 'arrived') => void;
}) {
  const isEnRoute = job.status === 'en_route';
  const isArrived = job.status === 'arrived';
  const isInProgress = job.status === 'in_progress';
  
  const hasNotified = isEnRoute 
    ? job.customer_notified_en_route 
    : job.customer_notified_arrived;

  const StatusIcon = isEnRoute ? Navigation : isArrived ? MapPin : CheckCircle;
  const statusColor = 'text-accent';
  const statusBg = 'bg-accent/20';

  // Calculate time since status change
  const statusTime = isEnRoute ? job.en_route_at : job.arrived_at;

  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg", statusBg)}>
              <StatusIcon className={cn("h-4 w-4", statusColor)} />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">
                {job.appointments?.customer_name || 'Customer'}
              </p>
              <p className="text-xs text-muted-foreground">
                {job.appointments?.service_type}
              </p>
            </div>
          </div>
          
          {/* Notification Status */}
          {hasNotified ? (
            <Badge className="bg-green-500/20 text-green-400 border-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Notified
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>

        {/* Tech Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <User className="h-3 w-3" />
          <span>{job.employee?.full_name || 'Technician'}</span>
        </div>

        {/* ETA Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnRoute && job.estimated_arrival_minutes && (
              <div className="flex items-center gap-1.5 text-accent">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{job.estimated_arrival_minutes} min</span>
              </div>
            )}
            {statusTime && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(statusTime), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Send Notification Button */}
          {!hasNotified && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-accent hover:bg-accent/20"
              onClick={() => onSendNotification(job, isEnRoute ? 'en_route' : 'arrived')}
            >
              <Bell className="h-3.5 w-3.5 mr-1" />
              Notify
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
