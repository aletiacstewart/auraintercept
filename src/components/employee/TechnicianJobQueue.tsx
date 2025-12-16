import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
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
  AlertCircle,
  RefreshCw,
  FileText,
  Package,
  Car,
  Timer,
  MessageSquare,
} from 'lucide-react';

interface JobAssignment {
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
  estimated_arrival_minutes: number | null;
  notes: string | null;
  parts_used: string | null;
  decline_reason: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_acceptance: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-blue-500', icon: CheckCircle },
  en_route: { label: 'En Route', color: 'bg-purple-500', icon: Navigation },
  arrived: { label: 'Arrived', color: 'bg-indigo-500', icon: MapPin },
  in_progress: { label: 'In Progress', color: 'bg-orange-500', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: XCircle },
};

export function TechnicianJobQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch job assignments
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['technician-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
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
          )
        `)
        .eq('employee_id', user.id)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as JobAssignment[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('job-assignments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_assignments',
          filter: `employee_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Update job status mutation with optimistic updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status, additionalData }: { 
      jobId: string; 
      status: string; 
      additionalData?: Record<string, any>;
    }) => {
      // Map status to correct timestamp column names
      const timestampFieldMap: Record<string, string> = {
        'accepted': 'accepted_at',
        'declined': 'declined_at',
        'en_route': 'en_route_at',
        'arrived': 'arrived_at',
        'in_progress': 'started_at', // in_progress uses started_at column
        'completed': 'completed_at',
      };
      const timestampField = timestampFieldMap[status] || `${status}_at`;
      const updateData: Record<string, any> = {
        status,
        [timestampField]: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { error } = await supabase
        .from('job_assignments')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;

      // Send notification to customer
      const job = jobs?.find(j => j.id === jobId);
      if (job && ['accepted', 'en_route', 'arrived', 'completed'].includes(status)) {
        try {
          await supabase.functions.invoke('send-job-notification', {
            body: {
              jobAssignmentId: jobId,
              notificationType: status,
              recipientType: 'customer',
            },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      return { jobId, status };
    },
    onMutate: async ({ jobId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['technician-jobs', user?.id] });

      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData(['technician-jobs', user?.id]);

      // Optimistically update the cache
      queryClient.setQueryData(['technician-jobs', user?.id], (old: JobAssignment[] | undefined) => {
        if (!old) return old;
        
        // For completed/declined jobs, remove from list (they're filtered out by query)
        if (status === 'completed' || status === 'declined') {
          return old.filter(j => j.id !== jobId);
        }
        
        // Otherwise, update the status
        return old.map(j => 
          j.id === jobId ? { ...j, status } : j
        );
      });

      return { previousJobs };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['technician-jobs'] });
      toast.success(`Job ${data.status.replace('_', ' ')}`);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(['technician-jobs', user?.id], context.previousJobs);
      }
      toast.error('Failed to update job status');
      console.error('Update error:', error);
    },
  });

  const handleAccept = (job: JobAssignment) => {
    updateStatusMutation.mutate({ jobId: job.id, status: 'accepted' });
  };

  const handleDecline = (job: JobAssignment) => {
    setSelectedJob(job);
    setDeclineDialogOpen(true);
  };

  const confirmDecline = () => {
    if (!selectedJob) return;
    updateStatusMutation.mutate({
      jobId: selectedJob.id,
      status: 'declined',
      additionalData: { decline_reason: declineReason },
    });
    setDeclineDialogOpen(false);
    setDeclineReason('');
    setSelectedJob(null);
  };

  const handleEnRoute = (job: JobAssignment) => {
    updateStatusMutation.mutate({ 
      jobId: job.id, 
      status: 'en_route',
      additionalData: { estimated_arrival_minutes: 20 }, // Default ETA
    });
  };

  const handleArrived = (job: JobAssignment) => {
    updateStatusMutation.mutate({ jobId: job.id, status: 'arrived' });
  };

  const handleStartJob = (job: JobAssignment) => {
    updateStatusMutation.mutate({ jobId: job.id, status: 'in_progress' });
  };

  const handleCompleteJob = (job: JobAssignment, notes?: string, partsUsed?: string) => {
    updateStatusMutation.mutate({ 
      jobId: job.id, 
      status: 'completed',
      additionalData: { 
        notes: notes || job.notes,
        parts_used: partsUsed || job.parts_used,
      },
    });
  };

  const handleUpdateNotes = (job: JobAssignment, notes: string, partsUsed: string) => {
    updateStatusMutation.mutate({
      jobId: job.id,
      status: job.status,
      additionalData: { notes, parts_used: partsUsed },
    });
  };

  // Group jobs by status priority
  const activeJob = jobs?.find(j => ['en_route', 'arrived', 'in_progress'].includes(j.status));
  const pendingJobs = jobs?.filter(j => j.status === 'pending_acceptance') || [];
  const acceptedJobs = jobs?.filter(j => j.status === 'accepted') || [];

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
      {/* Active Job Banner */}
      {activeJob && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[activeJob.status].color} animate-pulse`} />
                <CardTitle className="text-lg">Active Job</CardTitle>
              </div>
              <Badge variant="default" className="text-sm">
                {STATUS_CONFIG[activeJob.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <JobCard 
              job={activeJob} 
              isActive 
              onEnRoute={handleEnRoute}
              onArrived={handleArrived}
              onStartJob={handleStartJob}
              onCompleteJob={handleCompleteJob}
              onUpdateNotes={handleUpdateNotes}
            />
          </CardContent>
        </Card>
      )}

      {/* Pending Acceptance */}
      {pendingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Jobs Awaiting Response
              <Badge variant="secondary">{pendingJobs.length}</Badge>
            </CardTitle>
            <CardDescription>Accept or decline these job assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Accepted Jobs */}
      {acceptedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Upcoming Jobs
              <Badge variant="secondary">{acceptedJobs.length}</Badge>
            </CardTitle>
            <CardDescription>Jobs you've accepted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {acceptedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEnRoute={handleEnRoute}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!activeJob && pendingJobs.length === 0 && acceptedJobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Active Jobs</p>
            <p className="text-sm text-muted-foreground">New job assignments will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Job</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this job assignment.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for declining..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDecline}>
              Decline Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface JobCardProps {
  job: JobAssignment;
  isActive?: boolean;
  onAccept?: (job: JobAssignment) => void;
  onDecline?: (job: JobAssignment) => void;
  onEnRoute?: (job: JobAssignment) => void;
  onArrived?: (job: JobAssignment) => void;
  onStartJob?: (job: JobAssignment) => void;
  onCompleteJob?: (job: JobAssignment, notes?: string, partsUsed?: string) => void;
  onUpdateNotes?: (job: JobAssignment, notes: string, partsUsed: string) => void;
}

function JobCard({
  job,
  isActive,
  onAccept,
  onDecline,
  onEnRoute,
  onArrived,
  onStartJob,
  onCompleteJob,
  onUpdateNotes,
}: JobCardProps) {
  const [notes, setNotes] = useState(job.notes || '');
  const [partsUsed, setPartsUsed] = useState(job.parts_used || '');
  const [hasChanges, setHasChanges] = useState(false);

  const appointment = job.appointments;
  if (!appointment) return null;

  const statusConfig = STATUS_CONFIG[job.status];
  const StatusIcon = statusConfig?.icon || Clock;

  // Calculate time tracking
  const travelTimeMinutes = job.en_route_at && job.arrived_at 
    ? differenceInMinutes(new Date(job.arrived_at), new Date(job.en_route_at))
    : null;
  
  const workTimeMinutes = job.started_at && job.completed_at
    ? differenceInMinutes(new Date(job.completed_at), new Date(job.started_at))
    : job.started_at
    ? differenceInMinutes(new Date(), new Date(job.started_at))
    : null;

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const handlePartsChange = (value: string) => {
    setPartsUsed(value);
    setHasChanges(true);
  };

  const handleSaveNotes = () => {
    onUpdateNotes?.(job, notes, partsUsed);
    setHasChanges(false);
  };

  return (
    <div className={`p-4 rounded-lg border ${isActive ? 'bg-background' : 'bg-muted/30'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">{appointment.service_type}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {appointment.customer_name}
            </p>
          </div>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'} className="flex items-center gap-1">
          <StatusIcon className="w-3 h-3" />
          {statusConfig?.label || job.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{format(new Date(appointment.datetime), 'MMM d, h:mm a')}</span>
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

      {/* Time Tracking Section */}
      {(job.en_route_at || job.started_at) && (
        <div className="bg-muted/50 p-3 rounded-lg mb-3 space-y-2">
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
          {/* Duration summaries */}
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
                <span className="font-medium">{workTimeMinutes} min{!job.completed_at && ' (ongoing)'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Notes from Triage/Booking Agent */}
      {appointment.notes && (
        <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide flex items-center gap-1 mb-1">
            <MessageSquare className="w-3 h-3" />
            Customer Notes
          </p>
          <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
        </div>
      )}

      {/* Notes & Parts Section - Show for active jobs */}
      {isActive && ['arrived', 'in_progress'].includes(job.status) && (
        <div className="space-y-3 mb-3 p-3 bg-muted/30 rounded-lg border">
          <div className="space-y-2">
            <Label htmlFor={`notes-${job.id}`} className="flex items-center gap-1 text-sm">
              <FileText className="w-3 h-3" />
              Job Notes
            </Label>
            <Textarea
              id={`notes-${job.id}`}
              placeholder="Add notes about the job, issues found, work performed..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`parts-${job.id}`} className="flex items-center gap-1 text-sm">
              <Package className="w-3 h-3" />
              Parts Used
            </Label>
            <Input
              id={`parts-${job.id}`}
              placeholder="List parts used (e.g., capacitor, filter, refrigerant)"
              value={partsUsed}
              onChange={(e) => handlePartsChange(e.target.value)}
              className="text-sm"
            />
          </div>
          {hasChanges && (
            <Button size="sm" variant="outline" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-3">
        Assigned {formatDistanceToNow(new Date(job.assigned_at), { addSuffix: true })}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {job.status === 'pending_acceptance' && (
          <>
            <Button size="sm" onClick={() => onAccept?.(job)}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDecline?.(job)}>
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </>
        )}

        {job.status === 'accepted' && (
          <Button size="sm" onClick={() => onEnRoute?.(job)}>
            <Navigation className="w-4 h-4 mr-1" />
            Start Driving
          </Button>
        )}

        {job.status === 'en_route' && (
          <Button size="sm" onClick={() => onArrived?.(job)}>
            <MapPin className="w-4 h-4 mr-1" />
            I've Arrived
          </Button>
        )}

        {job.status === 'arrived' && (
          <Button size="sm" onClick={() => onStartJob?.(job)}>
            <Play className="w-4 h-4 mr-1" />
            Start Job
          </Button>
        )}

        {job.status === 'in_progress' && (
          <Button size="sm" variant="default" onClick={() => onCompleteJob?.(job, notes, partsUsed)}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Complete Job
          </Button>
        )}
      </div>
    </div>
  );
}
