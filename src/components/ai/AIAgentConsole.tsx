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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, Send, User, Loader2, Home, Phone, Mic, Calendar, 
  Clock, MessageSquare, Sparkles, ChevronRight, Building2, Volume2,
  AlertTriangle, DollarSign, MapPin, Star, CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceChat } from './VoiceChat';
import { FeedbackForm } from './FeedbackForm';
import { BookingForm, BookingData } from './BookingForm';
import { format } from 'date-fns';

// Quick actions matching customer-facing widget/public chat features
const QUICK_ACTIONS = [
  { id: 'schedule', label: 'Book Appointment', icon: Calendar, message: "I'd like to schedule an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: DollarSign, message: "I need a quote for your services" },
  { id: 'hours', label: 'Business Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'View Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track Appointment', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'feedback', label: 'Leave Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
];

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
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleQuickAction = (action: string, actionId?: string) => {
    // Show feedback form directly instead of sending a message
    if (actionId === 'feedback') {
      setShowFeedbackForm(true);
      setActiveTab('chat');
      return;
    }
    // Navigate to booking form for schedule action
    if (actionId === 'schedule') {
      setActiveTab('book');
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
    <Card className="flex flex-col h-[700px] min-h-0 overflow-hidden border-2">
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
              <div className="flex items-center gap-2">
                <p className="text-xs text-white/80">Virtual Assistant</p>
                {ttsInfo && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs py-0 h-5 cursor-help",
                            ttsInfo.isConfigured 
                              ? "bg-white/20 text-white border-white/30" 
                              : "bg-red-500/20 text-red-200 border-red-500/30"
                          )}
                        >
                          <ttsInfo.icon className="h-3 w-3 mr-1" />
                          {ttsInfo.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px]">
                        <div className="space-y-1">
                          <p className="font-medium">{ttsInfo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Voice: {ttsInfo.voiceName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cost: {ttsInfo.costInfo}
                          </p>
                          {!ttsInfo.isConfigured && (
                            <p className="text-xs text-destructive">
                              Not configured
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto flex-nowrap">
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
        <TabsContent value="chat" className="flex-1 min-h-0 flex flex-col overflow-hidden m-0 p-0">
          <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
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
                    <div className="flex-1 whitespace-pre-wrap text-sm">{cleanMessageContent(message.content)}</div>
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
          </CardContent>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="flex-1 min-h-0 relative m-0">
          <div className="absolute inset-0 overflow-y-auto">
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
          </div>
        </TabsContent>

        {/* Book Tab */}
        <TabsContent value="book" className="flex-1 min-h-0 relative m-0">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="p-4">
              <BookingForm
                services={services || []}
                onSubmit={handleBookingSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="flex-1 min-h-0 relative m-0">
          <div className="absolute inset-0 overflow-y-auto">
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

              <Button className="w-full mt-6" onClick={() => setActiveTab('book')}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule an Appointment
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Voice Tab */}
        {hasVoiceChat && companyId && (
          <TabsContent value="voice" className="flex-1 min-h-0 relative m-0">
            <div className="absolute inset-0 overflow-y-auto">
              <div className="min-h-full flex flex-col items-center justify-center p-4">
                <VoiceChat
                  companyId={companyId}
                  companyName={company?.name || 'AI Assistant'}
                  onTranscript={(role, text) => {
                    console.log(`Voice transcript [${role}]:`, text);
                  }}
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
};
