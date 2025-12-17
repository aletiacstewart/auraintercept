import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Calendar, Clock, Sparkles, Building2, ArrowLeft, Mic,
  AlertTriangle, DollarSign, MapPin, Star, ThumbsUp, Zap, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassHeader } from '@/components/ai/chat/GlassHeader';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { QuickActionBar } from '@/components/ai/chat/QuickActionGrid';
import { MobileTabNav } from '@/components/ai/chat/MobileTabNav';
import { FeedbackForm } from '@/components/ai/FeedbackForm';
import { ReviewForm } from '@/components/ai/ReviewForm';
import { BookingForm, BookingData } from '@/components/ai/BookingForm';
import { QuoteForm, QuoteData } from '@/components/ai/QuoteForm';
import { TrackAppointmentForm, TrackingData } from '@/components/ai/TrackAppointmentForm';
import { VoiceChat } from '@/components/ai/VoiceChat';
import { format } from 'date-fns';
import logo from '@/assets/logo.png';

// Demo company ID - AI Bot Company
const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

// Quick actions for demo
const QUICK_ACTIONS = [
  { id: 'schedule', label: 'Book Appointment', icon: Calendar, message: "I'd like to request an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: DollarSign, message: "I need a quote for your services" },
  { id: 'hours', label: 'Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'feedback', label: 'Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
  { id: 'review', label: 'Review', icon: ThumbsUp, message: "I'd like to leave a review for my recent service" },
];

// Tab configuration
const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'hours', label: 'Hours', icon: Clock },
  { id: 'book', label: 'Book', icon: Calendar },
  { id: 'voice', label: 'Voice', icon: Mic },
];

// Agent display configuration
const AGENT_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  triage: { label: 'Triage', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  booking: { label: 'Booking', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  dispatch: { label: 'Dispatch', color: 'text-green-700', bgColor: 'bg-green-100' },
  followup: { label: 'Follow-up', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  review: { label: 'Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  quoting: { label: 'Quoting', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const getAgentInfo = (agent: string) => {
  return AGENT_CONFIG[agent] || { label: agent, color: 'text-gray-700', bgColor: 'bg-gray-100' };
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  isHandoff?: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
}

interface BusinessHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Demo() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('triage');
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current && messages.length > 0) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Fetch demo services
  const { data: services } = useQuery({
    queryKey: ['demo-services'],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name, description, duration_minutes, price')
        .eq('company_id', DEMO_COMPANY_ID)
        .eq('is_active', true)
        .order('name');
      return (data || []) as Service[];
    },
  });

  // Fetch demo business hours
  const { data: businessHours } = useQuery({
    queryKey: ['demo-business-hours'],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('company_id', DEMO_COMPANY_ID)
        .order('day_of_week');
      return (data || []) as BusinessHour[];
    },
  });

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          message: messageContent,
          companyId: DEMO_COMPANY_ID,
          conversationHistory: messages,
          currentAgent,
        },
      });

      if (response.error) throw response.error;

      const { reply, nextAgent, isHandoff } = response.data;
      
      if (nextAgent && nextAgent !== currentAgent) {
        setCurrentAgent(nextAgent);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: reply,
        agent: nextAgent || currentAgent,
        isHandoff,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Demo chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. This is a demo - please try again or sign up for full access!",
        agent: currentAgent,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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
      setActiveTab('chat');
      return;
    }
    if (actionId === 'review') {
      setShowReviewForm(true);
      setShowFeedbackForm(false);
      setShowQuoteForm(false);
      setShowTrackForm(false);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'quote') {
      setShowQuoteForm(true);
      setShowFeedbackForm(false);
      setShowReviewForm(false);
      setShowTrackForm(false);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'track') {
      setShowTrackForm(true);
      setShowFeedbackForm(false);
      setShowReviewForm(false);
      setShowQuoteForm(false);
      setActiveTab('chat');
      return;
    }
    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
    
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
      setActiveTab('chat');
      await sendMessage(action);
      return;
    }
    setActiveTab('chat');
    await sendMessage(action);
  };

  const handleHome = () => {
    setMessages([]);
    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
    setCurrentAgent('triage');
    setActiveTab('chat');
  };

  const handleFeedbackSubmit = async (feedback: { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; note: string; customerName: string; customerPhone: string; serviceDate?: Date }) => {
    setShowFeedbackForm(false);
    const feedbackMessage = `I'd like to leave feedback. My name is ${feedback.customerName}. My rating is ${feedback.rating} stars and my experience was ${feedback.sentiment}.${feedback.note ? ` Additional comments: ${feedback.note}` : ''}`;
    await sendMessage(feedbackMessage);
  };

  const handleReviewSubmit = async (review: { rating: number; comment: string; customerName: string; customerPhone: string; selectedPlatforms: string[] }) => {
    setShowReviewForm(false);
    const reviewMessage = `I've submitted a review. My name is ${review.customerName}. I gave ${review.rating} stars.${review.comment ? ` My comment: ${review.comment}` : ''}`;
    await sendMessage(reviewMessage);
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

  const agentInfo = getAgentInfo(currentAgent);
  const isShowingForm = showFeedbackForm || showReviewForm || showQuoteForm || showTrackForm;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Demo Banner */}
      <div className="glass-primary text-primary-foreground py-2 px-4 sm:py-3 sm:px-6">
        <div className="container max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Live Demo</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="secondary" 
              size="sm"
              className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 glass-panel border-white/20"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Back
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => navigate('/auth?mode=company')}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">Try Our AI Agent</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Experience how our AI handles appointments, quotes, and customer inquiries
          </p>
        </div>

        <Card className="h-[calc(100vh-180px)] sm:h-[600px] flex flex-col overflow-hidden border-0 shadow-xl">
          {/* Header */}
          <GlassHeader
            companyName="AI Bot Company"
            logoUrl={logo}
            agentLabel={agentInfo.label}
            agentColor={agentInfo.color}
            agentBgColor={agentInfo.bgColor}
            showVoice
            onVoiceClick={() => setActiveTab('voice')}
          />

          {/* Tab Navigation */}
          <MobileTabNav
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && !isShowingForm && (
                    <WelcomeScreen
                      companyName="AI Bot Company"
                      title="Welcome to our Demo!"
                      subtitle="Test our AI-powered assistant. Try scheduling an appointment, getting a quote, or asking about our services."
                      actions={QUICK_ACTIONS}
                      onAction={handleQuickAction}
                    />
                  )}

                  {showFeedbackForm && (
                    <FeedbackForm 
                      onSubmit={handleFeedbackSubmit}
                      reviewLinks={[]}
                    />
                  )}

                  {showReviewForm && (
                    <ReviewForm 
                      onSubmit={handleReviewSubmit}
                      reviewLinks={[
                        { platform: 'Google', url: 'https://google.com/review' },
                        { platform: 'Facebook', url: 'https://facebook.com/review' },
                      ]}
                    />
                  )}

                  {showQuoteForm && (
                    <QuoteForm 
                      services={services || []}
                      onSubmit={handleQuoteSubmit}
                    />
                  )}

                  {showTrackForm && (
                    <TrackAppointmentForm 
                      onSubmit={handleTrackSubmit}
                    />
                  )}

                  {!isShowingForm && messages.map((message, index) => (
                    <ChatBubble
                      key={index}
                      role={message.role}
                      content={message.content}
                      agentLabel={message.agent ? getAgentInfo(message.agent).label : undefined}
                      agentColor={message.agent ? getAgentInfo(message.agent).color : undefined}
                      agentBgColor={message.agent ? getAgentInfo(message.agent).bgColor : undefined}
                      isHandoff={message.isHandoff}
                    />
                  ))}

                  {isLoading && (
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
              <div className="flex-1 overflow-y-auto p-3">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Our Services
                </h3>
                {services && services.length > 0 ? (
                  <div className="space-y-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        className="w-full text-left p-2.5 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                        onClick={() => {
                          setActiveTab('chat');
                          sendMessage(`Tell me about ${service.name}`);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{service.name}</h4>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            {service.price && (
                              <Badge variant="secondary" className="text-xs">${service.price}</Badge>
                            )}
                            {service.duration_minutes && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{service.duration_minutes} min</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs text-center py-4">No services configured</p>
                )}
              </div>
            )}

            {/* Hours Tab */}
            {activeTab === 'hours' && (
              <div className="flex-1 overflow-y-auto p-3">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Business Hours
                </h3>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 mb-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium text-sm">Today: {getTodayHours()}</span>
                  </div>
                </div>
                {businessHours && businessHours.length > 0 ? (
                  <div className="space-y-1">
                    {DAYS.map((day, index) => {
                      const hours = businessHours.find(h => h.day_of_week === index);
                      const isToday = new Date().getDay() === index;
                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex justify-between items-center py-2 px-3 rounded-lg text-sm',
                            isToday ? 'bg-primary/10 text-primary font-medium' : 'bg-muted/30'
                          )}
                        >
                          <span>{day}</span>
                          <span className="text-xs">
                            {hours?.is_closed
                              ? 'Closed'
                              : hours
                                ? `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}`
                                : 'Not set'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs text-center py-4">Hours not configured</p>
                )}
              </div>
            )}

            {/* Book Tab */}
            {activeTab === 'book' && (
              <div className="flex-1 overflow-y-auto p-3">
                <BookingForm
                  services={services || []}
                  onSubmit={handleBookingSubmit}
                />
              </div>
            )}

            {/* Voice Tab */}
            {activeTab === 'voice' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-sm mb-1">Voice AI Assistant</h3>
                  <p className="text-muted-foreground text-xs">
                    Talk directly with our AI using your microphone.
                  </p>
                </div>
                <VoiceChat
                  companyId={DEMO_COMPANY_ID}
                  companyName="AI Bot Company"
                  onTranscript={(role, text) => {
                    console.log(`[${role}]: ${text}`);
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs mb-2">
            Like what you see? Get your own AI agent for your business.
          </p>
          <Button 
            size="sm" 
            className="bg-primary text-primary-foreground"
            onClick={() => navigate('/auth?mode=company')}
          >
            <Building2 className="h-4 w-4 mr-1" />
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
