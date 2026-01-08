import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export type WorkflowStep = 
  | 'idle' 
  | 'pending_acceptance' 
  | 'accepted' 
  | 'directions_prompted'
  | 'en_route' 
  | 'eta_sent'
  | 'arrived' 
  | 'in_progress' 
  | 'completed'
  | 'quote_invoice_offered';

export interface WorkflowJob {
  id: string;
  status: string;
  customer_address: string | null;
  estimated_arrival_minutes: number | null;
  employee_id: string | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    customer_address: string | null;
    service_type: string;
    datetime: string;
  } | null;
}

export interface WorkflowContext {
  currentJob: WorkflowJob | null;
  currentStep: WorkflowStep;
  suggestedNextAction: string | null;
  autoPromptMessage: string | null;
}

// Map job status to workflow steps
const statusToStep = (status: string): WorkflowStep => {
  switch (status) {
    case 'pending_acceptance': return 'pending_acceptance';
    case 'accepted': return 'accepted';
    case 'en_route': return 'en_route';
    case 'arrived': return 'arrived';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    default: return 'idle';
  }
};

// Get suggested next action based on current step
const getNextAction = (step: WorkflowStep): { action: string | null; prompt: string | null } => {
  switch (step) {
    case 'pending_acceptance':
      return { action: 'accept', prompt: null };
    case 'accepted':
      return { 
        action: 'directions', 
        prompt: "Great! I've accepted the job. Would you like me to get directions to the customer's location?" 
      };
    case 'directions_prompted':
      return { 
        action: 'enroute', 
        prompt: "Directions loaded! Ready to mark yourself as en route? I'll notify the customer with your ETA." 
      };
    case 'en_route':
      return { 
        action: 'arrive_start', 
        prompt: null // ETA sent automatically, waiting for arrival
      };
    case 'eta_sent':
      return { 
        action: 'arrive_start', 
        prompt: "Customer notified of your ETA. Let me know when you've arrived and are ready to start!" 
      };
    case 'arrived':
    case 'in_progress':
      return { 
        action: 'complete', 
        prompt: null 
      };
    case 'completed':
      return { 
        action: 'quote_invoice', 
        prompt: "Job completed! Would you like to generate a quote or invoice for this job?" 
      };
    default:
      return { action: null, prompt: null };
  }
};

interface UseFieldOpsWorkflowProps {
  userId?: string;
  onAutoPrompt?: (message: string) => void;
}

export function useFieldOpsWorkflow({ userId, onAutoPrompt }: UseFieldOpsWorkflowProps) {
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');
  const [lastCompletedJobId, setLastCompletedJobId] = useState<string | null>(null);
  const [directionsLoaded, setDirectionsLoaded] = useState(false);
  const [etaSent, setEtaSent] = useState(false);

  // Fetch employee's active jobs
  const { data: activeJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['workflow-jobs', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          customer_address,
          estimated_arrival_minutes,
          employee_id,
          appointments (
            id,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            service_type,
            datetime
          )
        `)
        .eq('employee_id', userId)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[FieldOpsWorkflow] Error fetching jobs:', error);
        return [];
      }

      return (data || []) as WorkflowJob[];
    },
    enabled: !!userId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Get the current active job (the one in progress or most recent)
  const currentJob = useMemo(() => {
    // Priority: in_progress > arrived > en_route > accepted > pending
    const priorityOrder = ['in_progress', 'arrived', 'en_route', 'accepted', 'pending_acceptance'];
    
    for (const status of priorityOrder) {
      const job = activeJobs.find(j => j.status === status);
      if (job) return job;
    }
    
    return activeJobs[0] || null;
  }, [activeJobs]);

  // Update workflow step based on current job
  useEffect(() => {
    if (currentJob) {
      let step = statusToStep(currentJob.status);
      
      // If directions were loaded after accepting, update step
      if (step === 'accepted' && directionsLoaded) {
        step = 'directions_prompted';
      }
      
      // If ETA was sent while en_route, update step
      if (step === 'en_route' && etaSent) {
        step = 'eta_sent';
      }
      
      setWorkflowStep(step);
    } else {
      setWorkflowStep('idle');
    }
  }, [currentJob, directionsLoaded, etaSent]);

  // Get workflow context
  const workflowContext = useMemo((): WorkflowContext => {
    const { action, prompt } = getNextAction(workflowStep);
    
    return {
      currentJob,
      currentStep: workflowStep,
      suggestedNextAction: action,
      autoPromptMessage: prompt,
    };
  }, [currentJob, workflowStep]);

  // Handler: After accepting a job
  const onJobAccepted = useCallback((jobId: string) => {
    setDirectionsLoaded(false);
    setEtaSent(false);
    refetchJobs();
    
    // Trigger auto-prompt for directions after a short delay
    setTimeout(() => {
      onAutoPrompt?.("Would you like me to get directions to the customer's location?");
    }, 1500);
  }, [refetchJobs, onAutoPrompt]);

  // Handler: After loading directions
  const onDirectionsLoaded = useCallback(() => {
    setDirectionsLoaded(true);
    
    // Auto-prompt to mark en route
    setTimeout(() => {
      onAutoPrompt?.("Directions are ready! Would you like to mark yourself as en route? I'll automatically notify the customer with your ETA.");
    }, 1000);
  }, [onAutoPrompt]);

  // Handler: After marking en route (auto-send ETA)
  const onMarkedEnRoute = useCallback(async (jobId: string) => {
    setEtaSent(true);
    refetchJobs();
    
    // ETA notification is sent automatically by the status update
    // Just confirm to the technician
    setTimeout(() => {
      onAutoPrompt?.("Customer has been notified of your arrival. Drive safely! Let me know when you've arrived.");
    }, 1000);
  }, [refetchJobs, onAutoPrompt]);

  // Handler: Combined Arrive & Start
  const onArrivedAndStarted = useCallback(async (job: WorkflowJob) => {
    try {
      // Update to arrived first
      const { error: arrivedError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'arrived',
          arrived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (arrivedError) throw arrivedError;

      // Send arrival notification
      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: 'arrived',
          recipientType: 'customer'
        }
      });

      // Then immediately update to in_progress
      const { error: startError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (startError) throw startError;

      const customerName = job.appointments?.customer_name || 'Customer';
      toast.success(`Arrived & started job for ${customerName}`, { 
        description: 'Customer has been notified of your arrival' 
      });
      
      refetchJobs();
      return true;
    } catch (error) {
      console.error('[FieldOpsWorkflow] Arrive & Start error:', error);
      toast.error('Failed to update status');
      return false;
    }
  }, [refetchJobs]);

  // Handler: After completing a job
  const onJobCompleted = useCallback((jobId: string) => {
    setLastCompletedJobId(jobId);
    setDirectionsLoaded(false);
    setEtaSent(false);
    refetchJobs();
    
    // Auto-prompt for quote/invoice
    setTimeout(() => {
      onAutoPrompt?.("Great job! Would you like to generate a quote or invoice for this completed work?");
    }, 1500);
  }, [refetchJobs, onAutoPrompt]);

  // Get customer context from current or last completed job
  const getJobContext = useCallback(() => {
    const job = currentJob || activeJobs.find(j => j.id === lastCompletedJobId);
    
    if (!job?.appointments) return null;
    
    return {
      jobId: job.id,
      appointmentId: job.appointments.id,
      customerName: job.appointments.customer_name,
      customerPhone: job.appointments.customer_phone || '',
      customerEmail: job.appointments.customer_email || '',
      customerAddress: job.appointments.customer_address || job.customer_address || '',
      serviceType: job.appointments.service_type,
    };
  }, [currentJob, activeJobs, lastCompletedJobId]);

  return {
    activeJobs,
    currentJob,
    workflowStep,
    workflowContext,
    refetchJobs,
    onJobAccepted,
    onDirectionsLoaded,
    onMarkedEnRoute,
    onArrivedAndStarted,
    onJobCompleted,
    getJobContext,
  };
}
