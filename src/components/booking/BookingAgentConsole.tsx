import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare,
  Bot,
  User,
  Loader2,
  X,
  Star,
  FileText,
  RotateCcw,
  XCircle,
  Search,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BOOKING_AGENTS = [
  { id: 'triage', name: 'Triage Agent', color: 'bg-blue-500' },
  { id: 'booking', name: 'Booking Agent', color: 'bg-green-500' },
  { id: 'followup', name: 'Follow-up Agent', color: 'bg-orange-500' },
  { id: 'review', name: 'Review Agent', color: 'bg-purple-500' },
];

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'book', label: 'Book Appointment', icon: Calendar, message: 'I need to schedule a new appointment for a customer' },
  { id: 'reschedule', label: 'Reschedule', icon: RotateCcw, message: 'I need to reschedule an existing appointment' },
  { id: 'cancel', label: 'Cancel', icon: XCircle, message: 'I need to cancel an appointment', variant: 'destructive' },
  { id: 'followup', label: 'Follow Up', icon: Phone, message: 'I need to follow up with a customer about their recent service' },
  { id: 'review', label: 'Request Review', icon: Star, message: 'I want to request a review from a customer' },
  { id: 'quote', label: 'Get Quote', icon: FileText, message: 'I need to generate a quote for a customer' },
  { id: 'lookup', label: 'Lookup Customer', icon: Search, message: 'I need to look up a customer\'s appointment history' },
];

interface AppointmentInfo {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  service_type: string;
  datetime: string;
  status: string;
  customer_address: string | null;
}

interface BookingAgentConsoleProps {
  companyId?: string;
  className?: string;
}

export function BookingAgentConsole({ companyId, className }: BookingAgentConsoleProps) {
  const { user, companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = companyId || authCompanyId;
  
  const [inputValue, setInputValue] = useState('');
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);
  const [selectorAction, setSelectorAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, currentAgent, sendMessage } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
    onAgentChange: (agent) => {
      console.log('[BookingConsole] Agent changed to:', agent);
    },
  });

  // Fetch today's appointments for quick selection
  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['today-appointments-booking', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .gte('datetime', startOfDay)
        .lte('datetime', endOfDay)
        .order('datetime', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return (data || []) as AppointmentInfo[];
    },
    enabled: !!effectiveCompanyId,
    refetchInterval: 60000,
  });

  // Fetch recent appointments for lookup
  const { data: recentAppointments = [] } = useQuery({
    queryKey: ['recent-appointments-booking', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('datetime', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recent appointments:', error);
        return [];
      }

      return (data || []) as AppointmentInfo[];
    },
    enabled: !!effectiveCompanyId && showAppointmentSelector,
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
    if (action.id === 'reschedule' || action.id === 'cancel' || action.id === 'lookup') {
      setShowAppointmentSelector(true);
      setSelectorAction(action.id);
      return;
    }
    await sendMessage(action.message);
  }, [sendMessage]);

  const handleSelectAppointment = useCallback(async (appointment: AppointmentInfo) => {
    setShowAppointmentSelector(false);
    
    let message = '';
    if (selectorAction === 'reschedule') {
      message = `I need to reschedule the appointment for ${appointment.customer_name} (${appointment.service_type}) currently scheduled for ${format(new Date(appointment.datetime), 'MMM d, yyyy h:mm a')}`;
    } else if (selectorAction === 'cancel') {
      message = `I need to cancel the appointment for ${appointment.customer_name} (${appointment.service_type}) scheduled for ${format(new Date(appointment.datetime), 'MMM d, yyyy h:mm a')}`;
    } else if (selectorAction === 'lookup') {
      message = `I need to look up information for ${appointment.customer_name}. Their last appointment was ${appointment.service_type} on ${format(new Date(appointment.datetime), 'MMM d, yyyy')}`;
    }
    
    setSelectorAction(null);
    await sendMessage(message);
  }, [selectorAction, sendMessage]);

  const getAgentBadge = (agentType?: string) => {
    const agent = BOOKING_AGENTS.find(a => a.id === agentType);
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
            <User className="w-4 h-4 text-secondary-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col bg-background rounded-lg border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium">Booking AI Assistant</span>
          {currentAgent && (
            <Badge variant="outline" className="text-xs">
              {BOOKING_AGENTS.find(a => a.id === currentAgent)?.name || currentAgent}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {todayAppointments.length} today
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="text-xs"
            >
              <action.icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Appointment Selector Modal */}
      {showAppointmentSelector && (
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Select Appointment to {selectorAction === 'reschedule' ? 'Reschedule' : selectorAction === 'cancel' ? 'Cancel' : 'View'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAppointmentSelector(false);
                setSelectorAction(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No appointments found</p>
              ) : (
                recentAppointments.map((apt) => (
                  <Card
                    key={apt.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectAppointment(apt)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{apt.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{apt.service_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{format(new Date(apt.datetime), 'MMM d')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(apt.datetime), 'h:mm a')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">Booking AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Use the quick actions above or type a message to get started
              </p>
            </div>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message or use quick actions..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
