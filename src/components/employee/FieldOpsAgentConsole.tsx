import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const FIELD_OPS_AGENTS = [
  { id: 'dispatch', name: 'Dispatch', color: 'bg-blue-500' },
  { id: 'route', name: 'Route', color: 'bg-green-500' },
  { id: 'eta', name: 'ETA', color: 'bg-yellow-500' },
  { id: 'checkin', name: 'Check-In', color: 'bg-purple-500' },
];

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'directions', label: 'Get Directions', icon: Navigation, message: '' },
  { id: 'eta', label: 'Update ETA', icon: Clock, message: 'I need to update my ETA for the current job' },
  { id: 'checkin', label: 'Check In', icon: CheckCircle, message: 'I have arrived at the job site and want to check in' },
  { id: 'enroute', label: 'En Route', icon: Truck, message: 'I am now en route to my next appointment' },
  { id: 'photos', label: 'Upload Photos', icon: Camera, message: 'I need to upload before/after photos for this job' },
  { id: 'dispatch', label: 'Contact Dispatch', icon: Phone, message: 'I need to speak with dispatch about my current job' },
];

interface JobAssignment {
  id: string;
  status: string;
  customer_address: string | null;
  appointments: {
    id: string;
    customer_name: string;
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

export function FieldOpsAgentConsole({ companyId, onNavigateRequest, className }: FieldOpsAgentConsoleProps) {
  const { user, companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = companyId || authCompanyId;
  
  const [inputValue, setInputValue] = useState('');
  const [showJobSelector, setShowJobSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, currentAgent, sendMessage } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
    onAgentChange: (agent) => {
      console.log('[FieldOps] Agent changed to:', agent);
    },
  });

  // Fetch employee's assigned jobs
  const { data: assignedJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['employee-jobs-for-directions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          customer_address,
          appointments (
            id,
            customer_name,
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
    if (action.id === 'directions') {
      // Show job selector instead of sending message
      setShowJobSelector(true);
      return;
    }
    await sendMessage(action.message);
  }, [sendMessage]);

  const handleSelectJob = useCallback((job: JobAssignment) => {
    const address = job.customer_address || job.appointments?.customer_address;
    if (address) {
      onNavigateRequest?.(address);
      setShowJobSelector(false);
      // Also send a message to the chat for context
      sendMessage(`I need directions to ${job.appointments?.customer_name || 'my appointment'} at ${address}`);
    }
  }, [onNavigateRequest, sendMessage]);

  const getAgentBadge = (agentType?: string) => {
    const agent = FIELD_OPS_AGENTS.find(a => a.id === agentType);
    if (!agent) return null;
    return (
      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', agent.color, 'text-white')}>
        {agent.name}
      </Badge>
    );
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={index}
        className={cn(
          'flex gap-2 animate-fade-in',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-3 py-2',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-muted rounded-bl-md'
          )}
        >
          {!isUser && msg.agent && (
            <div className="mb-1">
              {getAgentBadge(msg.agent)}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          {msg.timestamp && (
            <p className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {isUser && (
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
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

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 shrink-0">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Field Ops Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">Route • ETA • Check-In • Dispatch</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentAgent || 'Ready'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="shrink-0 p-3 border-b">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-auto py-2 px-2 flex flex-col items-center gap-1 text-[10px]"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <action.icon className="h-4 w-4" />
              <span className="leading-tight text-center">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Job Selector Panel */}
      {showJobSelector && (
        <div className="shrink-0 border-b bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-primary" />
              Select appointment for directions
            </p>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowJobSelector(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {jobsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : assignedJobs.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No appointments assigned to you today
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {assignedJobs.map((job) => {
                const address = job.customer_address || job.appointments?.customer_address;
                const appointment = job.appointments;
                
                return (
                  <div
                    key={job.id}
                    onClick={() => address && handleSelectJob(job)}
                    className={cn(
                      'p-2.5 rounded-lg border cursor-pointer transition-all',
                      'hover:border-primary/50 hover:bg-primary/5',
                      !address && 'opacity-50 cursor-not-allowed'
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
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{address}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-destructive mt-1">No address available</p>
                        )}
                        {appointment?.datetime && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(appointment.datetime), 'h:mm a')}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" disabled={!address}>
                        <Navigation className="h-3.5 w-3.5" />
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
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ask me about directions, ETAs, or job status updates
              </p>
            </div>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 p-3 border-t bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            disabled={isLoading}
            className="h-10"
          />
          <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()} size="icon" className="h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
