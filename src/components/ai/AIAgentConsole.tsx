import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAIAgent } from '@/hooks/useAIAgent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Send, User, Loader2, Trash2, Phone, Mic, Calendar, 
  Clock, MessageSquare, Sparkles, ChevronRight, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceChat } from './VoiceChat';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

interface BusinessHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AIAgentConsole = () => {
  const { companyId } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages } = useAIAgent();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch company details
  const { data: company } = useQuery({
    queryKey: ['company-details', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url, primary_color, secondary_color')
        .eq('id', companyId)
        .single();
      return data as Company | null;
    },
    enabled: !!companyId,
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('services')
        .select('id, name, description, duration_minutes, price')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');
      return (data || []) as Service[];
    },
    enabled: !!companyId,
  });

  // Fetch business hours
  const { data: businessHours } = useQuery({
    queryKey: ['business-hours', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('company_id', companyId)
        .order('day_of_week');
      return (data || []) as BusinessHour[];
    },
    enabled: !!companyId,
  });

  // Fetch integration status
  const { data: integrations } = useQuery({
    queryKey: ['integrations-console', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('twilio_phone_number, elevenlabs_api_key')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const hasVoice = !!(integrations?.twilio_phone_number && integrations?.elevenlabs_api_key);
  const twilioPhone = integrations?.twilio_phone_number;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setActiveTab('chat');
  };

  const handleServiceClick = (service: Service) => {
    handleQuickAction(`Tell me about ${service.name}`);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getTodayHours = () => {
    const today = new Date().getDay();
    const todayHours = businessHours?.find(h => h.day_of_week === today);
    if (!todayHours || todayHours.is_closed) return 'Closed today';
    return `${formatTime(todayHours.open_time)} - ${formatTime(todayHours.close_time)}`;
  };

  return (
    <Card className="flex flex-col h-[700px] overflow-hidden border-2">
      {/* Header */}
      <div className="gradient-primary p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-10 w-10 rounded-full object-cover bg-white p-1"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="font-semibold">{company?.name || 'AI Assistant'}</h2>
              <p className="text-xs text-white/80">Virtual Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {twilioPhone && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={() => window.open(`tel:${twilioPhone}`, '_self')}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
            {hasVoice && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={() => setActiveTab('voice')}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger 
            value="chat" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="services"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger 
            value="hours"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Clock className="h-4 w-4 mr-2" />
            Hours
          </TabsTrigger>
          {hasVoice && (
            <TabsTrigger 
              value="voice"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </TabsTrigger>
          )}
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="h-16 w-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">Hi there! 👋</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                      I'm your virtual assistant at {company?.name || 'this business'}. How can I help you today?
                    </p>
                    
                    {/* Quick Actions */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAction("What services do you offer?")}
                      >
                        View Services
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAction("I'd like to book an appointment")}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Book Appointment
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAction("What are your business hours?")}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Business Hours
                      </Button>
                    </div>
                  </div>
                )}
                
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg',
                      message.role === 'user' 
                        ? 'bg-primary/10 ml-8' 
                        : 'bg-muted mr-8'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      message.role === 'user' ? 'bg-primary' : 'gradient-primary'
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                    <div className="flex-1 text-muted-foreground text-sm">Thinking...</div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={clearMessages}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {services?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No services configured yet
                </p>
              ) : (
                services?.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} min
                          </span>
                          {service.price && (
                            <Badge variant="secondary" className="text-xs">
                              ${service.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))
              )}
              
              <Button 
                className="w-full mt-4"
                onClick={() => handleQuickAction("I'd like to book an appointment")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule an Appointment
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">Today's Hours</span>
                </div>
                <p className="text-lg font-semibold mt-1">{getTodayHours()}</p>
              </div>

              <h4 className="font-medium mb-3">Weekly Schedule</h4>
              <div className="space-y-2">
                {DAYS.map((day, index) => {
                  const hours = businessHours?.find(h => h.day_of_week === index);
                  const isToday = new Date().getDay() === index;
                  
                  return (
                    <div 
                      key={day}
                      className={cn(
                        "flex justify-between p-3 rounded-lg",
                        isToday ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                      )}
                    >
                      <span className={cn("font-medium", isToday && "text-primary")}>
                        {day}
                        {isToday && <Badge variant="outline" className="ml-2 text-xs">Today</Badge>}
                      </span>
                      <span className="text-muted-foreground">
                        {!hours || hours.is_closed 
                          ? 'Closed' 
                          : `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}`
                        }
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button 
                className="w-full mt-6"
                onClick={() => handleQuickAction("I'd like to book an appointment")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule an Appointment
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Voice Tab */}
        {hasVoice && companyId && (
          <TabsContent value="voice" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex flex-col items-center justify-center p-4">
              <VoiceChat 
                companyId={companyId}
                companyName={company?.name || 'AI Assistant'}
                onTranscript={(role, text) => {
                  console.log(`Voice transcript [${role}]:`, text);
                }}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
};
