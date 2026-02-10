import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Clock, MessageSquare, Sparkles, ChevronRight,
  AlertTriangle, DollarSign, MapPin, Star, Phone, TestTube2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  formatFeedbackMessage, 
  formatReviewMessage, 
  formatQuoteMessage, 
  formatBookingMessage, 
  formatTrackingMessage 
} from '@/lib/formatFormData';
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
import { TrackingData } from './TrackAppointmentForm';
import { AppointmentTrackingView } from './AppointmentTrackingView';
import { BillingLookupForm } from '@/components/billing/forms/BillingLookupForm';
import { InvoiceDetailView } from '@/components/billing/forms/InvoiceDetailView';
import { CompanySelector } from './CompanySelector';
import { 
  getQuickActionsForTier, 
  type SubscriptionTier 
} from '@/lib/customerPortalConfig';

// Customer Engagement agents definition
const CUSTOMER_ENGAGEMENT_AGENTS = [
  { type: 'triage', name: 'AI Receptionist', description: 'Routes customers to the right specialist' },
  { type: 'booking', name: 'Scheduling Agent', description: 'Handles appointment scheduling' },
  { type: 'followup', name: 'Follow-up Agent', description: 'Post-service engagement' },
  { type: 'review', name: 'Social Media Review Agent', description: 'Collects customer reviews' },
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
  dispatch_phone: string | null;
  subscription_tier: string | null;
  trial_ends_at: string | null;
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
  allowCompanySelection?: boolean;
}

export const AIAgentConsole: React.FC<AIAgentConsoleProps> = ({ 
  companyId: propCompanyId,
  allowCompanySelection = false
}) => {
  const { companyId: authCompanyId } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // When company selection is allowed, only use selectedCompanyId
  // Otherwise, use propCompanyId or authCompanyId as fallback
  const companyId = allowCompanySelection 
    ? selectedCompanyId 
    : (propCompanyId || authCompanyId);
    
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
  const [activeFormType, setActiveFormType] = useState<
    'schedule' | 'emergency' | 'quote' | 'hours' | 'services' | 'track' | 'billing' | 'feedback' | 'review' | null
  >(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  // Pre-populated review data from high-rating feedback handoff
  const [reviewPrePopData, setReviewPrePopData] = useState<{
    rating: number;
    comment: string;
    customerName: string;
    customerPhone: string;
  } | null>(null);
  const [voiceTestMode, setVoiceTestMode] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; id: string }>>([]);
  const voiceChatScrollRef = useRef<HTMLDivElement>(null);

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

  // Fetch company details including review links and subscription tier
  const { data: company } = useQuery({
    queryKey: ['company-details', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url, primary_color, secondary_color, review_google_url, review_facebook_url, review_yelp_url, dispatch_phone, subscription_tier, trial_ends_at')
        .eq('id', companyId)
        .single();
      return data as (Company & { review_google_url?: string; review_facebook_url?: string; review_yelp_url?: string }) | null;
    },
    enabled: !!companyId,
  });

  // Determine effective subscription tier (trial = command tier access)
  const effectiveTier = React.useMemo((): SubscriptionTier => {
    if (!company) return 'single_point';
    const inTrial = company.trial_ends_at && new Date(company.trial_ends_at) > new Date();
    if (inTrial) return 'command';
    return (company.subscription_tier || 'single_point') as SubscriptionTier;
  }, [company]);

  // Filter quick actions based on subscription tier
  const visibleQuickActions = React.useMemo(() => {
    const hasPhone = !!company?.dispatch_phone;
    return getQuickActionsForTier(effectiveTier, hasPhone);
  }, [effectiveTier, company?.dispatch_phone]);

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

  // Fetch feature flags securely (works for all roles including customers)
  const { data: featureFlags } = useQuery({
    queryKey: ['company-feature-flags', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .rpc('get_company_feature_flags', { p_company_id: companyId })
        .maybeSingle();
      if (error) {
        console.error('[AIAgentConsole] Feature flags error:', error);
        return null;
      }
      return data;
    },
    enabled: !!companyId,
  });

  const hasVoiceChat = !!featureFlags?.has_voice_chat;
  const hasSMS = !!featureFlags?.has_sms;
  const twilioPhone = featureFlags?.twilio_phone_number;
  // Build tabs dynamically - include all functional tabs
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

  const hideAllForms = () => {
    setShowFeedbackForm(false);
    setShowReviewForm(false);
    setShowQuoteForm(false);
    setShowTrackForm(false);
    setShowBillingForm(false);
    setActiveFormType(null);
  };

  const handleQuickAction = async (action: string, actionId?: string) => {
    if (actionId === 'feedback') {
      hideAllForms();
      setShowFeedbackForm(true);
      setActiveFormType('feedback');
      setActiveTab('chat');
      return;
    }
    if (actionId === 'review') {
      hideAllForms();
      setShowReviewForm(true);
      setActiveFormType('review');
      setActiveTab('chat');
      return;
    }
    if (actionId === 'quote') {
      hideAllForms();
      setShowQuoteForm(true);
      setActiveFormType('quote');
      setActiveTab('chat');
      return;
    }
    if (actionId === 'track') {
      hideAllForms();
      setShowTrackForm(true);
      setActiveFormType('track');
      setActiveTab('chat');
      return;
    }
    if (actionId === 'billing') {
      hideAllForms();
      setShowBillingForm(true);
      setActiveFormType('billing');
      setActiveTab('chat');
      return;
    }
    hideAllForms();
    // Handle tab-switching actions that should send message to AI instead
    if (actionId === 'schedule') {
      // Send message to AI for booking flow instead of switching tabs
      setActiveFormType('schedule');
      setActiveTab('chat');
      await sendMessage("I'd like to request an appointment");
      return;
    }
    if (actionId === 'hours') {
      setActiveFormType('hours');
      setActiveTab('hours');
      return;
    }
    if (actionId === 'services') {
      setActiveFormType('services');
      setActiveTab('services');
      return;
    }
    if (actionId === 'call_to_book') {
      // Open phone dialer for Single-Point tier "Call to Book" action
      if (company?.dispatch_phone) {
        window.location.href = `tel:${company.dispatch_phone}`;
      }
      return;
    }
    if (actionId === 'emergency') {
      // Send emergency message to AI
      setActiveFormType('emergency');
      setActiveTab('chat');
      await sendMessage("I have an urgent emergency situation that needs immediate attention");
      return;
    }
    setActiveTab('chat');
    await sendMessage(action);
  };

  const handleHome = () => {
    clearMessages();
    hideAllForms();
    setSelectedInvoice(null);
    setActiveTab('chat');
  };

  const handleFeedbackSubmit = async (feedback: { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; note: string; customerName: string; customerPhone: string; serviceDate?: Date }) => {
    setShowFeedbackForm(false);
    const feedbackMessage = formatFeedbackMessage({
      rating: feedback.rating,
      sentiment: feedback.sentiment,
      note: feedback.note,
      customerName: feedback.customerName,
      customerPhone: feedback.customerPhone,
      serviceDate: feedback.serviceDate,
    });
    await sendMessage(feedbackMessage);
    
    // Auto-handoff to Review agent for 4+ star feedback
    if (feedback.rating >= 4 && reviewLinks.length > 0) {
      // Pre-populate review form with feedback data
      setReviewPrePopData({
        rating: feedback.rating,
        comment: feedback.note,
        customerName: feedback.customerName,
        customerPhone: feedback.customerPhone,
      });
      // Small delay to let feedback message display, then show review form
      setTimeout(() => {
        setShowReviewForm(true);
        setActiveFormType('review');
      }, 500);
    }
  };

  const handleReviewSubmit = async (review: { rating: number; comment: string; customerName: string; customerPhone: string; selectedPlatforms: string[] }) => {
    setShowReviewForm(false);
    setReviewPrePopData(null);
    const reviewMessage = formatReviewMessage({
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerName,
      customerPhone: review.customerPhone,
      selectedPlatforms: review.selectedPlatforms,
    });
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
      .map(s => s.name) || [];
    
    const bookingMessage = formatBookingMessage({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerAddress: booking.customerAddress,
      selectedServices: booking.selectedServices,
      serviceNames,
      date: booking.date,
      time: booking.time,
    });
    
    setActiveTab('chat');
    await sendMessage(bookingMessage);
  };

  const handleQuoteSubmit = async (quote: QuoteData) => {
    setShowQuoteForm(false);
    const serviceNames = services
      ?.filter(s => quote.selectedServices.includes(s.id))
      .map(s => s.name) || [];
    
    const quoteMessage = formatQuoteMessage({
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerEmail: quote.customerEmail,
      customerAddress: quote.customerAddress,
      selectedServices: quote.selectedServices,
      serviceNames,
      issueDescription: quote.issueDescription,
    });
    
    await sendMessage(quoteMessage);
  };

  const handleTrackSubmit = async (tracking: TrackingData) => {
    setShowTrackForm(false);
    const trackMessage = formatTrackingMessage({
      customerName: tracking.customerName,
      customerPhone: tracking.customerPhone,
      customerEmail: tracking.customerEmail,
    });
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

  // Get active label based on form type or action - show agent label during chat, or context label for forms/actions
  const getActiveLabel = () => {
    if (activeFormType === 'schedule') return 'Booking';
    if (activeFormType === 'emergency') return 'Emergency';
    if (activeFormType === 'quote') return 'Quote Request';
    if (activeFormType === 'hours') return 'Hours';
    if (activeFormType === 'services') return 'Services';
    if (activeFormType === 'track') return 'Tracking';
    if (activeFormType === 'billing') return 'Billing';
    if (activeFormType === 'feedback') return 'Feedback';
    if (activeFormType === 'review') return 'Review';
    if (messages.length > 0) return agentInfo.label; // Show agent label during chat
    return agentInfo.label;
  };
  
  const activeLabel = getActiveLabel();

  // Show company selector if allowed and no company is selected
  const showCompanySelector = allowCompanySelection && !companyId;

  const handleCompanySelect = (id: string) => {
    setSelectedCompanyId(id);
    clearMessages();
  };

  const handleBackToCompanySelector = () => {
    setSelectedCompanyId(null);
    clearMessages();
  };

  if (showCompanySelector) {
    return (
      <Card className="h-[calc(100vh-200px)] sm:h-[600px] flex flex-col overflow-hidden shadow-xl border-slate-600/50 bg-slate-800">
        <CompanySelector 
          onSelectCompany={handleCompanySelect}
          title="Select a Company"
          subtitle="Choose a company to access their AI assistant and services"
        />
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-200px)] sm:h-[600px] flex flex-col overflow-hidden shadow-xl border-border/50 console-surface">
      {/* Header */}
      <GlassHeader
        companyName={company?.name || 'AI Assistant'}
        logoUrl={company?.logo_url}
        agentLabel={activeLabel}
        agentColor={agentInfo.color}
        agentBgColor={agentInfo.bgColor}
        showPhone={!!twilioPhone}
        showVoice={hasVoiceChat}
        onPhoneClick={() => window.open(`tel:${twilioPhone}`, '_self')}
        onVoiceClick={() => setActiveTab('voice')}
        useDefaultLogo={true}
        showBackButton={allowCompanySelection && !!selectedCompanyId}
        onBackClick={handleBackToCompanySelector}
      />

      {/* Tab Navigation */}
      <MobileTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHomeClick={handleHome}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && !isShowingForm && (
                <WelcomeScreen
                  companyName={company?.name}
                  title={company?.name ? `Welcome to ${company.name}!` : "Welcome!"}
                  subtitle={company?.name 
                    ? `I'm ${company.name}'s virtual assistant. Select an option below or type a message to get started.`
                    : "I'm your AI assistant. How can I help you today?"
                  }
                  actions={visibleQuickActions}
                  onAction={handleQuickAction}
                  consoleType="customer"
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
                  onCancel={() => {
                    setShowReviewForm(false);
                    setReviewPrePopData(null);
                    handleHome();
                  }}
                  isLoading={isLoading}
                  reviewLinks={reviewLinks}
                  initialData={reviewPrePopData || undefined}
                />
              )}

              {showQuoteForm && (
                <QuoteForm
                  services={services || []}
                  company={company}
                  onSubmit={handleQuoteSubmit}
                  onCancel={handleHome}
                  onSelectDifferentCompany={allowCompanySelection ? handleBackToCompanySelector : undefined}
                />
              )}

              {showTrackForm && companyId && (
                <AppointmentTrackingView
                  companyId={companyId}
                  onCancel={handleHome}
                />
              )}

              {showBillingForm && companyId && !selectedInvoice && (
                <BillingLookupForm
                  companyId={companyId}
                  onCancel={handleHome}
                  onSelectInvoice={(invoice) => setSelectedInvoice(invoice)}
                />
              )}

              {showBillingForm && selectedInvoice && (
                <InvoiceDetailView
                  invoice={selectedInvoice}
                  onBack={() => setSelectedInvoice(null)}
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
                actions={visibleQuickActions}
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

            {/* Tier-aware scheduling button */}
            {effectiveTier !== 'single_point' ? (
              <Button 
                className="w-full mt-4 glass-primary text-white glow-primary" 
                onClick={() => setActiveTab('book')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule an Appointment
              </Button>
            ) : company?.dispatch_phone ? (
              <Button 
                className="w-full mt-4 glass-primary text-white glow-primary" 
                onClick={() => window.location.href = `tel:${company.dispatch_phone}`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call to Book: {company.dispatch_phone}
              </Button>
            ) : (
              <div className="mt-4 p-3 text-center text-sm text-muted-foreground bg-muted rounded-lg">
                <Phone className="h-4 w-4 inline mr-2" />
                Contact us directly to schedule an appointment
              </div>
            )}
          </div>
        )}

        {/* Book Tab - Only accessible for Multi-Track+ tiers */}
        {activeTab === 'book' && effectiveTier !== 'single_point' && (
          <div className="flex-1 overflow-y-auto p-4">
            <BookingForm
              services={services || []}
              onSubmit={handleBookingSubmit}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Book Tab fallback for Single-Point tier */}
        {activeTab === 'book' && effectiveTier === 'single_point' && (
          <div className="flex-1 overflow-y-auto p-4 text-center">
            <div className="py-8">
              <Phone className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Call to Schedule</h3>
              <p className="text-muted-foreground mb-4">
                Online booking is not available for this plan. Please call us to schedule your appointment.
              </p>
              {company?.dispatch_phone && (
                <Button onClick={() => window.location.href = `tel:${company.dispatch_phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call {company.dispatch_phone}
                </Button>
              )}
            </div>
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

            <h4 className="font-medium mb-3 text-foreground">Weekly Schedule</h4>
            <div className="space-y-2">
              {DAYS.map((day, index) => {
                const hours = businessHours?.find(h => h.day_of_week === index);
                const isToday = new Date().getDay() === index;

                return (
                  <div
                    key={day}
                    className={cn(
                      "flex justify-between p-3 rounded-xl transition-all animate-fade-in border bg-white",
                      isToday ? "border-primary/50 shadow-sm" : "border-border"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className={cn("font-medium text-foreground", isToday && "text-primary")}>
                      {day}
                      {isToday && <Badge variant="outline" className="ml-2 text-xs">Today</Badge>}
                    </span>
                    <span className="text-primary">
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
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg mb-2 gradient-text">Voice AI Assistant</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {voiceTestMode 
                  ? 'Test agent logic via text without using voice credits.'
                  : 'Talk directly with our AI assistant using your microphone.'}
              </p>
              
              {/* Test Mode Toggle */}
              <div className="flex items-center justify-center gap-2 mt-4 p-2 rounded-lg bg-muted/50">
                <Switch
                  id="voice-test-mode"
                  checked={voiceTestMode}
                  onCheckedChange={(checked) => {
                    setVoiceTestMode(checked);
                    setVoiceMessages([]); // Clear messages when switching modes
                  }}
                />
                <Label htmlFor="voice-test-mode" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <TestTube2 className="h-4 w-4" />
                  Text Mode
                  <span className="text-xs text-muted-foreground">(saves credits)</span>
                </Label>
              </div>
            </div>

            {/* Conversation Transcript (Text Mode) */}
            {voiceTestMode && voiceMessages.length > 0 && (
              <div 
                ref={voiceChatScrollRef}
                className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto mb-4 p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="space-y-3">
                  {voiceMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Conversation Button */}
            {voiceTestMode && voiceMessages.length > 0 && (
              <div className="flex justify-center mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceMessages([])}
                  className="text-xs text-muted-foreground"
                >
                  Clear Conversation
                </Button>
              </div>
            )}

            <div className="flex flex-col items-center justify-center flex-1">
              <VoiceChat
                companyId={companyId || ''}
                companyName={company?.name || 'Company'}
                testMode={voiceTestMode}
                onTranscript={(role, text) => {
                  console.log(`[${role}]: ${text}`);
                  setVoiceMessages((prev) => [
                    ...prev,
                    { role, text, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }
                  ]);
                  // Auto-scroll to bottom
                  setTimeout(() => {
                    voiceChatScrollRef.current?.scrollTo({
                      top: voiceChatScrollRef.current.scrollHeight,
                      behavior: 'smooth'
                    });
                  }, 100);
                }}
              />
            </div>
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
