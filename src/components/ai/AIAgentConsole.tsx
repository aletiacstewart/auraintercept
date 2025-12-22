import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Clock, MessageSquare, Sparkles, ChevronRight,
  AlertTriangle, DollarSign, MapPin, Star, ThumbsUp, Mic, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgentStyle } from '@/lib/agentStyles';
import { GlassHeader } from './chat/GlassHeader';
import { ChatBubble } from './chat/ChatBubble';
import { FloatingInput } from './chat/FloatingInput';
import { WelcomeScreen } from './chat/WelcomeScreen';
import { QuickActionBar } from './chat/QuickActionGrid';
import { MobileTabNav } from './chat/MobileTabNav';
import { VoiceChat } from './VoiceChat';
import { SMSChat } from './SMSChat';
import { FeedbackForm } from './FeedbackForm';
import { ReviewForm } from './ReviewForm';
import { BookingForm, BookingData } from './BookingForm';
import { QuoteForm, QuoteData } from './QuoteForm';
import { TrackAppointmentForm, TrackingData } from './TrackAppointmentForm';
import { BillingLookupForm } from '@/components/billing/forms/BillingLookupForm';
import { format } from 'date-fns';

// Customer Engagement agents definition
const CUSTOMER_ENGAGEMENT_AGENTS = [
  { type: 'triage', name: 'Triage Agent', description: 'Routes customers to the right specialist' },
  { type: 'booking', name: 'Booking Agent', description: 'Handles appointment scheduling' },
  { type: 'followup', name: 'Follow-up Agent', description: 'Post-service engagement' },
  { type: 'review', name: 'Review Agent', description: 'Collects customer reviews' },
];

// Quick actions matching customer-facing widget/public chat features
const QUICK_ACTIONS = [
  { id: 'schedule', label: 'Book Appointment', icon: Calendar, message: "I'd like to request an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: DollarSign, message: "I need a quote for your services" },
  { id: 'hours', label: 'Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'billing', label: 'Billing', icon: DollarSign, message: "I need to look up my billing information" },
  { id: 'feedback', label: 'Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
  { id: 'review', label: 'Review', icon: ThumbsUp, message: "I'd like to leave a review for my recent service" },
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

interface AIAgentConsoleProps {
  companyId?: string;
}

export const AIAgentConsole: React.FC<AIAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId } = useAuth();
  const companyId = propCompanyId || authCompanyId;
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current && messages.length > 0) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Fetch Customer Engagement agent configs
  const { data: agentConfigs } = useQuery({
    queryKey: ['customer-engagement-agents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('ai_agent_configs')
        .select('agent_type, is_enabled')
        .eq('company_id', companyId)
        .in('agent_type', CUSTOMER_ENGAGEMENT_AGENTS.map(a => a.type));
      return data || [];
    },
    enabled: !!companyId,
  });

  // Merge agent configs with defaults
  const customerEngagementAgents = CUSTOMER_ENGAGEMENT_AGENTS.map(agent => {
    const config = agentConfigs?.find(c => c.agent_type === agent.type);
    return {
      ...agent,
      isEnabled: config?.is_enabled ?? true,
    };
  });

  const enabledAgentsCount = customerEngagementAgents.filter(a => a.isEnabled).length;

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
        .select('twilio_phone_number, twilio_account_sid, twilio_auth_token, elevenlabs_api_key, tts_provider, openai_api_key, google_tts_api_key, elevenlabs_voice_id, openai_tts_voice, google_tts_voice')
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
      voiceName: string;
    }> = {
      elevenlabs: {
        name: 'ElevenLabs',
        isConfigured: !!integrations?.elevenlabs_api_key,
        voiceName: integrations?.elevenlabs_voice_id || 'Default voice',
      },
      openai: {
        name: 'OpenAI TTS',
        isConfigured: !!integrations?.openai_api_key,
        voiceName: integrations?.openai_tts_voice || 'alloy',
      },
      google: {
        name: 'Google TTS',
        isConfigured: !!integrations?.google_tts_api_key,
        voiceName: integrations?.google_tts_voice || 'en-US-Neural2-D',
      }
    };
    return providerConfig[provider] || providerConfig.elevenlabs;
  };

  const ttsInfo = getTTSProviderInfo();
  const hasVoiceChat = ttsInfo.isConfigured;
  const hasSMS = !!(integrations?.twilio_phone_number && integrations?.twilio_account_sid && integrations?.twilio_auth_token);
  const twilioPhone = integrations?.twilio_phone_number;

  // Build tabs dynamically - only Home tab
  const TABS = [
    { id: 'chat', label: 'Home', icon: MessageSquare },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = async (action: string, actionId?: string) => {
    if (actionId === 'feedback') {
      setShowFeedbackForm(true);
      setShowReviewForm(false);
      setShowQuoteForm(false);
      setShowTrackForm(false);
      setShowBillingForm(false);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'review') {
      setShowReviewForm(true);
      setShowFeedbackForm(false);
      setShowQuoteForm(false);
      setShowTrackForm(false);
      setShowBillingForm(false);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'quote') {
      setShowQuoteForm(true);
      setShowFeedbackForm(false);
      setShowReviewForm(false);
      setShowTrackForm(false);
      setShowBillingForm(false);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'track') {
      setShowTrackForm(true);
      setShowFeedbackForm(false);
      setShowReviewForm(false);
      setShowQuoteForm(false);
      setShowBillingForm(false);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'billing') {
      setShowBillingForm(true);
      setShowFeedbackForm(false);
      setShowReviewForm(false);
      setShowQuoteForm(false);
      setShowTrackForm(false);
      setActiveTab('chat');
      return;
    }
    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
    setShowBillingForm(false);
    if (actionId === 'schedule') {
      setActiveTab('book');
      return;
    }
    if (actionId === 'hours') {
      setActiveTab('hours');
      return;
    }
    if (actionId === 'services') {
      setActiveTab('services');
      return;
    }
    if (actionId === 'emergency') {
      setActiveTab('emergency');
      return;
    }
    setActiveTab('chat');
    await sendMessage(action);
  };

  const handleHome = () => {
    clearMessages();
    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
    setShowBillingForm(false);
    setActiveTab('chat');
  };

  const handleFeedbackSubmit = async (feedback: { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; note: string; customerName: string; customerPhone: string; serviceDate?: Date }) => {
    setShowFeedbackForm(false);
    const feedbackMessage = `I'd like to leave feedback. My name is ${feedback.customerName}${feedback.customerPhone ? ` and my phone number is ${feedback.customerPhone}` : ''}${feedback.serviceDate ? ` for my appointment on ${feedback.serviceDate.toLocaleDateString()}` : ''}. My rating is ${feedback.rating} stars and my experience was ${feedback.sentiment}.${feedback.note ? ` Additional comments: ${feedback.note}` : ''}`;
    await sendMessage(feedbackMessage);
  };

  const handleReviewSubmit = async (review: { rating: number; comment: string; customerName: string; customerPhone: string; selectedPlatforms: string[] }) => {
    setShowReviewForm(false);
    const platformsText = review.selectedPlatforms.join(' and ');
    const reviewMessage = `I've submitted a review. My name is ${review.customerName}${review.customerPhone ? ` and my phone number is ${review.customerPhone}` : ''}. I gave ${review.rating} stars and left a review on ${platformsText}.${review.comment ? ` My comment: ${review.comment}` : ''}`;
    await sendMessage(reviewMessage);
  };

  const cleanMessageContent = (content: string): string => {
    if (content.includes("getType:") || content.includes("tool_code") || content.includes("args: {")) {
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

  const handleQuoteSubmit = async (quote: QuoteData) => {
    setShowQuoteForm(false);
    const serviceNames = services
      ?.filter(s => quote.selectedServices.includes(s.id))
      .map(s => s.name)
      .join(', ') || 'service';
    
    const quoteMessage = `I'd like to request a quote. My name is ${quote.customerName}, my phone number is ${quote.customerPhone}${quote.customerEmail ? `, email: ${quote.customerEmail}` : ''}${quote.customerAddress ? `, address: ${quote.customerAddress}` : ''}. I'm interested in: ${serviceNames}.${quote.issueDescription ? ` Issue description: ${quote.issueDescription}` : ''}`;
    
    await sendMessage(quoteMessage);
  };

  const handleTrackSubmit = async (tracking: TrackingData) => {
    setShowTrackForm(false);
    const trackMessage = `I'd like to track my appointment. My name is ${tracking.customerName}${tracking.customerPhone ? `, phone: ${tracking.customerPhone}` : ''}${tracking.customerEmail ? `, email: ${tracking.customerEmail}` : ''}.`;
    await sendMessage(trackMessage);
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

  const agentInfo = getAgentStyle(currentAgent);
  const isShowingForm = showFeedbackForm || showReviewForm || showQuoteForm || showTrackForm || showBillingForm;

  return (
    <Card className="h-[calc(100vh-200px)] sm:h-[600px] flex flex-col overflow-hidden border-0 shadow-xl">
      {/* Header */}
      <GlassHeader
        companyName={company?.name || 'AI Assistant'}
        logoUrl={company?.logo_url}
        agentLabel={agentInfo.label}
        agentColor={agentInfo.color}
        agentBgColor={agentInfo.bgColor}
        showPhone={!!twilioPhone}
        showVoice={hasVoiceChat}
        onPhoneClick={() => window.open(`tel:${twilioPhone}`, '_self')}
        onVoiceClick={() => setActiveTab('voice')}
        useDefaultLogo={true}
      />

      {/* Tab Navigation */}
      <MobileTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHomeClick={handleHome}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && !isShowingForm && (
                <WelcomeScreen
                  companyName={company?.name}
                  title="Welcome!"
                  subtitle="I'm your AI assistant. How can I help you today?"
                  actions={QUICK_ACTIONS}
                  onAction={handleQuickAction}
                />
              )}

              {showFeedbackForm && (
                <FeedbackForm
                  onSubmit={handleFeedbackSubmit}
                  onCancel={handleHome}
                  isLoading={isLoading}
                  reviewLinks={reviewLinks}
                />
              )}

              {showReviewForm && (
                <ReviewForm
                  onSubmit={handleReviewSubmit}
                  onCancel={handleHome}
                  isLoading={isLoading}
                  reviewLinks={reviewLinks}
                />
              )}

              {showQuoteForm && (
                <QuoteForm
                  services={services || []}
                  onSubmit={handleQuoteSubmit}
                  onCancel={handleHome}
                />
              )}

              {showTrackForm && (
                <TrackAppointmentForm
                  onSubmit={handleTrackSubmit}
                  onCancel={handleHome}
                />
              )}

              {showBillingForm && companyId && (
                <BillingLookupForm
                  companyId={companyId}
                  onCancel={handleHome}
                />
              )}

              {!isShowingForm && messages.map((message, index) => {
                const msgAgentInfo = message.agent ? getAgentStyle(message.agent) : null;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showHandoffIndicator = message.role === 'assistant' &&
                  prevMessage?.role === 'assistant' && 
                  message.agent && 
                  prevMessage?.agent && 
                  message.agent !== prevMessage.agent;

                return (
                  <React.Fragment key={index}>
                    {showHandoffIndicator && (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground animate-fade-in">
                        <div className="h-px flex-1 bg-border" />
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full glass-panel">
                          → Transferred to {msgAgentInfo?.label}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    
                    <ChatBubble
                      role={message.role}
                      content={cleanMessageContent(message.content)}
                      agentLabel={msgAgentInfo?.label}
                      agentColor={msgAgentInfo?.color}
                      agentBgColor={msgAgentInfo?.bgColor}
                      isHandoff={showHandoffIndicator}
                    />
                  </React.Fragment>
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

            {/* Quick Actions Bar */}
            {messages.length > 0 && !isShowingForm && (
              <QuickActionBar
                actions={QUICK_ACTIONS}
                onAction={handleQuickAction}
              />
            )}

            {/* Input */}
            <FloatingInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              onHome={handleHome}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold text-lg mb-4 gradient-text">Our Services</h3>
            {services?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No services configured yet
              </p>
            ) : (
              <div className="space-y-3">
                {services?.map((service, index) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="w-full text-left p-4 rounded-xl glass-panel hover:neon-border transition-all duration-300 group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
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
                ))}
              </div>
            )}

            <Button 
              className="w-full mt-4 glass-primary text-white glow-primary" 
              onClick={() => setActiveTab('book')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule an Appointment
            </Button>
          </div>
        )}

        {/* Book Tab */}
        {activeTab === 'book' && (
          <div className="flex-1 overflow-y-auto p-4">
            <BookingForm
              services={services || []}
              onSubmit={handleBookingSubmit}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold text-lg mb-4 gradient-text">Business Hours</h3>
            <div className="glass-primary rounded-xl p-4 mb-4 glow-primary">
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Today's Hours</span>
              </div>
              <p className="text-lg font-semibold mt-1 text-white">{getTodayHours()}</p>
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
                      "flex justify-between p-3 rounded-xl transition-all animate-fade-in",
                      isToday ? "glass-panel neon-border" : "glass-panel"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className={cn("font-medium", isToday && "text-primary")}>
                      {day}
                      {isToday && <Badge variant="outline" className="ml-2 text-xs">Today</Badge>}
                    </span>
                    <span className="text-muted-foreground">
                      {!hours || hours.is_closed
                        ? 'Closed'
                        : `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-bold text-lg mb-2">Emergency Service</h3>
              <p className="text-muted-foreground mb-6">
                For urgent issues that can't wait, contact us immediately.
              </p>
              
              {twilioPhone ? (
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="mb-4 glow-accent"
                  onClick={() => window.open(`tel:${twilioPhone}`, '_self')}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now: {twilioPhone}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Phone service not configured
                </p>
              )}

              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveTab('chat');
                  sendMessage("I have an urgent emergency situation that needs immediate attention.");
                }}
              >
                Chat About Emergency
              </Button>
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && hasVoiceChat && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <h3 className="font-semibold text-lg mb-2 gradient-text">Voice AI Assistant</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Talk directly with our AI assistant using your microphone.
              </p>
            </div>
            <VoiceChat
              companyId={companyId || ''}
              companyName={company?.name || 'Company'}
              onTranscript={(role, text) => {
                console.log(`[${role}]: ${text}`);
              }}
            />
          </div>
        )}

        {/* SMS Tab */}
        {activeTab === 'sms' && hasSMS && (
          <div className="flex-1 overflow-y-auto p-4">
            <SMSChat companyId={companyId || ''} companyName={company?.name || 'Company'} />
          </div>
        )}
      </div>
    </Card>
  );
};
