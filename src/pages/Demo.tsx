import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Send, User, Loader2, Phone, Calendar, 
  Clock, Sparkles, Building2, ArrowLeft, Mic,
  AlertTriangle, DollarSign, MapPin, Star, ThumbsUp, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  { id: 'schedule', label: 'Request Appointment', icon: Calendar, message: "I'd like to request an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: DollarSign, message: "I need a quote for your services" },
  { id: 'hours', label: 'Business Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'View Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track Appointment', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'feedback', label: 'Leave Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
  { id: 'review', label: 'Leave Review', icon: ThumbsUp, message: "I'd like to leave a review for my recent service" },
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Demo Banner */}
      <div className="gradient-primary text-primary-foreground py-2 px-4 sm:py-3 sm:px-6">
        <div className="container max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Live Demo</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="secondary" 
              size="sm"
              className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
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
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Try Our AI Agent</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Experience how our AI handles appointments, quotes, and customer inquiries
          </p>
        </div>

        <Card className="h-[calc(100vh-180px)] sm:h-[650px] min-h-[400px] max-h-[700px] flex flex-col overflow-hidden border-2">
          {/* Header */}
          <div className="shrink-0 gradient-primary p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0">
                  <img src={logo} alt="AI Bot Company" className="h-5 w-5 sm:h-7 sm:w-7 object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm sm:text-base truncate">AI Bot Company</h2>
                  <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-white/80">
                    <span className="hidden sm:inline">Virtual Assistant</span>
                    <span className="hidden sm:inline">•</span>
                    <Badge className={cn('text-[10px] px-1.5 py-0', agentInfo.bgColor, agentInfo.color)}>
                      {agentInfo.label} Agent
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <Button size="sm" variant="secondary" className="h-7 sm:h-8 text-xs sm:text-sm" disabled>
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Call
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="shrink-0 w-full justify-start rounded-none border-b bg-muted/30 p-0 h-auto flex-nowrap overflow-hidden">
              <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm">
                Chat
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm">
                Services
              </TabsTrigger>
              <TabsTrigger value="hours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm">
                Hours
              </TabsTrigger>
              <TabsTrigger value="book" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm">
                Book
              </TabsTrigger>
              <TabsTrigger value="voice" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm">
                <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Voice
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0 p-0 data-[state=inactive]:hidden">
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !showFeedbackForm && !showReviewForm && !showQuoteForm && !showTrackForm && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Welcome to our Demo!</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                      Test our AI-powered assistant. Try scheduling an appointment, getting a quote, or asking about our services.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto">
                      {QUICK_ACTIONS.map((action) => (
                        <Button
                          key={action.id}
                          variant={action.variant || 'outline'}
                          size="sm"
                          className="text-xs h-auto py-2 flex-col gap-1"
                          onClick={() => handleQuickAction(action.message, action.id)}
                        >
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
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

                {!showFeedbackForm && !showReviewForm && !showQuoteForm && !showTrackForm && messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.isHandoff && message.agent && (
                        <Badge className={cn('text-[10px] mb-1', getAgentInfo(message.agent).bgColor, getAgentInfo(message.agent).color)}>
                          {getAgentInfo(message.agent).label} Agent
                        </Badge>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Bar */}
              {messages.length > 0 && !showFeedbackForm && !showReviewForm && !showQuoteForm && !showTrackForm && (
                <div className="shrink-0 border-t p-2 bg-muted/30">
                  <div className="flex gap-1 overflow-x-auto">
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.variant || 'ghost'}
                        size="sm"
                        className="text-xs shrink-0"
                        onClick={() => handleQuickAction(action.message, action.id)}
                      >
                        <action.icon className="h-3 w-3 mr-1" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="shrink-0 p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => { 
                      setMessages([]); 
                      setShowFeedbackForm(false); 
                      setShowReviewForm(false); 
                      setShowQuoteForm(false); 
                      setShowTrackForm(false);
                      setCurrentAgent('triage');
                    }}
                    className="shrink-0"
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
              <div>
                <h3 className="font-semibold mb-4">Our Services</h3>
                {services && services.length > 0 ? (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setActiveTab('chat');
                          sendMessage(`Tell me about ${service.name}`);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {service.price && (
                              <span className="font-semibold">${service.price}</span>
                            )}
                            {service.duration_minutes && (
                              <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No services configured for demo</p>
                )}
              </div>
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value="hours" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
              <div>
                <h3 className="font-semibold mb-4">Business Hours</h3>
                <div className="p-3 rounded-lg bg-primary/10 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Today: {getTodayHours()}</span>
                  </div>
                </div>
                {businessHours && businessHours.length > 0 ? (
                  <div className="space-y-2">
                    {DAYS.map((day, index) => {
                      const hours = businessHours.find(h => h.day_of_week === index);
                      const isToday = new Date().getDay() === index;
                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex justify-between items-center py-2 px-3 rounded-lg',
                            isToday && 'bg-primary/5 font-medium'
                          )}
                        >
                          <span>{day}</span>
                          <span className="text-muted-foreground">
                            {hours?.is_closed
                              ? 'Closed'
                              : `${formatTime(hours?.open_time)} - ${formatTime(hours?.close_time)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Hours not configured for demo</p>
                )}
              </div>
            </TabsContent>

            {/* Book Tab */}
            <TabsContent value="book" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
              <div>
                <BookingForm
                  services={services || []}
                  onSubmit={handleBookingSubmit}
                />
              </div>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-lg mb-2">Voice AI Assistant</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Talk directly with our AI assistant using your microphone. 
                    Click the button below to start a voice conversation.
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
            </TabsContent>
          </Tabs>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Like what you see? Get your own AI agent for your business.
          </p>
          <Button 
            size="lg" 
            className="gradient-primary shadow-glow"
            onClick={() => navigate('/auth?mode=company')}
          >
            <Building2 className="h-5 w-5 mr-2" />
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}