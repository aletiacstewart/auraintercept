import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, Send, User, Loader2, Home, Phone, Mic, Calendar, 
  Clock, MessageSquare, Sparkles, ChevronRight, Building2, Volume2,
  AlertTriangle, DollarSign, MapPin, Star, CalendarPlus, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceChat } from './VoiceChat';
import { FeedbackForm } from './FeedbackForm';
import { BookingForm, BookingData } from './BookingForm';
import { format } from 'date-fns';

// Quick actions matching customer-facing widget/public chat features
const QUICK_ACTIONS = [
  { id: 'schedule', label: 'Request Appointment', icon: Calendar, message: "I'd like to request an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: DollarSign, message: "I need a quote for your services" },
  { id: 'hours', label: 'Business Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'View Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track Appointment', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'feedback', label: 'Leave Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
];

// Agent display configuration for visual indicators
const AGENT_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  triage: { label: 'Triage', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  booking: { label: 'Booking', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  dispatch: { label: 'Dispatch', color: 'text-green-700', bgColor: 'bg-green-100' },
  followup: { label: 'Follow-up', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  review: { label: 'Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  quoting: { label: 'Quoting', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  invoice: { label: 'Invoice', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  inventory: { label: 'Inventory', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  marketing: { label: 'Marketing', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  referral: { label: 'Referral', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  winback: { label: 'Win-back', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  checkin: { label: 'Check-in', color: 'text-green-700', bgColor: 'bg-green-100' },
  route: { label: 'Route', color: 'text-green-700', bgColor: 'bg-green-100' },
  eta: { label: 'ETA', color: 'text-green-700', bgColor: 'bg-green-100' },
  warranty: { label: 'Warranty', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  analytics: { label: 'Analytics', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const getAgentInfo = (agent: string) => {
  return AGENT_CONFIG[agent] || { label: agent, color: 'text-gray-700', bgColor: 'bg-gray-100' };
};

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
  const [previousAgent, setPreviousAgent] = useState<string>('triage');
  
  const { messages, isLoading, currentAgent, sessionId, sendMessage, clearMessages } = useMultiAgentChat({
    companyId,
    onAgentChange: (agent) => {
      console.log(`Agent changed from ${previousAgent} to: ${agent}`);
      setPreviousAgent(currentAgent);
    }
  });
  
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current && messages.length > 0) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Fetch company details including review links
  const { data: company } = useQuery({
    queryKey: ['company-details', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url, primary_color, secondary_color, review_google_url, review_facebook_url, review_yelp_url')
        .eq('id', companyId)
        .single();
      return data as (Company & { review_google_url?: string; review_facebook_url?: string; review_yelp_url?: string }) | null;
    },
    enabled: !!companyId,
  });

  // Build review links from company data
  const reviewLinks = React.useMemo(() => {
    const links: { platform: string; url: string }[] = [];
    if (company?.review_google_url) links.push({ platform: 'Google', url: company.review_google_url });
    if (company?.review_facebook_url) links.push({ platform: 'Facebook', url: company.review_facebook_url });
    if (company?.review_yelp_url) links.push({ platform: 'Yelp', url: company.review_yelp_url });
    return links;
  }, [company]);

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
        .select('twilio_phone_number, elevenlabs_api_key, tts_provider, openai_api_key, google_tts_api_key, elevenlabs_voice_id, openai_tts_voice, google_tts_voice')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Get TTS provider info dynamically
  const getTTSProviderInfo = () => {
    const provider = integrations?.tts_provider || 'elevenlabs';
    const providerConfig: Record<string, { 
      name: string; 
      isConfigured: boolean; 
      icon: typeof Volume2 | typeof Bot;
      voiceName: string;
      costInfo: string;
    }> = {
      elevenlabs: {
        name: 'ElevenLabs',
        isConfigured: !!integrations?.elevenlabs_api_key,
        icon: Volume2,
        voiceName: integrations?.elevenlabs_voice_id || 'Default voice',
        costInfo: '~$0.30 per 1K chars'
      },
      openai: {
        name: 'OpenAI TTS',
        isConfigured: !!integrations?.openai_api_key,
        icon: Bot,
        voiceName: integrations?.openai_tts_voice || 'alloy',
        costInfo: '$0.015 per 1K chars (tts-1)'
      },
      google: {
        name: 'Google TTS',
        isConfigured: !!integrations?.google_tts_api_key,
        icon: Volume2,
        voiceName: integrations?.google_tts_voice || 'en-US-Neural2-D',
        costInfo: '$4-16 per 1M chars'
      }
    };
    return providerConfig[provider] || providerConfig.elevenlabs;
  };

  const ttsInfo = getTTSProviderInfo();
  const hasVoice = !!(integrations?.twilio_phone_number && ttsInfo.isConfigured);
  const hasVoiceChat = ttsInfo.isConfigured;
  const twilioPhone = integrations?.twilio_phone_number;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = (action: string, actionId?: string) => {
    // Show feedback form directly instead of sending a message
    if (actionId === 'feedback') {
      setShowFeedbackForm(true);
      setActiveTab('chat');
      return;
    }
    // Reset feedback form for all other actions
    setShowFeedbackForm(false);
    // Navigate to booking form for schedule action
    if (actionId === 'schedule') {
      setActiveTab('book');
      return;
    }
    // Navigate to hours tab for business hours action
    if (actionId === 'hours') {
      setActiveTab('hours');
      return;
    }
    // Navigate to services tab for view services action
    if (actionId === 'services') {
      setActiveTab('services');
      return;
    }
    // Navigate to emergency tab for emergency action
    if (actionId === 'emergency') {
      setActiveTab('emergency');
      return;
    }
    setInput(action);
    setActiveTab('chat');
  };

  const handleFeedbackSubmit = async (feedback: { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; note: string; customerName: string; customerPhone: string; serviceDate?: Date }) => {
    setShowFeedbackForm(false);
    const feedbackMessage = `I'd like to leave feedback. My name is ${feedback.customerName}${feedback.customerPhone ? ` and my phone number is ${feedback.customerPhone}` : ''}${feedback.serviceDate ? ` for my appointment on ${feedback.serviceDate.toLocaleDateString()}` : ''}. My rating is ${feedback.rating} stars and my experience was ${feedback.sentiment}.${feedback.note ? ` Additional comments: ${feedback.note}` : ''}`;
    await sendMessage(feedbackMessage);
  };

  // Filter out raw tool code from message content
  const cleanMessageContent = (content: string): string => {
    // Remove raw tool call artifacts like "getType: 'tool_code'" etc.
    if (content.includes("getType:") || content.includes("tool_code") || content.includes("args: {")) {
      // Try to extract just the meaningful text after the tool code
      const cleanedLines = content.split('\n').filter(line => 
        !line.includes("getType:") && 
        !line.includes("tool_code") && 
        !line.includes("args: {") &&
        !line.includes("}>")
      );
      return cleanedLines.join('\n').trim() || content;
    }
    return content;
  };

  const handleServiceClick = (service: Service) => {
    handleQuickAction(`Tell me about ${service.name}`);
  };

  const handleBookingSubmit = async (booking: BookingData) => {
    const serviceNames = services
      ?.filter(s => booking.selectedServices.includes(s.id))
      .map(s => s.name)
      .join(', ') || 'service';
    
    const formattedDate = format(booking.date, 'MMMM d, yyyy');
    const [hours, minutes] = booking.time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const formattedTime = `${displayHour}:${minutes} ${period}`;
    
    const bookingMessage = `I'd like to book an appointment. My name is ${booking.customerName}, my phone number is ${booking.customerPhone}, and I need service at ${booking.customerAddress}. I'm interested in: ${serviceNames}. I'd like to schedule for ${formattedDate} at ${formattedTime}.`;
    
    setActiveTab('chat');
    await sendMessage(bookingMessage);
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
    <Card className="h-[700px] flex flex-col overflow-hidden border-2">
      {/* Header */}
      <div className="shrink-0 gradient-primary p-4 text-white">
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
            {hasVoiceChat && (
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
        <TabsList className="shrink-0 w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="chat" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 shrink-0"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="services"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 shrink-0"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Services
          </TabsTrigger>
          <TabsTrigger 
            value="book"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 shrink-0"
          >
            <CalendarPlus className="h-4 w-4 mr-1.5" />
            Book
          </TabsTrigger>
          <TabsTrigger 
            value="hours"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 shrink-0"
          >
            <Clock className="h-4 w-4 mr-1.5" />
            Hours
          </TabsTrigger>
          <TabsTrigger 
            value="emergency"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent px-3 py-3 shrink-0"
          >
            <AlertTriangle className="h-4 w-4 mr-1.5 text-destructive" />
            Emergency
          </TabsTrigger>
          {hasVoiceChat && (
            <TabsTrigger 
              value="voice"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 shrink-0"
            >
              <Mic className="h-4 w-4 mr-1.5" />
              Voice
            </TabsTrigger>
          )}
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0 data-[state=inactive]:hidden">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && !showFeedbackForm && (
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Hi there! 👋</h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    I'm your virtual assistant at {company?.name || 'this business'}. How can I help you today?
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 max-w-sm mx-auto">
                    {QUICK_ACTIONS.map((action) => (
                      <Button 
                        key={action.id}
                        variant={action.variant || 'outline'} 
                        size="sm"
                        className={cn(
                          "justify-start gap-2",
                          action.variant === 'destructive' && "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                        )}
                        onClick={() => handleQuickAction(action.message, action.id)}
                      >
                        <action.icon className="h-4 w-4" />
                        <span className="truncate">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Form */}
              {showFeedbackForm && (
                <FeedbackForm
                  onSubmit={handleFeedbackSubmit}
                  isLoading={isLoading}
                  reviewLinks={reviewLinks}
                />
              )}
              
              {messages.map((message, index) => {
                const agentInfo = message.agent ? getAgentInfo(message.agent) : null;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showHandoffIndicator = message.role === 'assistant' && 
                  prevMessage?.role === 'assistant' && 
                  message.agent && 
                  prevMessage?.agent && 
                  message.agent !== prevMessage.agent;

                return (
                  <React.Fragment key={index}>
                    {/* Handoff indicator */}
                    {showHandoffIndicator && (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                        <div className="h-px flex-1 bg-border" />
                        <span className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Transferred to {agentInfo?.label} Agent
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    
                    <div
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
                      <div className="flex-1">
                        {/* Agent badge for assistant messages */}
                        {message.role === 'assistant' && agentInfo && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs mb-1", agentInfo.color, agentInfo.bgColor)}
                          >
                            {agentInfo.label}
                          </Badge>
                        )}
                        <div className="whitespace-pre-wrap text-sm">{cleanMessageContent(message.content)}</div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                  <div className="flex-1 text-muted-foreground text-sm">
                    <Badge variant="outline" className={cn("text-xs mb-1", getAgentInfo(currentAgent).color, getAgentInfo(currentAgent).bgColor)}>
                      {getAgentInfo(currentAgent).label}
                    </Badge>
                    <div>Thinking...</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 flex gap-2 p-4 border-t">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => { clearMessages(); setShowFeedbackForm(false); }}
              className="shrink-0"
            >
              <Home className="h-4 w-4" />
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
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="h-full overflow-y-auto m-0 p-0 data-[state=inactive]:hidden">
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

            <Button className="w-full mt-4" onClick={() => setActiveTab('book')}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule an Appointment
            </Button>
          </div>
        </TabsContent>

        {/* Book Tab */}
        <TabsContent value="book" className="h-full overflow-y-auto m-0 p-4 data-[state=inactive]:hidden">
          <BookingForm
            services={services || []}
            onSubmit={handleBookingSubmit}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="h-full overflow-y-auto m-0 p-4 data-[state=inactive]:hidden">
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

          <Button className="w-full mt-6" onClick={() => setActiveTab('book')}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule an Appointment
          </Button>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="h-full overflow-y-auto m-0 p-4 data-[state=inactive]:hidden">
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg">Emergency Contact</h3>
              <p className="text-muted-foreground mt-1">
                For urgent situations, please contact us directly
              </p>
            </div>

            <div className="space-y-4">
              {integrations?.twilio_phone_number ? (
                <a 
                  href={`tel:${integrations.twilio_phone_number}`}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Call Now</p>
                    <p className="text-lg text-primary">{integrations.twilio_phone_number}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Phone className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Phone Not Configured</p>
                    <p className="text-sm text-muted-foreground">Contact admin to set up phone service</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{company?.name || 'Company'}</p>
                  <p className="text-sm text-muted-foreground">We're here to help</p>
                </div>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Emergency Instructions
              </h4>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Call us directly for immediate assistance</li>
                <li>• Describe your emergency situation clearly</li>
                <li>• Have your address ready for dispatch</li>
                <li>• We'll dispatch a technician as soon as possible</li>
              </ul>
            </div>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                if (integrations?.twilio_phone_number) {
                  window.location.href = `tel:${integrations.twilio_phone_number}`;
                }
              }}
              disabled={!integrations?.twilio_phone_number}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Emergency Line
            </Button>
          </div>
        </TabsContent>

        {/* Voice Tab */}
        {hasVoiceChat && companyId && (
          <TabsContent value="voice" className="h-full overflow-y-auto m-0 p-4 data-[state=inactive]:hidden">
            <div className="h-full flex flex-col items-center justify-center">
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
