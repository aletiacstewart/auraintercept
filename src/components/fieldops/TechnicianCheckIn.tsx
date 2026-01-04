import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  MapPin, 
  Navigation, 
  Camera, 
  CheckCircle, 
  Clock,
  Phone,
  Play,
  ExternalLink,
  Loader2,
  Upload,
  User,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { JobPhotoUpload } from '@/components/employee/JobPhotoUpload';

interface JobAssignment {
  id: string;
  status: string;
  customer_address: string | null;
  estimated_arrival_minutes: number | null;
  before_photos: string[];
  after_photos: string[];
  notes: string | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    service_type: string;
    datetime: string;
  } | null;
}

// Aura Intercept themed status colors
const STATUS_STYLES: Record<string, { bg: string; text: string; glow: string }> = {
  accepted: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  en_route: { bg: 'bg-accent/20', text: 'text-accent', glow: 'shadow-accent/50' },
  arrived: { bg: 'bg-accent/20', text: 'text-accent', glow: 'shadow-accent/50' },
  in_progress: { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/30' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/30' },
};

export function TechnicianCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Fetch active job
  const { data: activeJob, isLoading } = useQuery({
    queryKey: ['technician-active-job', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          *,
          appointments:appointment_id (
            id,
            customer_name,
            customer_phone,
            service_type,
            datetime
          )
        `)
        .eq('employee_id', user.id)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as JobAssignment | null;
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, additionalData }: { status: string; additionalData?: Record<string, any> }) => {
      if (!activeJob) throw new Error('No active job');

      const timestampMap: Record<string, string> = {
        'en_route': 'en_route_at',
        'arrived': 'arrived_at',
        'in_progress': 'started_at',
        'completed': 'completed_at',
      };

      const { error } = await supabase
        .from('job_assignments')
        .update({
          status,
          [timestampMap[status]]: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...additionalData,
        })
        .eq('id', activeJob.id);

      if (error) throw error;

      // Send notification to customer
      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: activeJob.id,
          notificationType: status,
          recipientType: 'customer',
        },
      });

      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['technician-active-job'] });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    },
  });

  const handleGetDirections = useCallback(() => {
    if (!activeJob?.customer_address) {
      toast.error('No address available');
      return;
    }
    const encoded = encodeURIComponent(activeJob.customer_address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  }, [activeJob]);

  const handlePhotoUpload = (type: 'before' | 'after') => {
    if (!activeJob) return;
    setSelectedJobId(activeJob.id);
    setPhotoType(type);
    setShowPhotoDialog(true);
  };

  const getNextAction = () => {
    if (!activeJob) return null;

    switch (activeJob.status) {
      case 'accepted':
        return {
          label: 'Start Route',
          icon: Navigation,
          status: 'en_route',
          variant: 'accent' as const,
        };
      case 'en_route':
        return {
          label: 'Check In',
          icon: MapPin,
          status: 'arrived',
          variant: 'accent' as const,
        };
      case 'arrived':
        return {
          label: 'Start Job',
          icon: Play,
          status: 'in_progress',
          variant: 'warning' as const,
        };
      case 'in_progress':
        return {
          label: 'Complete',
          icon: CheckCircle,
          status: 'completed',
          variant: 'success' as const,
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();
  const styles = activeJob ? STATUS_STYLES[activeJob.status] || STATUS_STYLES.accepted : null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-primary text-primary-foreground">
        <div className="p-6 rounded-2xl bg-primary-foreground/5 mb-4">
          <Wrench className="h-16 w-16 text-primary-foreground/20" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Active Job</h2>
        <p className="text-primary-foreground/60 text-center max-w-xs">
          Accept a job from your queue to start working
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-primary text-primary-foreground p-4 pb-24">
      {/* Active Job Card */}
      <Card className="bg-primary-foreground/5 border-border/30 mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <Badge className={cn("mb-2", styles?.bg, styles?.text, "border-0")}>
                {activeJob.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <CardTitle className="text-lg text-primary-foreground">
                {activeJob.appointments?.service_type}
              </CardTitle>
              <CardDescription className="text-primary-foreground/60">
                {activeJob.appointments?.customer_name}
              </CardDescription>
            </div>
            {activeJob.appointments?.datetime && (
              <div className="text-right">
                <div className="text-accent font-semibold">
                  {format(new Date(activeJob.appointments.datetime), 'h:mm a')}
                </div>
                <div className="text-xs text-primary-foreground/50">
                  {format(new Date(activeJob.appointments.datetime), 'MMM d')}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          {activeJob.customer_address && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary-foreground/5">
              <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-primary-foreground">{activeJob.customer_address}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-accent/50 text-accent hover:bg-accent/20 h-14"
              onClick={handleGetDirections}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Directions
            </Button>
            {activeJob.appointments?.customer_phone && (
              <Button
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-14"
                onClick={() => window.open(`tel:${activeJob.appointments?.customer_phone}`)}
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Customer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Documentation */}
      <Card className="bg-primary-foreground/5 border-border/30 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-primary-foreground">
            <Camera className="h-4 w-4 text-accent" />
            Photo Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className={cn(
                "h-20 flex-col gap-2 border-dashed",
                activeJob.before_photos?.length > 0 
                  ? "border-green-500/50 text-green-400" 
                  : "border-primary-foreground/30 text-primary-foreground/70"
              )}
              onClick={() => handlePhotoUpload('before')}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">
                Before Photos {activeJob.before_photos?.length > 0 && `(${activeJob.before_photos.length})`}
              </span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-20 flex-col gap-2 border-dashed",
                activeJob.after_photos?.length > 0 
                  ? "border-green-500/50 text-green-400" 
                  : "border-primary-foreground/30 text-primary-foreground/70"
              )}
              onClick={() => handlePhotoUpload('after')}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">
                After Photos {activeJob.after_photos?.length > 0 && `(${activeJob.after_photos.length})`}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Large Check-In / Action Button */}
      {nextAction && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-primary via-primary to-transparent pt-12">
          <Button
            className={cn(
              "w-full h-16 text-lg font-semibold rounded-xl transition-all",
              "shadow-lg hover:shadow-xl",
              nextAction.variant === 'accent' && "bg-accent hover:bg-accent/90 text-primary shadow-accent/30",
              nextAction.variant === 'warning' && "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30",
              nextAction.variant === 'success' && "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
            )}
            onClick={() => updateStatusMutation.mutate({ status: nextAction.status })}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <nextAction.icon className="h-6 w-6 mr-3" />
            )}
            {nextAction.label}
          </Button>
        </div>
      )}

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="bg-primary border-border/30 text-primary-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>{photoType === 'before' ? 'Before' : 'After'} Photos</DialogTitle>
            <DialogDescription className="text-primary-foreground/60">
              Upload photos to document the job {photoType === 'before' ? 'before starting' : 'after completion'}
            </DialogDescription>
          </DialogHeader>
          {selectedJobId && (
            <JobPhotoUpload
              jobId={selectedJobId}
              beforePhotos={activeJob.before_photos || []}
              afterPhotos={activeJob.after_photos || []}
              onPhotosUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ['technician-active-job'] });
                setShowPhotoDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
