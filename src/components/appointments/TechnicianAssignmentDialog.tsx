import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Phone, Briefcase, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TechnicianAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    customer_name: string;
    customer_address: string | null;
    service_type: string;
    datetime: string;
    company_id: string;
  };
  existingAssignment?: {
    id: string;
    employee_id: string | null;
    status: string;
  } | null;
}

interface Technician {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  active_jobs_count: number;
}

export function TechnicianAssignmentDialog({
  open,
  onOpenChange,
  appointment,
  existingAssignment
}: TechnicianAssignmentDialogProps) {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch technicians with their active job counts
  const { data: technicians, isLoading: loadingTechnicians } = useQuery({
    queryKey: ['technicians', appointment.company_id],
    queryFn: async () => {
      // Get employees with technician job type
      const { data: techAssignments, error: techError } = await supabase
        .from('employee_job_assignments')
        .select('employee_id')
        .eq('company_id', appointment.company_id)
        .eq('job_type', 'technician');

      if (techError) throw techError;
      if (!techAssignments?.length) return [];

      const techIds = techAssignments.map(t => t.employee_id);

      // Get profiles for these technicians
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, avatar_url')
        .in('id', techIds);

      if (profilesError) throw profilesError;

      // Get active job counts for each technician
      const { data: activeJobs, error: jobsError } = await supabase
        .from('job_assignments')
        .select('employee_id')
        .eq('company_id', appointment.company_id)
        .in('employee_id', techIds)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress']);

      if (jobsError) throw jobsError;

      // Count jobs per technician
      const jobCounts = (activeJobs || []).reduce((acc, job) => {
        acc[job.employee_id!] = (acc[job.employee_id!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (profiles || []).map(profile => ({
        ...profile,
        active_jobs_count: jobCounts[profile.id] || 0
      })) as Technician[];
    },
    enabled: open
  });

  // Mutation to assign technician
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTechnicianId) throw new Error('No technician selected');

      // If there's an existing assignment, update it to cancelled first
      if (existingAssignment?.id) {
        await supabase
          .from('job_assignments')
          .update({ status: 'cancelled' })
          .eq('id', existingAssignment.id);
      }

      // Create new job assignment
      const { data: newAssignment, error } = await supabase
        .from('job_assignments')
        .insert({
          appointment_id: appointment.id,
          company_id: appointment.company_id,
          employee_id: selectedTechnicianId,
          status: 'pending_acceptance',
          customer_address: appointment.customer_address,
          notes: notes || null,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to technician
      try {
        await supabase.functions.invoke('send-job-notification', {
          body: {
            jobAssignmentId: newAssignment.id,
            notificationType: 'assigned',
            recipientType: 'employee'
          }
        });
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        // Don't fail the assignment if notification fails
      }

      return newAssignment;
    },
    onSuccess: () => {
      toast.success('Technician assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['job-assignments'] });
      onOpenChange(false);
      setSelectedTechnicianId(null);
      setNotes('');
    },
    onError: (error) => {
      toast.error('Failed to assign technician: ' + (error as Error).message);
    }
  });

  const selectedTechnician = technicians?.find(t => t.id === selectedTechnicianId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingAssignment ? 'Reassign Technician' : 'Assign Technician'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Summary */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{appointment.customer_name}</p>
            <p className="text-muted-foreground">{appointment.service_type}</p>
            {appointment.customer_address && (
              <p className="text-muted-foreground">{appointment.customer_address}</p>
            )}
          </div>

          {/* Technician Selection */}
          <div className="space-y-2">
            <Label>Select Technician</Label>
            {loadingTechnicians ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !technicians?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No technicians available. Add employees with "technician" job type first.
              </p>
            ) : (
              <RadioGroup
                value={selectedTechnicianId || ''}
                onValueChange={setSelectedTechnicianId}
                className="space-y-2"
              >
                {technicians.map((tech) => (
                  <label
                    key={tech.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTechnicianId === tech.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={tech.id} className="sr-only" />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={tech.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {tech.full_name || tech.email || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {tech.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {tech.phone_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={tech.active_jobs_count > 0 ? 'secondary' : 'outline'}>
                      <Briefcase className="h-3 w-3 mr-1" />
                      {tech.active_jobs_count} active
                    </Badge>
                    {selectedTechnicianId === tech.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="assignment-notes">Notes for Technician (optional)</Label>
            <Textarea
              id="assignment-notes"
              placeholder="Add any special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedTechnicianId || assignMutation.isPending}
          >
            {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingAssignment ? 'Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
