import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Calendar, Clock, Sparkles, Building2, ArrowLeft, Mic, ChevronRight,
  AlertTriangle, DollarSign, MapPin, Star, ThumbsUp, Zap, MessageSquare, Home,
  Truck, Megaphone, BarChart3, Users, Navigation, CheckCircle, Phone,
  Receipt, FileText, Bell, Tag, Gift, TrendingUp, UserPlus, Target, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgentStyle } from '@/lib/agentStyles';
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
import aiBotBannerLogo from '@/assets/ai-bot-company-banner.png';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Demo company ID - AI Bot Company
const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

// Console types for the demo
const CONSOLE_TYPES = [
  { id: 'booking', label: 'Customer & Booking', icon: Calendar, color: 'from-cyan-500 to-blue-500' },
  { id: 'fieldops', label: 'Field Operations', icon: Truck, color: 'from-green-500 to-emerald-500' },
  { id: 'billing', label: 'Billing & Invoicing', icon: DollarSign, color: 'from-purple-500 to-violet-500' },
  { id: 'marketing', label: 'Marketing & Sales', icon: Megaphone, color: 'from-orange-500 to-red-500' },
  { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3, color: 'from-indigo-500 to-blue-600' },
];

// Quick actions for each console type
const BOOKING_QUICK_ACTIONS = [
  { id: 'schedule', label: 'Book Appointment', icon: Calendar, message: "I'd like to request an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: FileText, message: "I need a quote for your services" },
  { id: 'hours', label: 'Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'feedback', label: 'Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
  { id: 'review', label: 'Review', icon: ThumbsUp, message: "I'd like to leave a review for my recent service" },
];

const FIELDOPS_QUICK_ACTIONS = [
  { id: 'accept', label: 'Accept Job', icon: CheckCircle, message: "I want to accept a job" },
  { id: 'directions', label: 'Get Directions', icon: Navigation, message: "Get directions to my next job" },
  { id: 'enroute', label: 'En Route', icon: Truck, message: "Mark myself as en route" },
  { id: 'eta', label: 'Update ETA', icon: Clock, message: "Update my ETA" },
  { id: 'arrived', label: 'Arrived', icon: MapPin, message: "Mark myself as arrived" },
  { id: 'complete', label: 'Complete Job', icon: CheckCircle, message: "Complete the current job", variant: 'destructive' as const },
];

const BILLING_QUICK_ACTIONS = [
  { id: 'create_invoice', label: 'Create Invoice', icon: Receipt, message: "I need to create an invoice for a customer" },
  { id: 'send_reminder', label: 'Send Reminder', icon: Bell, message: "Send payment reminder to customers with overdue invoices" },
  { id: 'create_quote', label: 'Create Quote', icon: FileText, message: "I need to create a quote for a customer" },
  { id: 'revenue_report', label: 'Revenue Report', icon: BarChart3, message: "Show me a revenue report for this month" },
  { id: 'overdue', label: 'Overdue Invoices', icon: AlertTriangle, message: "Show me all overdue invoices", variant: 'destructive' as const },
];

const MARKETING_QUICK_ACTIONS = [
  { id: 'campaign', label: 'Create Campaign', icon: Megaphone, message: "I need to create a new marketing campaign" },
  { id: 'promo', label: 'Generate Promo', icon: Tag, message: "I need to generate a promotional code" },
  { id: 'referral', label: 'Referral Program', icon: Gift, message: "I need to set up a customer referral" },
  { id: 'winback', label: 'Win-Back', icon: TrendingUp, message: "I need to create a win-back campaign for inactive customers" },
  { id: 'lead', label: 'New Lead', icon: UserPlus, message: "I need to add a new lead to the system" },
  { id: 'segments', label: 'Customer Segments', icon: Users, message: "Show me customer segments and analytics" },
];

const ANALYTICS_QUICK_ACTIONS = [
  { id: 'performance', label: 'Performance Report', icon: BarChart3, message: "I need a performance report for the business" },
  { id: 'revenue', label: 'Revenue Analysis', icon: DollarSign, message: "Show me detailed revenue analysis" },
  { id: 'customers', label: 'Customer Insights', icon: Users, message: "I need customer insights and behavior analysis" },
  { id: 'forecast', label: 'Trend Forecast', icon: TrendingUp, message: "Show me trend forecasts for the next quarter" },
  { id: 'kpi', label: 'KPI Dashboard', icon: Target, message: "Show KPI dashboard with key metrics" },
  { id: 'export', label: 'Export Report', icon: Download, message: "I need to export a comprehensive report" },
];

// Internal tab config - matching AIAgentConsole exactly
const INTERNAL_TABS = [
  { id: 'chat', label: 'Home', icon: MessageSquare },
];

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
  const [activeConsole, setActiveConsole] = useState('booking');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('triage');
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reset state when console changes
  useEffect(() => {
    setMessages([]);
    setActiveTab('chat');
    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
    setCurrentAgent('triage');
    setInput('');
  }, [activeConsole]);

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

  const getQuickActionsForConsole = () => {
    switch (activeConsole) {
      case 'booking': return BOOKING_QUICK_ACTIONS;
      case 'fieldops': return FIELDOPS_QUICK_ACTIONS;
      case 'billing': return BILLING_QUICK_ACTIONS;
      case 'marketing': return MARKETING_QUICK_ACTIONS;
      case 'analytics': return ANALYTICS_QUICK_ACTIONS;
      default: return BOOKING_QUICK_ACTIONS;
    }
  };

  const getConsoleTitle = () => {
    const console = CONSOLE_TYPES.find(c => c.id === activeConsole);
    return console?.label || 'Customer & Booking';
  };

  const getConsoleDescription = () => {
    switch (activeConsole) {
      case 'booking': return 'Schedule appointments, get quotes, track service status, and leave feedback';
      case 'fieldops': return 'Accept jobs, get directions, update ETA, and complete service calls';
      case 'billing': return 'Create invoices, send reminders, generate quotes, and track payments';
      case 'marketing': return 'Create campaigns, generate promos, manage referrals, and track leads';
      case 'analytics': return 'View performance reports, revenue analysis, forecasts, and KPIs';
      default: return 'Experience AI-powered business automation';
    }
  };

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
          consoleType: activeConsole,
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
    // Handle form displays for booking console
    if (activeConsole === 'booking') {
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
    }

    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
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

  const agentInfo = getAgentStyle(currentAgent);
  const isShowingForm = showFeedbackForm || showReviewForm || showQuoteForm || showTrackForm;
  const currentConsole = CONSOLE_TYPES.find(c => c.id === activeConsole);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <PublicHeader />
      
      {/* Demo Banner */}
      <div className="glass-primary text-primary-foreground py-2 px-4 sm:py-3 sm:px-6">
        <div className="container max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Live Demo - AI Agent Consoles</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
      
      <div className="flex-1">

      <div className="container max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6">
          <img 
            src={aiBotBannerLogo} 
            alt="AI Bot Company" 
            className="h-12 sm:h-14 object-contain mx-auto mb-3"
          />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Experience All 5 AI Agent Consoles</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Switch between console types to see how AI agents handle different business operations
          </p>
        </div>

        {/* Console Type Selector */}
        <Tabs value={activeConsole} onValueChange={setActiveConsole} className="mb-6">
          <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted/50">
            {CONSOLE_TYPES.map((console) => (
              <TabsTrigger
                key={console.id}
                value={console.id}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                )}
              >
                <console.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{console.label}</span>
                <span className="sm:hidden text-[10px] text-center leading-tight">{console.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Console Description Badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge 
            variant="outline" 
            className={cn(
              "px-4 py-1.5 text-sm font-medium",
              `bg-gradient-to-r ${currentConsole?.color} text-white border-0`
            )}
          >
            <currentConsole.icon className="h-4 w-4 mr-2" />
            {getConsoleTitle()}
          </Badge>
        </div>
        <p className="text-center text-muted-foreground text-sm mb-6">{getConsoleDescription()}</p>

        {/* Console Card */}
        <Card className="h-[calc(100vh-340px)] sm:h-[550px] flex flex-col overflow-hidden border-0 shadow-xl">
          {/* Header */}
          <GlassHeader
            companyName="AI Bot Company"
            logoUrl={aiBotBannerLogo}
            agentLabel={agentInfo.label}
            agentColor={agentInfo.color}
            agentBgColor={agentInfo.bgColor}
            showVoice={activeConsole === 'booking'}
            onVoiceClick={() => setActiveTab('voice')}
            rectangleLogo
          />

          {/* Tab Navigation - Only for booking console */}
          {activeConsole === 'booking' && (
            <MobileTabNav
              tabs={INTERNAL_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onHomeClick={handleHome}
            />
          )}

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chat/Home View */}
            {/* Chat Tab - matches AIAgentConsole structure */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && !isShowingForm && (
                    <WelcomeScreen
                      companyName="AI Bot Company"
                      title="Welcome!"
                      subtitle="I'm your AI assistant. How can I help you today?"
                      actions={getQuickActionsForConsole()}
                      onAction={handleQuickAction}
                    />
                  )}

                  {showFeedbackForm && (
                    <FeedbackForm 
                      onSubmit={handleFeedbackSubmit}
                      onCancel={handleHome}
                      isLoading={isLoading}
                      reviewLinks={[]}
                    />
                  )}

                  {showReviewForm && (
                    <ReviewForm 
                      onSubmit={handleReviewSubmit}
                      onCancel={handleHome}
                      isLoading={isLoading}
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
                      onCancel={handleHome}
                    />
                  )}

                  {showTrackForm && (
                    <TrackAppointmentForm 
                      onSubmit={handleTrackSubmit}
                      onCancel={handleHome}
                    />
                  )}

                  {!isShowingForm && messages.map((message, index) => {
                    const msgStyle = message.agent ? getAgentStyle(message.agent) : null;
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
                              → Transferred to {msgStyle?.label}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                        )}
                        
                        <ChatBubble
                          role={message.role}
                          content={message.content}
                          agentLabel={msgStyle?.label}
                          agentColor={msgStyle?.color}
                          agentBgColor={msgStyle?.bgColor}
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
                    actions={getQuickActionsForConsole()}
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
                        onClick={() => {
                          setActiveTab('chat');
                          sendMessage(`Tell me about ${service.name}`);
                        }}
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

            {/* Voice Tab */}
            {activeTab === 'voice' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-lg mb-2 gradient-text">Voice AI Assistant</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Talk directly with our AI assistant using your microphone.
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
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            Ready to automate your business with AI agents?
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button 
              size="lg" 
              className="gradient-primary"
              onClick={() => navigate('/auth?mode=company')}
            >
              <Building2 className="h-5 w-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/customer-auth')}
            >
              <Users className="h-5 w-5 mr-2" />
              Customer Portal
            </Button>
          </div>
        </div>
      </div>
      </div>
      <PublicFooter />
    </div>
  );
}
