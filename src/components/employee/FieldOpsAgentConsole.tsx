import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { GlassHeader } from '@/components/ai/chat/GlassHeader';
import { MobileTabNav } from '@/components/ai/chat/MobileTabNav';

const FIELD_OPS_AGENTS = [
  { id: 'accept', name: 'Accept Job', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'directions', name: 'Get Directions', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'enroute', name: 'En Route', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'eta', name: 'Update ETA', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'arrived', name: 'Arrived', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'complete', name: 'Complete Job', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'dispatch', name: 'Contact Dispatch', color: 'bg-blue-100', textColor: 'text-blue-700' },
];

// Tabs for the console - matching AIAgentConsole structure
const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'jobs', label: 'Jobs', icon: Truck },
  { id: 'directions', label: 'Directions', icon: Navigation },
  { id: 'eta', label: 'ETA', icon: Clock },
  { id: 'dispatch', label: 'Dispatch', icon: Phone },
];

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'accept', label: 'Accept Job', icon: CheckCircle, message: '' },
  { id: 'directions', label: 'Get Directions', icon: Navigation, message: '' },
  { id: 'enroute', label: 'En Route', icon: Truck, message: '' },
  { id: 'eta', label: 'Update ETA', icon: Clock, message: '' },
  { id: 'arrived', label: 'Arrived', icon: MapPin, message: '' },
  { id: 'complete', label: 'Complete Job', icon: CheckCircle, message: '', variant: 'default' },
  { id: 'dispatch', label: 'Contact Dispatch', icon: Phone, message: '' },
];

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
  } | null;
}

interface FieldOpsAgentConsoleProps {
  companyId?: string;
  onNavigateRequest?: (address: string) => void;
  className?: string;
}

type SelectorMode = 'accept' | 'directions' | 'enroute' | 'eta' | 'arrived' | 'complete' | null;

export function FieldOpsAgentConsole({ companyId, onNavigateRequest, className }: FieldOpsAgentConsoleProps) {
  const { user, companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = companyId || authCompanyId;
  
  const [inputValue, setInputValue] = useState('');
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [selectedJobForEta, setSelectedJobForEta] = useState<JobAssignment | null>(null);
  const [etaMinutes, setEtaMinutes] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch company dispatch phone
  const { data: companyData } = useQuery({
    queryKey: ['company-dispatch-phone', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('dispatch_phone, name')
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

  const { messages, isLoading, currentAgent, sendMessage } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
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
            customer_address
          )
        `)
        .eq('employee_id', user.id)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'])
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

  // Filter jobs based on selector mode
  const getFilteredJobs = () => {
    if (selectorMode === 'accept') {
      return assignedJobs.filter(job => job.status === 'pending_acceptance');
    }
    if (selectorMode === 'enroute') {
      return assignedJobs.filter(job => job.status === 'accepted');
    }
    if (selectorMode === 'eta') {
      return assignedJobs.filter(job => ['accepted', 'en_route'].includes(job.status));
    }
    if (selectorMode === 'arrived') {
      return assignedJobs.filter(job => job.status === 'en_route');
    }
    if (selectorMode === 'complete') {
      return assignedJobs.filter(job => ['arrived', 'in_progress'].includes(job.status));
    }
    return assignedJobs;
  };

  const filteredJobs = getFilteredJobs();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    if (action.id === 'accept') {
      setSelectorMode('accept');
      return;
    }
    if (action.id === 'directions') {
      setSelectorMode('directions');
      return;
    }
    if (action.id === 'enroute') {
      setSelectorMode('enroute');
      return;
    }
    if (action.id === 'eta') {
      setSelectorMode('eta');
      setSelectedJobForEta(null);
      setEtaMinutes('');
      return;
    }
    if (action.id === 'arrived') {
      setSelectorMode('arrived');
      return;
    }
    if (action.id === 'complete') {
      setSelectorMode('complete');
      return;
    }
    if (action.id === 'dispatch') {
      if (companyData?.dispatch_phone) {
        const cleanPhone = companyData.dispatch_phone.replace(/[^\d+]/g, '');
        window.location.href = `tel:${cleanPhone}`;
        toast.success('Calling Dispatch', { description: companyData.name || 'Company dispatch line' });
      } else {
        toast.error('Dispatch phone not configured', { 
          description: 'Please contact your administrator to set up the dispatch number' 
        });
      }
      return;
    }
    await sendMessage(action.message);
  }, [sendMessage, companyData]);

  const handleSelectJobForDirections = useCallback((job: JobAssignment) => {
    const address = job.customer_address || job.appointments?.customer_address;
    if (address) {
      onNavigateRequest?.(address);
      setSelectorMode(null);
      sendMessage(`I need directions to ${job.appointments?.customer_name || 'my appointment'} at ${address}`);
    }
  }, [onNavigateRequest, sendMessage]);

  const handleSelectJobForEnRoute = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || 'Customer';
    
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
    const customerName = selectedJobForEta.appointments?.customer_name || 'Customer';
    
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
    const customerName = job.appointments?.customer_name || 'Customer';
    
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

      toast.success(`Job accepted for ${customerName}`, { description: 'Customer has been notified' });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I have accepted the ${job.appointments?.service_type || 'service'} job for ${customerName}.`);

    } catch (error) {
      console.error('Accept job error:', error);
      toast.error('Failed to accept job', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  const handleSelectJobForArrived = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || 'Customer';
    
    try {
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update({ 
          status: 'arrived',
          arrived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      await supabase.functions.invoke('send-job-notification', {
        body: {
          jobAssignmentId: job.id,
          notificationType: 'arrived',
          recipientType: 'customer'
        }
      });

      toast.success(`Arrived at ${customerName}'s location`, { description: 'Customer has been notified of your arrival' });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I have arrived at ${customerName}'s location for their ${job.appointments?.service_type || 'service'} appointment.`);

    } catch (error) {
      console.error('Arrived error:', error);
      toast.error('Failed to update status', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  const handleSelectJobForComplete = useCallback(async (job: JobAssignment) => {
    if (processingJobId) return;
    
    setProcessingJobId(job.id);
    const customerName = job.appointments?.customer_name || 'Customer';
    
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

      toast.success(`Job completed for ${customerName}`, { description: 'Customer has been notified' });
      refetchJobs();
      setSelectorMode(null);
      sendMessage(`I have completed the ${job.appointments?.service_type || 'service'} job for ${customerName}.`);

    } catch (error) {
      console.error('Complete job error:', error);
      toast.error('Failed to complete job', { description: 'Please try again' });
    } finally {
      setProcessingJobId(null);
    }
  }, [processingJobId, refetchJobs, sendMessage]);

  const getAgentBadge = (agentType?: string) => {
    const agent = FIELD_OPS_AGENTS.find(a => a.id === agentType);
    if (!agent) return null;
    return (
      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 border-0', agent.color, agent.textColor)}>
        {agent.name}
      </Badge>
    );
  };

  const getAgentInfo = () => {
    return { label: currentAgent || 'Field Ops', color: 'text-blue-700', bgColor: 'bg-blue-100' };
  };

  const agentInfo = getAgentInfo();

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
              isUser ? 'text-white/70' : 'text-muted-foreground'
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
      case 'en_route': return 'bg-yellow-500';
      case 'arrived': return 'bg-green-500';
      case 'in_progress': return 'bg-purple-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getSelectorConfig = () => {
    if (selectorMode === 'accept') {
      return {
        icon: CheckCircle,
        title: 'Select job to accept',
        emptyMessage: 'No pending jobs to accept',
        actionIcon: CheckCircle,
        onSelect: handleSelectJobForAccept,
      };
    }
    if (selectorMode === 'directions') {
      return {
        icon: Navigation,
        title: 'Select appointment for directions',
        emptyMessage: 'No appointments assigned to you',
        actionIcon: Navigation,
        onSelect: handleSelectJobForDirections,
      };
    }
    if (selectorMode === 'enroute') {
      return {
        icon: Truck,
        title: 'Select appointment to mark as en route',
        emptyMessage: 'No accepted appointments to mark as en route',
        actionIcon: Truck,
        onSelect: handleSelectJobForEnRoute,
      };
    }
    if (selectorMode === 'eta') {
      return {
        icon: Clock,
        title: selectedJobForEta ? 'Enter estimated arrival time' : 'Select appointment to update ETA',
        emptyMessage: 'No active appointments to update ETA',
        actionIcon: Clock,
        onSelect: handleSelectJobForEta,
      };
    }
    if (selectorMode === 'arrived') {
      return {
        icon: MapPin,
        title: 'Select appointment to mark as arrived',
        emptyMessage: 'No en route appointments to mark as arrived',
        actionIcon: MapPin,
        onSelect: handleSelectJobForArrived,
      };
    }
    if (selectorMode === 'complete') {
      return {
        icon: CheckCircle,
        title: 'Select job to mark as completed',
        emptyMessage: 'No active jobs to complete',
        actionIcon: CheckCircle,
        onSelect: handleSelectJobForComplete,
      };
    }
    return null;
  };

  const selectorConfig = getSelectorConfig();

  return (
    <Card className={cn('h-[calc(100vh-200px)] sm:h-[600px] flex flex-col overflow-hidden border-0 shadow-xl', className)}>
      {/* Header - matching AIAgentConsole glass style */}
      <GlassHeader
        companyName="Field Ops Assistant"
        agentLabel={agentInfo.label}
        agentColor={agentInfo.color}
        agentBgColor={agentInfo.bgColor}
        showPhone={!!companyData?.dispatch_phone}
        onPhoneClick={() => {
          if (companyData?.dispatch_phone) {
            const cleanPhone = companyData.dispatch_phone.replace(/[^\d+]/g, '');
            window.location.href = `tel:${cleanPhone}`;
          }
        }}
        isOnline={true}
      />

      {/* Tab Navigation - matching AIAgentConsole */}
      <MobileTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Quick Actions - matching AIAgentConsole style */}
      {activeTab === 'chat' && (
        <div className="shrink-0 px-4 py-3 border-b bg-muted/30">
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant={action.id === 'complete' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-auto py-2 px-3 flex flex-col items-center gap-1 min-w-[80px]',
                  action.id === 'complete' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                )}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
              >
                <action.icon className="h-4 w-4" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Job Selector Panel */}
      {selectorMode && selectorConfig && (
        <div className="shrink-0 border-b bg-blue-50 dark:bg-blue-950/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <selectorConfig.icon className="h-3.5 w-3.5 text-white" />
              </div>
              {selectorConfig.title}
            </p>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50" onClick={() => {
              setSelectorMode(null);
              setSelectedJobForEta(null);
              setEtaMinutes('');
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ETA Input Form - shown after job selection */}
          {selectorMode === 'eta' && selectedJobForEta && (
            <div className="mb-3 p-2.5 rounded-lg border bg-background">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusColor(selectedJobForEta.status))} />
                <span className="font-medium text-sm">{selectedJobForEta.appointments?.customer_name}</span>
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
              <p className="text-[10px] text-muted-foreground mt-1">
                Customer will be notified via SMS & email
              </p>
            </div>
          )}
          
          {jobsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
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
                      'p-3 rounded-lg border cursor-pointer transition-all bg-background',
                      'hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/30',
                      isSelected && 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
                      (isProcessing || (selectorMode === 'eta' && selectedJobForEta && !isSelected)) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getStatusColor(job.status))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {appointment?.customer_name || 'Customer'}
                          </span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {appointment?.service_type || 'Service'}
                        </p>
                        {address ? (
                          <p className="text-xs flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                            <span className="truncate">{address}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-destructive mt-1">No address available</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {appointment?.datetime && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(appointment.datetime), 'h:mm a')}
                            </p>
                          )}
                          {job.estimated_arrival_minutes && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ETA: {job.estimated_arrival_minutes}m
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/20" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Field Ops Ready</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Manage your jobs - accept, navigate, update ETAs, and complete assignments
              </p>
            </div>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input - matching AIAgentConsole floating style */}
      <div className="shrink-0 p-4 border-t bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about jobs, directions, ETAs..."
            disabled={isLoading}
            className="h-11 rounded-full px-4 border-muted-foreground/20 focus-visible:ring-primary"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !inputValue.trim()} 
            size="icon" 
            className="h-11 w-11 rounded-full shadow-md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
