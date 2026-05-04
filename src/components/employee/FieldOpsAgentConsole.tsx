import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { useAuth } from '@/contexts/AuthContext';
import { useAIAgentOrchestrator } from '@/hooks/useAIAgentOrchestrator';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { useFieldOpsWorkflow } from '@/hooks/useFieldOpsWorkflow';
import { useFieldOpsMetrics } from '@/hooks/useConsoleAgentMetrics';
import { useCompanyUptime } from '@/hooks/useCompanyUptime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Send, 
  Navigation, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Truck, 
  Phone, 
  Camera,
  MessageSquare,
  Bot,
  User,
  Loader2,
  X,
  XCircle,
  Calendar,
  CalendarClock,
  LucideIcon,
  Zap,
  ChevronRight,
  Play,
  Lock,
  CheckSquare,
  UserCheck,
  Wrench,
  FileText,
  Receipt,
  CreditCard,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CyberConsoleLayout } from '@/components/ai/chat/CyberConsoleLayout';
import type { CyberAgent } from '@/components/ai/chat/CyberConsoleLayout';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { QuickActionBar } from '@/components/ai/chat/QuickActionGrid';
import { TechnicianMap } from './TechnicianMap';
import { getAgentStyle, getAgentStyleForIndustry } from '@/lib/agentStyles';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryServiceConsoleConfig, type ServiceQuickAction, type ServiceActionId } from '@/lib/industryAgentMap';
import { BusinessQuoteForm, BusinessQuoteData } from '@/components/billing/forms/BusinessQuoteForm';
import { InvoiceForm, InvoiceFormData } from '@/components/billing/forms/InvoiceForm';

// Job action IDs that require employee/front-line role (admins can test/manage them).
const EMPLOYEE_ONLY_ACTIONS: ServiceActionId[] = ['accept', 'enroute', 'eta', 'arrive_start', 'complete'];

interface JobAssignment {
  id: string;
  status: string;
  customer_address: string | null;
  estimated_arrival_minutes: number | null;
  appointments: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    service_type: string;
    datetime: string;
    customer_address: string | null;
    delivery_type: string | null;
    meeting_link: string | null;
  } | null;
}

interface FieldOpsAgentConsoleProps {
  companyId?: string;
  onNavigateRequest?: (address: string) => void;
  className?: string;
}

interface JobContextForForms {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  serviceType: string;
  jobId?: string;
  appointmentId?: string;
}

type SelectorMode = Exclude<ServiceActionId, 'dispatch'> | null;

export function FieldOpsAgentConsole({ companyId, onNavigateRequest, className }: FieldOpsAgentConsoleProps) {
  const { user, companyId: authCompanyId, userRole } = useAuth();
  const effectiveCompanyId = companyId || authCompanyId;
  const navigate = useNavigate();
  const { pack } = useIndustryPack(effectiveCompanyId);
  const serviceConfig = useMemo(() => getIndustryServiceConsoleConfig(pack), [pack]);
  const jobNoun = serviceConfig.jobNoun;
  const jobNounLower = jobNoun.toLowerCase();
  const customerNoun = serviceConfig.customerNoun;
  const customerNounLower = customerNoun.toLowerCase();
  
  // Company admins and platform admins have full access to all actions (for testing/management)
  // Employees can perform job actions as part of their normal workflow
  const isEmployee = userRole === 'employee';
  const isAdmin = userRole === 'platform_admin' || userRole === 'company_admin';
  const canPerformJobActions = isEmployee || isAdmin;
  const canManageAgents = isAdmin;
  
  // Get field operations agents
  const { agents, loading: agentsLoading, toggleAgent } = useAIAgentOrchestrator();
  
  const fieldOpsAgents = useMemo(() => {
    return agents.filter(agent => agent.category === 'field_operations');
  }, [agents]);
  
  // availableActions computed after assignedJobs query below
  
  const [inputValue, setInputValue] = useState('');
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [selectedJobForEta, setSelectedJobForEta] = useState<JobAssignment | null>(null);
  const [selectedJobForReschedule, setSelectedJobForReschedule] = useState<JobAssignment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [etaMinutes, setEtaMinutes] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [navigationAddress, setNavigationAddress] = useState<string | null>(null);
  const [lastCompletedJobContext, setLastCompletedJobContext] = useState<JobContextForForms | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch company data including logo
  const { data: companyData } = useQuery({
    queryKey: ['company-data-fieldops', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('dispatch_phone, name, logo_url')
        .eq('id', effectiveCompanyId)
        .single();
      if (error) {
        console.error('Error fetching company data:', error);
        return null;
      }
      return data;
    },
    enabled: !!effectiveCompanyId,
  });

  const { messages, isLoading, currentAgent, sendMessage, clearMessages } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
    userId: user?.id,
    initialAgent: serviceConfig.defaultOperative,
    onAgentChange: (agent) => {
      console.log('[FieldOps] Agent changed to:', agent);
    },
  });

  // Fetch employee's assigned jobs
  const { data: assignedJobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['employee-jobs-for-fieldops', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          customer_address,
          estimated_arrival_minutes,
          appointments (
            id,
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            datetime,
            customer_address,
            delivery_type,
            meeting_link
          )
        `)
        .eq('employee_id', user.id)
        .in('status', serviceConfig.fieldRouting ? ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'] : ['pending_acceptance', 'accepted', 'arrived', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching jobs:', error);
        return [];
      }

      return (data || []) as JobAssignment[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Filter quick actions based on job delivery types
  const availableActions = useMemo(() => {
    const allVirtual = assignedJobs.length > 0 && assignedJobs.every(j => j.appointments?.delivery_type === 'virtual');
    const allAtBusiness = assignedJobs.length > 0 && assignedJobs.every(j => j.appointments?.delivery_type === 'in_person_business');
    
    return serviceConfig.quickActions.filter(action => {
      if (!serviceConfig.fieldRouting) return !action.fieldOnly;
      if (allVirtual) return !['directions', 'enroute', 'arrive_start'].includes(action.id);
      if (allAtBusiness) return !['directions', 'enroute'].includes(action.id);
      return true;
    });
  }, [assignedJobs, serviceConfig]);

  // Filter jobs based on selector mode
  const getFilteredJobs = () => {
    if (selectorMode === 'accept') {
      return assignedJobs.filter(job => job.status === 'pending_acceptance');
    }
    if (selectorMode === 'decline') {
      return assignedJobs.filter(job => job.status === 'pending_acceptance');
    }
    if (selectorMode === 'enroute') {
      return assignedJobs.filter(job => job.status === 'accepted');
    }
    if (selectorMode === 'eta') {
      return assignedJobs.filter(job => ['accepted', 'en_route'].includes(job.status));
    }
    if (selectorMode === 'arrive_start') {
      return assignedJobs.filter(job => serviceConfig.fieldRouting ? job.status === 'en_route' : ['accepted', 'arrived'].includes(job.status));
    }
    if (selectorMode === 'complete') {
      return assignedJobs.filter(job => ['arrived', 'in_progress'].includes(job.status));
    }
    if (selectorMode === 'reschedule') {
      return assignedJobs.filter(job => ['pending_acceptance', 'accepted', 'en_route'].includes(job.status));
    }
    return assignedJobs;
  };

  const filteredJobs = getFilteredJobs();

  // Auto-scroll to bottom on new messages (only when there are messages)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickAction = useCallback(async (action: ServiceQuickAction) => {
    // Check if this is an employee-only action and user is not an employee
    const isEmployeeOnlyAction = EMPLOYEE_ONLY_ACTIONS.includes(action.id);
    if (isEmployeeOnlyAction && !canPerformJobActions) {
      toast.info('Employee Action', { 
        description: `This action is only available to assigned ${serviceConfig.teamMemberNoun.toLowerCase()}s`
      });
      return;
    }
    
    // Accept job opens job selector
    if (action.id === 'accept') {
      setSelectorMode('accept');
      return;
    }
    
    // Decline job opens job selector
    if (action.id === 'decline') {
      setSelectorMode('decline');
      return;
    }
    
    // Directions opens job selector to pick which job to navigate to
    if (action.id === 'directions') {
      setSelectorMode('directions');
      return;
    }
    
    // En Route opens job selector
    if (action.id === 'enroute') {
      setSelectorMode('enroute');
      return;
    }
    
    // Update ETA opens job selector
    if (action.id === 'eta') {
      setSelectorMode('eta');
      return;
    }
    
    // Combined Arrive & Start opens job selector
    if (action.id === 'arrive_start') {
      setSelectorMode('arrive_start');
      return;
    }
    
    // Complete job opens job selector
    if (action.id === 'complete') {
      setSelectorMode('complete');
      return;
    }
    
    // Quote opens the quote form
    if (action.id === 'quote') {
      setSelectorMode('quote');
      return;
    }

    // Reschedule opens job selector
    if (action.id === 'reschedule') {
      setSelectorMode('reschedule');
      return;
    }
    
    // Invoice opens the invoice form
    if (action.id === 'invoice') {
      setSelectorMode('invoice');
      return;
    }
    
    // Dispatch calls the phone directly
    if (action.id === 'dispatch') {
      if (companyData?.dispatch_phone) {
        const cleanPhone = companyData.dispatch_phone.replace(/[^\d+]/g, '');
        window.location.href = `tel:${cleanPhone}`;
        toast.success(`Calling ${serviceConfig.contactTeamLabel.replace(/^Contact /, '')}`, { description: companyData.name || serviceConfig.contactTeamLabel });
      } else {
        toast.error(`${serviceConfig.contactTeamLabel.replace(/^Contact /, '')} phone not configured`, { 
          description: 'Please contact your administrator to set up the team phone number' 
        });
      }
      return;
    }
    
    // All other actions send message to AI agent which will use tools
    await sendMessage(action.message);
  }, [sendMessage, companyData, canPerformJobActions, serviceConfig]);

  const handleSelectJobForDirections = useCallback((job: JobAssignment) => {
    const address = job.customer_address || job.appointments?.customer_address;
    if (address) {
      // Set the address and switch to directions tab to show TechnicianMap
      setNavigationAddress(address);
      setSelectorMode(null);
      setActiveTab('directions');
      toast.success('Loading directions', { 
        description: `To: ${job.appointments?.customer_name || customerNoun} at ${address}` 
      });
      
      // Trigger callback if provided
      onNavigateRequest?.(address);
    } else {
      toast.error(serviceConfig.noAddressLabel, { description: `This ${jobNounLower} has no ${customerNounLower} address on file` });
      setSelectorMode(null);
    }
  }, [onNavigateRequest, customerNoun, customerNounLower, jobNounLower, serviceConfig.noAddressLabel]);

  const handleSelectJobForEnRoute = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || customerNoun;
    
    try {
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'en_route',
          en_route_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: 'en_route',
          recipientType: 'customer'
        }
      });

      toast.success(`En route to ${customerName}`, { description: 'Customer has been notified' });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I am now en route to ${customerName}'s location for their ${job.appointments?.service_type || 'service'} appointment.`);

    } catch (error) {
      console.error('En route update error:', error);
      toast.error('Failed to update status', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  const handleSelectJobForEta = useCallback((job: JobAssignment) => {
    setSelectedJobForEta(job);
    setEtaMinutes(job.estimated_arrival_minutes?.toString() || '');
  }, []);

  const handleSendEtaUpdate = useCallback(async () => {
    if (!selectedJobForEta || !etaMinutes || processingJobId) return;
    
    const minutes = parseInt(etaMinutes, 10);
    if (isNaN(minutes) || minutes < 1) {
      toast.error('Please enter a valid number of minutes');
      return;
    }

    setProcessingJobId(selectedJobForEta.id);
    const customerName = selectedJobForEta.appointments?.customer_name || customerNoun;
    
    try {
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update({ 
          estimated_arrival_minutes: minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedJobForEta.id);

      if (updateError) throw updateError;

      // Send ETA notification to customer
      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: selectedJobForEta.id,
          notificationType: 'en_route', // Uses en_route template which includes ETA
          recipientType: 'customer'
        }
      });

      toast.success(`ETA updated to ${minutes} minutes`, { description: `${customerName} has been notified` });
      refetchJobs();
      setSelectorMode(null);
      setSelectedJobForEta(null);
      setEtaMinutes('');
      sendMessage(`I updated my ETA for ${customerName} to ${minutes} minutes. The customer has been notified.`);

    } catch (error) {
      console.error('ETA update error:', error);
      toast.error('Failed to update ETA', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [selectedJobForEta, etaMinutes, processingJobId, refetchJobs, sendMessage]);

  const handleSelectJobForAccept = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || customerNoun;
    
    try {
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: 'accepted',
          recipientType: 'customer'
        }
      });

      toast.success(`${jobNoun} accepted for ${customerName}`, { description: 'Customer has been notified' });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I have accepted the ${job.appointments?.service_type || serviceConfig.serviceNoun} ${jobNounLower} for ${customerName}.`);

    } catch (error) {
      console.error('Accept assignment error:', error);
      toast.error(`Failed to accept ${jobNounLower}`, { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  // Decline job handler
  const handleSelectJobForDecline = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || customerNoun;
    
    try {
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      // Cancel the appointment
      if (job.appointments?.id) {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', job.appointments.id);
      }

      // Notify customer
      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: 'cancelled',
          recipientType: 'customer'
        }
      });

      toast.success(`${jobNoun} declined for ${customerName}`, { description: 'Customer has been notified' });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I have declined the ${job.appointments?.service_type || serviceConfig.serviceNoun} ${jobNounLower} for ${customerName}. The appointment has been cancelled and the ${customerNounLower} was notified.`);

    } catch (error) {
      console.error('Decline assignment error:', error);
      toast.error(`Failed to decline ${jobNounLower}`, { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  // Reschedule job handler
  const handleSelectJobForReschedule = useCallback((job: JobAssignment) => {
    setSelectedJobForReschedule(job);
    // Pre-fill with current date/time
    if (job.appointments?.datetime) {
      const dt = parseUTCDateTime(job.appointments.datetime);
      setRescheduleDate(format(dt, 'yyyy-MM-dd'));
      setRescheduleTime(format(dt, 'HH:mm'));
    }
  }, []);

  const handleSendReschedule = useCallback(async () => {
    if (!selectedJobForReschedule || !rescheduleDate || !rescheduleTime || processingJobId) return;
    
    setProcessingJobId(selectedJobForReschedule.id);
    const customerName = selectedJobForReschedule.appointments?.customer_name || 'Customer';
    const appointmentId = selectedJobForReschedule.appointments?.id;
    
    try {
      const newDatetime = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();

      if (appointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update({ datetime: newDatetime, status: 'scheduled' })
          .eq('id', appointmentId);
        if (error) throw error;

        // Send reschedule notifications
        try {
          await supabase.functions.invoke('send-appointment-email', {
            body: { appointmentId, type: 'reschedule' }
          });
        } catch (e) { console.error('Reschedule email failed:', e); }

        try {
          await supabase.functions.invoke('send-appointment-sms', {
            body: { appointmentId, type: 'reschedule' }
          });
        } catch (e) { console.error('Reschedule SMS failed:', e); }
      }

      toast.success(`${jobNoun} rescheduled for ${customerName}`, { description: 'Customer has been notified' });
      refetchJobs();
      setSelectorMode(null);
      setSelectedJobForReschedule(null);
      setRescheduleDate('');
      setRescheduleTime('');
      sendMessage(`I have rescheduled ${customerName}'s ${selectedJobForReschedule.appointments?.service_type || 'service'} appointment to ${rescheduleDate} at ${rescheduleTime}.`);

    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('Failed to reschedule', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [selectedJobForReschedule, rescheduleDate, rescheduleTime, processingJobId, refetchJobs, sendMessage]);

  // Combined Arrive & Start handler - marks as arrived, notifies customer, then starts job
  const handleSelectJobForArriveAndStart = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || customerNoun;
    
    try {
      // First update to arrived
      const { error: arrivedError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'arrived',
          arrived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (arrivedError) throw arrivedError;

      // Send arrival notification to customer
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

      toast.success(`${serviceConfig.fieldRouting ? 'Arrived & started' : 'Checked in / started'} ${jobNounLower} for ${customerName}`, { 
        description: 'Customer has been notified of your arrival' 
      });
      refetchJobs();
      setSelectorMode(null);
      
      // Store job context for potential quote/invoice
      setLastCompletedJobContext({
        customerName: job.appointments?.customer_name || '',
        customerPhone: job.appointments?.customer_phone || '',
        customerEmail: job.appointments?.customer_email || '',
        customerAddress: job.appointments?.customer_address || job.customer_address || '',
        serviceType: job.appointments?.service_type || '',
        jobId: job.id,
        appointmentId: job.appointments?.id,
      });
      
      sendMessage(serviceConfig.fieldRouting ? `I have arrived at ${customerName}'s location and started working on the ${job.appointments?.service_type || serviceConfig.serviceNoun} ${jobNounLower}.` : `I have checked in ${customerName} and started the ${job.appointments?.service_type || serviceConfig.serviceNoun} ${jobNounLower}.`);

    } catch (error) {
      console.error('Arrive & Start error:', error);
      toast.error('Failed to update status', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  const handleSelectJobForComplete = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || customerNoun;
    
    try {
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: 'completed',
          recipientType: 'customer'
        }
      });

      // Store job context for quote/invoice generation
      setLastCompletedJobContext({
        customerName: job.appointments?.customer_name || '',
        customerPhone: job.appointments?.customer_phone || '',
        customerEmail: job.appointments?.customer_email || '',
        customerAddress: job.appointments?.customer_address || job.customer_address || '',
        serviceType: job.appointments?.service_type || '',
        jobId: job.id,
        appointmentId: job.appointments?.id,
      });

      toast.success(`${jobNoun} completed for ${customerName}`, { 
        description: 'Customer has been notified. Generate a quote or invoice?' 
      });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I have completed the ${job.appointments?.service_type || serviceConfig.serviceNoun} ${jobNounLower} for ${customerName}. Would you like to generate an estimate, quote, or invoice?`);

    } catch (error) {
      console.error('Complete job error:', error);
      toast.error(`Failed to complete ${jobNounLower}`, { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  // Handle quote form submission
  const handleQuoteSubmit = useCallback((data: BusinessQuoteData) => {
    const serviceNames = data.selectedServices.join(', ');
    sendMessage(`Create a quote for ${data.customerName} (${data.customerPhone}) for services: ${serviceNames}. ${data.issueDescription ? `Notes: ${data.issueDescription}` : ''} Send via ${data.sendEmail ? 'email' : ''}${data.sendEmail && data.sendSms ? ' and ' : ''}${data.sendSms ? 'SMS' : ''}.`);
    setSelectorMode(null);
    toast.success('Quote request sent to AI agent');
  }, [sendMessage]);

  // Handle invoice form submission
  const handleInvoiceSubmit = useCallback((data: InvoiceFormData) => {
    sendMessage(`Create an invoice for ${data.customerName} (${data.customerPhone}) for ${data.serviceType}, amount: $${data.amount}. ${data.notes ? `Notes: ${data.notes}` : ''} Send via ${data.sendEmail ? 'email' : ''}${data.sendEmail && data.sendSms ? ' and ' : ''}${data.sendSms ? 'SMS' : ''}.`);
    setSelectorMode(null);
    toast.success('Invoice request sent to AI agent');
  }, [sendMessage]);

  const getAgentBadge = (agentType?: string) => {
    const style = getAgentStyle(agentType);
    return (
      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 border-0', style.bgColor, style.color)}>
        {style.label}
      </Badge>
    );
  };

  const agentInfo = getAgentStyleForIndustry(currentAgent, serviceConfig.industryId);
  
  // Get active label based on selector mode - show "Home" when no action is active
  const getActiveLabel = () => {
    if (selectorMode === 'accept') return `${jobNoun} Accept`;
    if (selectorMode === 'decline') return `${jobNoun} Decline`;
    if (selectorMode === 'directions') return 'Directions';
    if (selectorMode === 'enroute') return 'En Route';
    if (selectorMode === 'eta') return 'ETA Update';
    if (selectorMode === 'arrive_start') return serviceConfig.fieldRouting ? 'Arrival' : 'Check-In';
    if (selectorMode === 'complete') return `${jobNoun} Completion`;
    if (selectorMode === 'reschedule') return 'Reschedule';
    if (selectorMode === 'quote') return 'Quoting';
    if (selectorMode === 'invoice') return 'Invoicing';
    if (messages.length > 0) return agentInfo.label;
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={index}
        className={cn(
          'flex gap-2.5 animate-fade-in',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm',
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md' 
              : 'bg-card border border-border/50 rounded-bl-md'
          )}
        >
          {!isUser && msg.agent && (
            <div className="mb-1.5">
              {getAgentBadge(msg.agent)}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          {msg.timestamp && (
            <p className={cn(
              'text-[10px] mt-1.5',
              isUser ? 'text-white' : 'text-white'
            )}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-500';
      case 'en_route': return serviceConfig.fieldRouting ? 'bg-yellow-500' : 'bg-cyan-500';
      case 'arrived': return 'bg-green-500';
      case 'in_progress': return 'bg-purple-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getSelectorText = (id: ServiceActionId, fallbackTitle: string, fallbackEmpty: string) => ({
    title: serviceConfig.selectorText[id]?.title || fallbackTitle,
    emptyMessage: serviceConfig.selectorText[id]?.emptyMessage || fallbackEmpty,
  });

  const getSelectorConfig = () => {
    if (selectorMode === 'accept') {
      return {
        icon: CheckCircle,
        ...getSelectorText('accept', `Select ${jobNounLower} to accept`, `No pending ${jobNounLower}s to accept`),
        actionIcon: CheckCircle,
        onSelect: handleSelectJobForAccept,
      };
    }
    if (selectorMode === 'decline') {
      return {
        icon: XCircle,
        ...getSelectorText('decline', `Select ${jobNounLower} to decline`, `No pending ${jobNounLower}s to decline`),
        actionIcon: XCircle,
        onSelect: handleSelectJobForDecline,
      };
    }
    if (selectorMode === 'directions') {
      return {
        icon: Navigation,
        ...getSelectorText('directions', `Select ${jobNounLower} for directions`, `No ${jobNounLower}s assigned to you`),
        actionIcon: Navigation,
        onSelect: handleSelectJobForDirections,
      };
    }
    if (selectorMode === 'enroute') {
      return {
        icon: Truck,
        ...getSelectorText('enroute', `Select ${jobNounLower} to mark as en route`, `No accepted ${jobNounLower}s to mark as en route`),
        actionIcon: Truck,
        onSelect: handleSelectJobForEnRoute,
      };
    }
    if (selectorMode === 'eta') {
      return {
        icon: Clock,
        title: selectedJobForEta ? 'Enter estimated arrival time' : getSelectorText('eta', `Select ${jobNounLower} to update ETA`, `No active ${jobNounLower}s to update ETA`).title,
        emptyMessage: getSelectorText('eta', `Select ${jobNounLower} to update ETA`, `No active ${jobNounLower}s to update ETA`).emptyMessage,
        actionIcon: Clock,
        onSelect: handleSelectJobForEta,
      };
    }
    if (selectorMode === 'arrive_start') {
      return {
        icon: Play,
        ...getSelectorText('arrive_start', serviceConfig.fieldRouting ? `Select ${jobNounLower} to arrive & start` : `Select ${jobNounLower} to check in / start`, serviceConfig.fieldRouting ? `No en route ${jobNounLower}s available` : `No ready ${jobNounLower}s available`),
        actionIcon: Play,
        onSelect: handleSelectJobForArriveAndStart,
      };
    }
    if (selectorMode === 'complete') {
      return {
        icon: CheckCircle,
        ...getSelectorText('complete', `Select ${jobNounLower} to mark as completed`, `No active ${jobNounLower}s to complete`),
        actionIcon: CheckCircle,
        onSelect: handleSelectJobForComplete,
      };
    }
    if (selectorMode === 'reschedule') {
      return {
        icon: CalendarClock,
        title: selectedJobForReschedule ? 'Set new date & time' : getSelectorText('reschedule', `Select ${jobNounLower} to reschedule`, `No active ${jobNounLower}s to reschedule`).title,
        emptyMessage: getSelectorText('reschedule', `Select ${jobNounLower} to reschedule`, `No active ${jobNounLower}s to reschedule`).emptyMessage,
        actionIcon: CalendarClock,
        onSelect: handleSelectJobForReschedule,
      };
    }
    return null;
  };

  const selectorConfig = getSelectorConfig();

  const { data: fieldOpsMetrics } = useFieldOpsMetrics(effectiveCompanyId);
  const fm = fieldOpsMetrics;
  const { companyCreatedAt } = useCompanyUptime(effectiveCompanyId);

  const FIELDOPS_AGENTS: CyberAgent[] = serviceConfig.operatives.map((agent, index) => ({
    ...agent,
    status: agent.status === 'idle' ? 'off' : agent.status,
    metric1Value: index === 0 ? (fm?.jobsTotal ?? 0) : (fm?.jobsPending ?? 0),
    metric2Value: index === 0 ? (serviceConfig.fieldRouting ? (fm?.jobsEnRoute ?? 0) : (fm?.jobsPending ?? 0)) : (fm?.jobsCompletedToday ?? 0),
  }));

  return (
    <CyberConsoleLayout
      companyName={companyData?.name || serviceConfig.workerConsoleTitle}
      logoUrl={companyData?.logo_url}
      agentLabel={activeLabel}
      agentColor={agentInfo.color}
      agentBgColor={agentInfo.bgColor}
      subtitle={serviceConfig.consoleSubtitle}
      companyCreatedAt={companyCreatedAt}
      tabs={serviceConfig.tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => {
        setActiveTab(tabId);
        if (tabId === 'dispatch') {
          const action = availableActions.find(a => a.id === 'dispatch');
          if (action) handleQuickAction(action);
        } else if (tabId !== 'chat' && tabId !== 'directions') {
          const action = availableActions.find(a => a.id === tabId);
          if (action) handleQuickAction(action);
        }
      }}
      onHomeClick={() => {
        clearMessages();
        setInputValue('');
        setSelectorMode(null);
        setSelectedJobForEta(null);
        setEtaMinutes('');
        setActiveTab('chat');
      }}
      agents={FIELDOPS_AGENTS}
      currentAgentId={
        activeTab === 'directions' ? 'field_navigation' :
        activeTab === 'eta' ? 'field_navigation' :
        (activeTab === 'arrive_start' || activeTab === 'complete') ? serviceConfig.defaultOperative :
        activeTab === 'invoice' || activeTab === 'quote' ? 'business_finance' :
        serviceConfig.defaultOperative
      }
      onAgentClick={(agentId) => {
        const AGENT_TO_TAB: Record<string, string> = {
          dispatch: 'chat',
          field_navigation: serviceConfig.fieldRouting ? 'directions' : 'chat',
          route: 'directions',
          eta: 'eta',
          checkin: 'arrive_start',
          customer_journey: 'chat',
          business_finance: 'invoice',
          outreach: 'chat',
        };
        const tabId = AGENT_TO_TAB[agentId];
        if (tabId) {
          if (tabId === 'chat') {
            clearMessages();
            setActiveTab('chat');
          } else {
            setActiveTab(tabId);
            const action = availableActions.find(a => a.id === tabId);
            if (action) handleQuickAction(action);
          }
        }
      }}
      quickActions={availableActions.map(a => ({ id: a.id, label: a.label, icon: a.icon, message: a.message, hsl: '189,100%,65%' }))}
      onQuickAction={(_, id) => {
        const action = availableActions.find(a => a.id === id);
        if (action) handleQuickAction(action);
      }}
      showPhone={!!companyData?.dispatch_phone}
      onPhoneClick={() => {
        if (companyData?.dispatch_phone) {
          const cleanPhone = companyData.dispatch_phone.replace(/[^\d+]/g, '');
          window.location.href = `tel:${cleanPhone}`;
        }
      }}
      isOnline={true}
      useDefaultLogo={!companyData?.logo_url}
    >
      {/* Quick Actions moved inside chat content area */}

      {/* Quote Form Panel */}
      {selectorMode === 'quote' && effectiveCompanyId && (
        <div className="shrink-0 border-b max-h-[60%] overflow-auto" style={{ background: 'rgba(2,8,18,0.97)', borderColor: 'rgba(0,229,255,0.1)' }}>
          <BusinessQuoteForm
            companyId={effectiveCompanyId}
            onSubmit={handleQuoteSubmit}
            onCancel={() => setSelectorMode(null)}
            mode="ai"
            showBackButton={true}
          />
        </div>
      )}

      {/* Invoice Form Panel */}
      {selectorMode === 'invoice' && effectiveCompanyId && (
        <div className="shrink-0 border-b max-h-[60%] overflow-auto" style={{ background: 'rgba(2,8,18,0.97)', borderColor: 'rgba(0,229,255,0.1)' }}>
          <InvoiceForm
            companyId={effectiveCompanyId}
            onSubmit={handleInvoiceSubmit}
            onCancel={() => setSelectorMode(null)}
            mode="ai"
            showBackButton={true}
          />
        </div>
      )}

      {/* Job Selector Panel */}
      {selectorMode && selectorConfig && selectorMode !== 'quote' && selectorMode !== 'invoice' && (
        <div className="shrink-0 border-b p-4" style={{ background: 'rgba(2,8,18,0.97)', borderColor: 'rgba(0,229,255,0.1)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium flex items-center gap-2 text-foreground">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <selectorConfig.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span>{selectorConfig.title}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted" onClick={() => {
              setSelectorMode(null);
              setSelectedJobForEta(null);
              setEtaMinutes('');
              setSelectedJobForReschedule(null);
              setRescheduleDate('');
              setRescheduleTime('');
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ETA Input Form - shown after job selection */}
          {selectorMode === 'eta' && selectedJobForEta && (
            <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusColor(selectedJobForEta.status))} />
                <span className="font-medium text-sm text-foreground">{selectedJobForEta.appointments?.customer_name}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {selectedJobForEta.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="ETA in minutes"
                    value={etaMinutes}
                    onChange={(e) => setEtaMinutes(e.target.value)}
                    min="1"
                    className="h-8 text-sm"
                  />
                </div>
                <Button 
                  size="sm" 
                  className="h-8"
                  onClick={handleSendEtaUpdate}
                  disabled={!etaMinutes || processingJobId === selectedJobForEta.id}
                >
                  {processingJobId === selectedJobForEta.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-foreground/60 mt-1">
                {customerNoun} will be notified via SMS & email
              </p>
            </div>
          )}

          {/* Reschedule Input Form - shown after job selection */}
          {selectorMode === 'reschedule' && selectedJobForReschedule && (
            <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusColor(selectedJobForReschedule.status))} />
                <span className="font-medium text-sm text-white">{selectedJobForReschedule.appointments?.customer_name}</span>
                <Badge className="text-[9px] px-1.5 py-0" style={{ background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', border: 'none' }}>
                  {selectedJobForReschedule.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-8 text-sm bg-white/5 border-white/10 text-white"
                />
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="h-8 text-sm flex-1 bg-white/5 border-white/10 text-white"
                  />
                  <Button 
                    size="sm" 
                    className="h-8"
                    onClick={handleSendReschedule}
                    disabled={!rescheduleDate || !rescheduleTime || processingJobId === selectedJobForReschedule.id}
                  >
                    {processingJobId === selectedJobForReschedule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarClock className="h-3.5 w-3.5 mr-1" />
                        Reschedule
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-white mt-1">
                {customerNoun} will be notified via SMS & email
              </p>
            </div>
          )}
          
          {jobsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-4 text-sm text-white">
              {selectorConfig.emptyMessage}
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {filteredJobs.map((job) => {
                const address = job.customer_address || job.appointments?.customer_address;
                const appointment = job.appointments;
                const isProcessing = processingJobId === job.id;
                const isSelected = selectedJobForEta?.id === job.id;
                
                return (
                  <div
                    key={job.id}
                    onClick={() => !isProcessing && (selectorMode !== 'eta' || !selectedJobForEta) && selectorConfig.onSelect(job)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all',
                      (isProcessing || (selectorMode === 'eta' && selectedJobForEta && !isSelected)) && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      background: isSelected ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getStatusColor(job.status))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {appointment?.customer_name || customerNoun}
                          </span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-white truncate">
                          {appointment?.service_type || 'Service'}
                        </p>
                        {address ? (
                          <p className="text-xs flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{address}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-destructive mt-1">{serviceConfig.noAddressLabel}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {appointment?.datetime && (
                            <p className="text-[10px] text-white flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseUTCDateTime(appointment.datetime), 'h:mm a')}
                            </p>
                          )}
                          {job.estimated_arrival_minutes && (
                            <p className="text-[10px] text-white flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {serviceConfig.fieldRouting ? 'ETA' : 'Wait'}: {job.estimated_arrival_minutes}m
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2 shrink-0" 
                        disabled={isProcessing || (selectorMode === 'eta' && selectedJobForEta && !isSelected)}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <selectorConfig.actionIcon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Directions Tab - TechnicianMap */}
      {activeTab === 'directions' && (
        <div className="flex-1 relative min-h-[300px] overflow-hidden" style={{ background: 'rgba(2,8,18,0.97)' }}>
          <TechnicianMap
            initialAddress={navigationAddress}
            onAddressSearched={() => setNavigationAddress(null)}
            onRouteCalculated={(distance, duration) => {
              toast.success(`Route: ${distance}`, { description: `ETA: ${duration}` });
            }}
          />
        </div>
      )}

      {/* ETA Tab - Update ETA for jobs */}
      {activeTab === 'eta' && (
        <div className="flex-1 overflow-auto p-4" style={{ background: 'rgba(3,9,20,0.95)' }}>
          <div className="space-y-4">
            <div className="text-center pb-3 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-3 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Update ETA</h3>
              <p className="text-sm text-white">Select a {jobNounLower} to update the estimated arrival time</p>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : assignedJobs.filter(j => ['accepted', 'en_route'].includes(j.status)).length === 0 ? (
              <div className="text-center py-8 text-sm text-white">
                No {jobNounLower}s currently en route or accepted
              </div>
            ) : (
              <div className="space-y-3">
                {assignedJobs.filter(j => ['accepted', 'en_route'].includes(j.status)).map((job) => {
                  const address = job.customer_address || job.appointments?.customer_address;
                  const appointment = job.appointments;
                  const isSelected = selectedJobForEta?.id === job.id;
                  const isProcessing = processingJobId === job.id;

                  return (
                    <div key={job.id} className="space-y-2">
                      <div
                        onClick={() => !isProcessing && setSelectedJobForEta(isSelected ? null : job)}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-all',
                          'hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/30',
                          isSelected && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getStatusColor(job.status))} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {appointment?.customer_name || customerNoun}
                              </span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                {job.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-white truncate">
                              {appointment?.service_type || serviceConfig.serviceNoun}
                            </p>
                            {address && (
                              <p className="text-xs flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                                <span className="truncate">{address}</span>
                              </p>
                            )}
                            {job.estimated_arrival_minutes && (
                              <p className="text-xs text-amber-600 font-medium mt-1">
                                Current ETA: {job.estimated_arrival_minutes} min
                              </p>
                            )}
                          </div>
                          <Clock className={cn("h-4 w-4 shrink-0", isSelected ? "text-amber-600" : "text-white")} />
                        </div>
                      </div>

                      {/* ETA Input - shown when job is selected */}
                      {isSelected && (
                        <div className="ml-4 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="number"
                                placeholder="ETA in minutes"
                                value={etaMinutes}
                                onChange={(e) => setEtaMinutes(e.target.value)}
                                min="1"
                                className="h-9"
                              />
                            </div>
                            <Button 
                              size="sm" 
                              className="h-9 bg-amber-600 hover:bg-amber-700"
                              onClick={handleSendEtaUpdate}
                              disabled={!etaMinutes || isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5 mr-1" />
                                  Update
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-[10px] text-white mt-2">
                            {customerNoun} will be notified via SMS & email
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch Tab - Contact dispatch */}
      {activeTab === 'dispatch' && (
        <div className="flex-1 overflow-auto p-4" style={{ background: 'rgba(3,9,20,0.95)' }}>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{serviceConfig.contactTeamLabel}</h3>
            <p className="text-sm text-white max-w-xs mx-auto mb-6">
              {serviceConfig.contactTeamDescription}
            </p>
            {companyData?.dispatch_phone ? (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const cleanPhone = companyData.dispatch_phone!.replace(/[^\d+]/g, '');
                  window.location.href = `tel:${cleanPhone}`;
                }}
              >
                <Phone className="h-5 w-5 mr-2" />
                {serviceConfig.contactTeamLabel.replace(/^Contact /, 'Call ')}
              </Button>
            ) : (
              <p className="text-sm text-white">No team phone number configured</p>
            )}
          </div>
        </div>
      )}

      {/* Chat Tab - matching AIAgentConsole structure */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: 'rgba(3,9,20,0.95)' }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !selectorMode && (
              <WelcomeScreen
                title={serviceConfig.welcomeTitle}
                subtitle={canPerformJobActions 
                  ? serviceConfig.welcomeSubtitle
                  : `View ${jobNounLower} information${serviceConfig.fieldRouting ? ' and get directions' : ''} (${jobNounLower} actions are for assigned ${serviceConfig.teamMemberNoun.toLowerCase()}s only)`
                }
                actions={availableActions}
                onAction={(message, actionId) => {
                  const action = availableActions.find(a => a.id === actionId);
                  if (action) handleQuickAction(action);
                }}
                consoleType="fieldops"
              />
            )}

            {messages.length > 0 && messages.map((msg, index) => {
              const msgAgentInfo = msg.agent ? getAgentBadge(msg.agent) : null;
              return (
                <ChatBubble
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  agentLabel={agentInfo.label}
                  agentColor={agentInfo.color}
                  agentBgColor={agentInfo.bgColor}
                />
              );
            })}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <ChatBubble
                role="assistant"
                content=""
                isLoading
              />
            )}
          </div>

          {/* Quick Actions Bar - shown when there are messages */}
          {messages.length > 0 && !selectorMode && (
            <QuickActionBar
              actions={availableActions}
              onAction={(message, actionId) => {
                const action = availableActions.find(a => a.id === actionId);
                if (action) handleQuickAction(action);
              }}
            />
          )}

          {/* Floating Input */}
          <FloatingInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            onHome={() => {
              setInputValue('');
              setSelectorMode(null);
              setSelectedJobForEta(null);
              setEtaMinutes('');
            }}
            isLoading={isLoading}
            placeholder={serviceConfig.inputPlaceholder}
          />
        </div>
      )}
    </CyberConsoleLayout>
  );
}
