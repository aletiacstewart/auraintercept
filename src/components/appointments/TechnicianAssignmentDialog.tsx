import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Phone, Briefcase, CheckCircle, Star, MapPin, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TechnicianAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
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

interface TechnicianWithScore {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  active_jobs_count: number;
  total_score: number;
  workload_score: number;
  distance_score: number;
  history_score: number;
  distance_miles: number | null;
  is_preferred: boolean;
  service_count: number;
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

  // Fetch technicians with their active job counts and scores
  const { data: technicians, isLoading: loadingTechnicians } = useQuery({
    queryKey: ['technicians-with-scores', appointment.company_id, appointment.service_type, appointment.customer_email, appointment.customer_phone],
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

      // Get the service ID for this service type
      const { data: serviceData } = await supabase
        .from('services')
        .select('id')
        .eq('company_id', appointment.company_id)
        .eq('name', appointment.service_type)
        .single();

      // Get technicians assigned to this specific service
      let filteredTechIds = techIds;
      if (serviceData?.id) {
        const { data: serviceAssignments } = await supabase
          .from('technician_service_assignments')
          .select('technician_id')
          .eq('service_id', serviceData.id)
          .in('technician_id', techIds);

        if (serviceAssignments && serviceAssignments.length > 0) {
          filteredTechIds = serviceAssignments.map(sa => sa.technician_id);
        }
      }

      if (filteredTechIds.length === 0) return [];

      // Get profiles for these technicians
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, avatar_url')
        .in('id', filteredTechIds);

      if (profilesError) throw profilesError;

      // Get scores from edge function
      const { data: scoreData, error: scoreError } = await supabase.functions.invoke('booking-actions', {
        body: {
          action: 'get_technician_scores',
          company_id: appointment.company_id,
          technician_ids: filteredTechIds,
          customer_email: appointment.customer_email,
          customer_phone: appointment.customer_phone
        }
      });

      const scoresMap = new Map<string, any>();
      if (scoreData?.scores) {
        scoreData.scores.forEach((s: any) => {
          scoresMap.set(s.technician_id, s);
        });
      }

      // Merge profiles with scores
      const techniciansWithScores = (profiles || []).map(profile => {
        const scoreInfo = scoresMap.get(profile.id) || {};
        return {
          ...profile,
          active_jobs_count: scoreInfo.active_jobs || 0,
          total_score: scoreInfo.total_score || 50,
          workload_score: scoreInfo.workload_score || 50,
          distance_score: scoreInfo.distance_score || 50,
          history_score: scoreInfo.history_score || 0,
          distance_miles: scoreInfo.distance_miles,
          is_preferred: scoreInfo.is_preferred || false,
          service_count: scoreInfo.service_count || 0
        } as TechnicianWithScore;
      });

      // Sort by total score descending
      return techniciansWithScores.sort((a, b) => b.total_score - a.total_score);
    },
    enabled: open
  });

  // Auto-select the best technician when dialog opens
  useEffect(() => {
    if (technicians && technicians.length > 0 && !selectedTechnicianId) {
      setSelectedTechnicianId(technicians[0].id);
    }
  }, [technicians, selectedTechnicianId]);

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
            <p className="text-xs text-muted-foreground">
              Technicians are ranked by workload, distance, and customer history
            </p>
            {loadingTechnicians ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !technicians?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No technicians available for this service.
              </p>
            ) : (
              <TooltipProvider>
                <RadioGroup
                  value={selectedTechnicianId || ''}
                  onValueChange={setSelectedTechnicianId}
                  className="space-y-2"
                >
                  {technicians.map((tech, index) => (
                    <label
                      key={tech.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTechnicianId === tech.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={tech.id} className="sr-only" />
                      
                      {/* Rank indicator */}
                      {index === 0 && (
                        <div className="absolute -top-1 -left-1">
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Recommended
                          </Badge>
                        </div>
                      )}
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={tech.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {tech.full_name || tech.email || 'Unknown'}
                          </p>
                          {tech.is_preferred && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Served this customer {tech.service_count} time{tech.service_count !== 1 ? 's' : ''} before</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        
                        {/* Score indicators */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              <span>{tech.active_jobs_count} jobs</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Active jobs: {tech.active_jobs_count}</p>
                              <p>Workload score: {tech.workload_score}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {tech.distance_miles !== null && (
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{tech.distance_miles} mi</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Distance: ~{tech.distance_miles} miles</p>
                                <p>Distance score: {tech.distance_score}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {tech.phone_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {tech.phone_number}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Score badge */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge 
                            variant={getScoreBadgeVariant(tech.total_score)}
                            className={`${getScoreColor(tech.total_score)}`}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {tech.total_score}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-medium">Match Score: {tech.total_score}</p>
                            <p>Workload: {tech.workload_score}</p>
                            <p>Distance: {tech.distance_score}</p>
                            <p>History: {tech.history_score}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      
                      {selectedTechnicianId === tech.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </label>
                  ))}
                </RadioGroup>
              </TooltipProvider>
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