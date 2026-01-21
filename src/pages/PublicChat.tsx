import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Bot, Send, User, Calendar, Clock, 
  AlertTriangle, MessageSquare, Sparkles, Building2,
  Phone, X, Mic, Home, Volume2, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePublicChatStream, StreamMessage } from '@/hooks/usePublicChatStream';
import { getAgentStyle } from '@/lib/agentStyles';
import { supabase } from '@/integrations/supabase/client';
import { EmbedAuthPrompt } from '@/components/widget/EmbedAuthPrompt';
import { VoiceChat } from '@/components/ai/VoiceChat';
import { 
  onAIStreamStart, 
  onAIStreamComplete, 
  isSoundEnabled, 
  toggleSound 
} from '@/lib/chatFeedback';
import { 
  getQuickActionsForTier, 
  getTabsForTier, 
  getEffectiveTier,
  type QuickActionConfig 
} from '@/lib/customerPortalConfig';

interface CompanyConfig {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    dispatch_phone: string | null;
    review_google_url: string | null;
    review_facebook_url: string | null;
    subscription_tier?: string;
    in_trial?: boolean;
  };
  business_hours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number | null;
    description: string | null;
  }>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PublicChat() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [searchParams] = useSearchParams();
  const isEmbedMode = searchParams.get('embed') === 'true';

  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Customer authentication state
  const [customerUserId, setCustomerUserId] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptDismissed, setAuthPromptDismissed] = useState(false);
  
  // Voice chat dialog state
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  
  // Emergency phone dialog state
  const [showEmergencyPhone, setShowEmergencyPhone] = useState(false);
  
  // Sound feedback state
  const [soundEnabled, setSoundEnabled] = useState(() => isSoundEnabled());
  
  // Check for existing session on mount - skip in embed mode to prevent cross-context auth events
  useEffect(() => {
    if (isEmbedMode) {
      // In embed mode, skip auth to prevent dashboard reload loops
      return;
    }
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCustomerUserId(session.user.id);
      }
    };
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCustomerUserId(session.user.id);
      } else {
        setCustomerUserId(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [isEmbedMode]);

  // Communicate with parent window in embed mode
  useEffect(() => {
    if (isEmbedMode && window.parent !== window) {
      // Notify parent that chat is ready
      window.parent.postMessage({ type: 'aura-chat-ready', companySlug }, '*');
    }
  }, [isEmbedMode, companySlug]);

  // Use streaming chat hook for fast token-by-token responses
  const { 
    messages, 
    isLoading: isStreaming, 
    currentAgent, 
    sendMessage, 
    clearMessages 
  } = usePublicChatStream({
    companySlug: companySlug || '',
    onAgentChange: (agent) => {
      console.log('[PublicChat] Agent changed to:', agent);
    },
    onStreamStart: onAIStreamStart,
    onStreamComplete: onAIStreamComplete,
  });
  
  // Show auth prompt after first user interaction if not signed in
  useEffect(() => {
    if (messages.length >= 2 && !customerUserId && !authPromptDismissed) {
      setShowAuthPrompt(true);
    }
  }, [messages.length, customerUserId, authPromptDismissed]);

  const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  useEffect(() => {
    // Validate slug - must not be empty, contain :, or be a route placeholder
    if (companySlug && !companySlug.includes(':') && companySlug !== 'companySlug') {
      fetchConfig();
    } else {
      setError('Invalid company URL. Please use a valid company link like /chat/your-company-slug');
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/widget-api?action=config&company=${encodeURIComponent(companySlug!)}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      setConfig(data);
    } catch (err) {
      console.error('Config error:', err);
      setError('Unable to load chat. Company not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !config) return;
    setInput('');
    await sendMessage(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
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
    const todayHours = config?.business_hours?.find(h => h.day_of_week === today);
    if (!todayHours || todayHours.is_closed) return 'Closed today';
    return `${formatTime(todayHours.open_time)} - ${formatTime(todayHours.close_time)}`;
  };

  const primaryColor = config?.company.primary_color || '#6366f1';
  const agentInfo = getAgentStyle(currentAgent);

  // Get tier-filtered quick actions and tabs
  // Note: Backend already computes effective tier (trial companies get 'command')
  const effectiveTier = useMemo(() => {
    const inTrial = config?.company?.in_trial || false;
    return getEffectiveTier(config?.company?.subscription_tier, inTrial);
  }, [config?.company?.subscription_tier, config?.company?.in_trial]);

  const visibleQuickActions = useMemo(() => {
    const hasPhone = !!config?.company?.dispatch_phone;
    return getQuickActionsForTier(effectiveTier, hasPhone);
  }, [effectiveTier, config?.company?.dispatch_phone]);

  // Note: visibleTabs is available from getTabsForTier(effectiveTier) if needed for dynamic tab filtering

  const handleQuickAction = useCallback((action: QuickActionConfig) => {
    if (action.isCallAction && config?.company?.dispatch_phone) {
      window.location.href = `tel:${config.company.dispatch_phone}`;
    } else if (action.message) {
      handleSendMessage(action.message);
    }
  }, [config?.company?.dispatch_phone]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-lg p-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Chat Unavailable</h1>
          <p className="text-muted-foreground">{error || 'Unable to load chat'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background flex flex-col", isEmbedMode ? "h-full" : "min-h-screen")}>
      {/* Header - compact for embed mode, full for standalone */}
      <header 
        className={cn(
          "px-4 text-white",
          isEmbedMode ? "py-2" : "py-4"
        )}
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Home button - shows when there are messages */}
            {messages.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
                onClick={() => clearMessages()}
                title="Home"
              >
                <Home className="h-4 w-4" />
              </Button>
            )}
            {config.company.logo_url ? (
              <img 
                src={config.company.logo_url} 
                alt={config.company.name} 
                className={cn(
                  "rounded-full object-cover bg-white p-1",
                  isEmbedMode ? "h-8 w-8" : "h-10 w-10"
                )}
              />
            ) : (
              <div className={cn(
                "rounded-full bg-white/20 flex items-center justify-center",
                isEmbedMode ? "h-8 w-8" : "h-10 w-10"
              )}>
                <Building2 className={isEmbedMode ? "h-4 w-4" : "h-5 w-5"} />
              </div>
            )}
            <div>
              <h1 className={cn("font-semibold", isEmbedMode && "text-sm")}>{config.company.name}</h1>
              {!isEmbedMode && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/80">Virtual Assistant</p>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-[10px] px-1.5 py-0 border-0', agentInfo.bgColor, agentInfo.color)}
                  >
                    {agentInfo.label}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound Toggle Button */}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setSoundEnabled(toggleSound())}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {/* Voice Chat Button */}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setShowVoiceDialog(true)}
              title="Voice Chat"
            >
              <Mic className="h-4 w-4" />
            </Button>
            {/* Call Button - shows emergency phone */}
            {config?.company.dispatch_phone && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
                onClick={() => setShowEmergencyPhone(true)}
                title="Call Us"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            {!isEmbedMode && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Clock className="h-3 w-3 mr-1" />
                {getTodayHours()}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs - hidden in embed mode */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {!isEmbedMode && (
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger 
              value="chat" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="services"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Services
            </TabsTrigger>
            <TabsTrigger 
              value="hours"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Hours
            </TabsTrigger>
          </TabsList>
        )}

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div 
                    className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                  >
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Hi there! 👋</h3>
                  <p className="text-foreground/70 mt-1 mb-6">
                    I'm the virtual assistant for {config.company.name}. How can I help you today?
                  </p>
                  
                  {/* Quick Actions - filtered by subscription tier */}
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto overflow-hidden">
                    {visibleQuickActions.filter(a => a.id !== 'emergency').map((action) => (
                      <Button 
                        key={action.id}
                        variant={action.variant || 'outline'} 
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => handleQuickAction(action)}
                      >
                        <action.icon className={cn("h-4 w-4", action.featureColor)} />
                        <span className="truncate">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Emergency Section with Phone Number and Call Button */}
                  {config?.company.dispatch_phone && (
                    <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 max-w-sm mx-auto">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-left">
                          <div className="flex items-center gap-2 text-destructive mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-semibold">Emergency</span>
                          </div>
                          <a 
                            href={`tel:${config.company.dispatch_phone}`}
                            className="text-xl font-bold text-destructive hover:underline"
                          >
                            {config.company.dispatch_phone}
                          </a>
                        </div>
                        <a
                          href={`tel:${config.company.dispatch_phone}`}
                          className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg"
                        >
                          <Phone className="h-6 w-6" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {messages.map((message, index) => {
                const msgAgentInfo = message.agent ? getAgentStyle(message.agent) : null;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showHandoffIndicator = message.role === 'assistant' &&
                  prevMessage?.role === 'assistant' && 
                  message.agent && 
                  prevMessage?.agent && 
                  message.agent !== prevMessage.agent;

                return (
                  <React.Fragment key={index}>
                    {/* Handoff Indicator */}
                      {showHandoffIndicator && (
                        <div className="flex items-center justify-center gap-2 py-2 text-xs text-foreground/70">
                          <div className="h-px flex-1 bg-border" />
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                            → Transferred to {msgAgentInfo?.label}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}

                    <div
                      className={cn(
                        'flex gap-3 p-3 rounded-lg transition-all duration-300',
                        'animate-in fade-in-0 slide-in-from-bottom-2',
                        message.role === 'user' 
                          ? 'bg-primary/10 ml-8' 
                          : 'bg-muted mr-8',
                        // Subtle glow while streaming
                        (message as StreamMessage).isStreaming && 'ring-2 ring-primary/20 ring-offset-1 ring-offset-background'
                      )}
                    >
                      <div 
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                          message.role === 'user' ? 'bg-primary' : ''
                        )}
                        style={message.role === 'assistant' ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` } : undefined}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        {/* Agent Badge for assistant messages */}
                        {message.role === 'assistant' && msgAgentInfo && (
                          <Badge 
                            variant="secondary" 
                            className={cn('text-[10px] px-1.5 py-0 mb-1 border-0', msgAgentInfo.bgColor, msgAgentInfo.color)}
                          >
                            {msgAgentInfo.label}
                          </Badge>
                        )}
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                          {/* Animated cursor for streaming messages */}
                          {(message as any).isStreaming && (
                            <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Typing indicator - only show when loading and no streaming message yet */}
              {isStreaming && (!messages.length || (messages[messages.length - 1]?.role === 'user')) && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 flex items-center gap-1 text-muted-foreground text-sm">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Auth prompt - shows after first interaction */}
          {showAuthPrompt && !customerUserId && config?.company?.id && (
            <EmbedAuthPrompt
              companyId={config.company.id}
              primaryColor={primaryColor}
              onAuthenticated={(userId) => {
                setCustomerUserId(userId);
                setShowAuthPrompt(false);
              }}
              onDismiss={() => {
                setShowAuthPrompt(false);
                setAuthPromptDismissed(true);
              }}
            />
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
            {messages.length > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => clearMessages()}
                title="End Chat"
                className="shrink-0 gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">End Chat</span>
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => setShowVoiceDialog(true)}
              className="shrink-0"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {config.services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No services available
                </p>
              ) : (
                config.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      handleSendMessage(`Tell me about ${service.name}`);
                      setActiveTab('chat');
                    }}
                    className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <h4 className="font-medium">{service.name}</h4>
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
                  </button>
                ))
              )}
              
              <Button 
                className="w-full mt-4"
                onClick={() => {
                  handleSendMessage("I'd like to book an appointment");
                  setActiveTab('chat');
                }}
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
              <div 
                className="rounded-lg p-4 mb-4 text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Today's Hours</span>
                </div>
                <p className="text-lg font-semibold mt-1">{getTodayHours()}</p>
              </div>

              <h4 className="font-medium mb-3">Weekly Schedule</h4>
              <div className="space-y-2">
                {DAYS.map((day, index) => {
                  const hours = config.business_hours?.find(h => h.day_of_week === index);
                  const isToday = new Date().getDay() === index;
                  
                  return (
                    <div 
                      key={day}
                      className={cn(
                        "flex justify-between p-3 rounded-lg",
                        isToday ? "bg-primary/10 border border-primary/20" : "bg-muted"
                      )}
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

              <div className="mt-6 text-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleSendMessage("What are your business hours?");
                    setActiveTab('chat');
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask About Hours
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Voice Chat Dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Assistant
            </DialogTitle>
            <DialogDescription>
              Speak with our AI assistant for {config.company.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {voiceTranscript.length > 0 && (
              <ScrollArea className="h-32 mb-4 rounded-lg border p-3">
                <div className="space-y-2">
                  {voiceTranscript.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "text-sm p-2 rounded",
                        msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                      )}
                    >
                      <span className="font-medium text-xs text-muted-foreground">
                        {msg.role === 'user' ? 'You' : 'Assistant'}:
                      </span>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <VoiceChat
              companyId={config.company.id}
              companyName={config.company.name}
              onTranscript={(role, text) => {
                setVoiceTranscript(prev => [...prev, { role, text }]);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Phone Dialog */}
      <Dialog open={showEmergencyPhone} onOpenChange={setShowEmergencyPhone}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </DialogTitle>
            <DialogDescription>
              Call us directly for urgent assistance
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
              <Phone className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {config.company.name} Emergency Hotline
            </p>
            <a 
              href={`tel:${config?.company.dispatch_phone}`}
              className="text-2xl font-bold text-destructive hover:underline"
            >
              {config?.company.dispatch_phone}
            </a>
            <div className="mt-4">
              <Button 
                className="w-full"
                variant="destructive"
                onClick={() => window.location.href = `tel:${config?.company.dispatch_phone}`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
