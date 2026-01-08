import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bot, Send, User, Loader2, Calendar, Clock, DollarSign, 
  AlertTriangle, Star, MessageSquare, Sparkles, Building2,
  Phone, X, MapPin, Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgentStyle } from '@/lib/agentStyles';
import { EmbedAuthPrompt } from '@/components/widget/EmbedAuthPrompt';
import { VoiceChat } from '@/components/ai/VoiceChat';

interface CompanyConfig {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    dispatch_phone: string | null;
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

const QUICK_ACTIONS = [
  { id: 'schedule', label: 'Request Appointment', icon: Calendar, message: "I'd like to request an appointment" },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, message: "I have an urgent emergency situation", variant: 'destructive' as const },
  { id: 'quote', label: 'Get Quote', icon: DollarSign, message: "I need a quote for your services" },
  { id: 'hours', label: 'Business Hours', icon: Clock, message: "What are your business hours?" },
  { id: 'services', label: 'View Services', icon: Sparkles, message: "What services do you offer?" },
  { id: 'track', label: 'Track Appointment', icon: MapPin, message: "I want to track my appointment status" },
  { id: 'feedback', label: 'Leave Feedback', icon: Star, message: "I'd like to leave feedback about my service" },
];

interface UnifiedCustomerConsoleProps {
  companyId?: string;
  companySlug?: string;
  isEmbedded?: boolean;
  userId?: string | null;
  onAuthPromptDismiss?: () => void;
}

export function UnifiedCustomerConsole({
  companyId,
  companySlug,
  isEmbedded = false,
  userId,
  onAuthPromptDismiss,
}: UnifiedCustomerConsoleProps) {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auth prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptDismissed, setAuthPromptDismissed] = useState(false);
  
  // Voice chat dialog state
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  
  // Emergency phone dialog state
  const [showEmergencyPhone, setShowEmergencyPhone] = useState(false);

  const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  // Use multi-agent chat hook
  const { 
    messages, 
    isLoading: isStreaming, 
    currentAgent, 
    sendMessage, 
    clearMessages 
  } = useMultiAgentChat({
    companyId: config?.company?.id || companyId,
    userId: userId || undefined,
    onAgentChange: (agent) => {
      console.log('[UnifiedCustomerConsole] Agent changed to:', agent);
    }
  });
  
  // Show auth prompt after first user interaction if not signed in
  useEffect(() => {
    if (messages.length >= 2 && !userId && !authPromptDismissed) {
      setShowAuthPrompt(true);
    }
  }, [messages.length, userId, authPromptDismissed]);

  // Fetch config from widget-api if we have a slug
  useEffect(() => {
    if (companySlug && !companySlug.includes(':') && companySlug !== 'companySlug') {
      fetchConfigBySlug();
    } else if (companyId) {
      fetchConfigById();
    } else {
      setError('No company specified');
      setLoading(false);
    }
  }, [companySlug, companyId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConfigBySlug = async () => {
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

  const fetchConfigById = async () => {
    try {
      // Fetch company details directly from Supabase
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, logo_url, primary_color, secondary_color, dispatch_phone')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('company_id', companyId)
        .order('day_of_week');

      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, duration_minutes, price, description')
        .eq('company_id', companyId)
        .eq('is_active', true);

      setConfig({
        company: {
          ...companyData,
          primary_color: companyData.primary_color || '#6366f1',
          secondary_color: companyData.secondary_color || '#8b5cf6',
        },
        business_hours: hoursData || [],
        services: servicesData || [],
      });
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

  const handleDismissAuthPrompt = () => {
    setShowAuthPrompt(false);
    setAuthPromptDismissed(true);
    onAuthPromptDismiss?.();
  };

  const primaryColor = config?.company.primary_color || '#6366f1';
  const agentInfo = getAgentStyle(currentAgent);

  if (loading) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center p-4">
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
    <div className={cn("bg-background flex flex-col", isEmbedded ? "h-full" : "min-h-[600px]")}>
      {/* Header */}
      <header 
        className={cn("px-4 text-white", isEmbedded ? "py-2" : "py-4")}
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.company.logo_url ? (
              <img 
                src={config.company.logo_url} 
                alt={config.company.name} 
                className={cn(
                  "rounded-full object-cover bg-white p-1",
                  isEmbedded ? "h-8 w-8" : "h-10 w-10"
                )}
              />
            ) : (
              <div className={cn(
                "rounded-full bg-white/20 flex items-center justify-center",
                isEmbedded ? "h-8 w-8" : "h-10 w-10"
              )}>
                <Building2 className={isEmbedded ? "h-4 w-4" : "h-5 w-5"} />
              </div>
            )}
            <div>
              <h1 className={cn("font-semibold", isEmbedded && "text-sm")}>{config.company.name}</h1>
              {!isEmbedded && (
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
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setShowVoiceDialog(true)}
              title="Voice Chat"
            >
              <Mic className="h-4 w-4" />
            </Button>
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
            {!isEmbedded && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Clock className="h-3 w-3 mr-1" />
                {getTodayHours()}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
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
                  <p className="text-muted-foreground mt-1 mb-6">
                    I'm the virtual assistant for {config.company.name}. How can I help you today?
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    {QUICK_ACTIONS.filter(a => a.id !== 'emergency').map((action) => (
                      <Button 
                        key={action.id}
                        variant={action.variant || 'outline'} 
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => handleSendMessage(action.message)}
                      >
                        <action.icon className="h-4 w-4" />
                        <span className="truncate">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Emergency Section */}
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
                    {showHandoffIndicator && (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                        <div className="h-px flex-1 bg-border" />
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                          → Transferred to {msgAgentInfo?.label}
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
                        {message.role === 'assistant' && msgAgentInfo && (
                          <Badge 
                            variant="secondary" 
                            className={cn('text-[10px] px-1.5 py-0 mb-1 border-0', msgAgentInfo.bgColor, msgAgentInfo.color)}
                          >
                            {msgAgentInfo.label}
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {isStreaming && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                  >
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">Typing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Auth Prompt */}
          {showAuthPrompt && config?.company && (
            <div className="p-4 border-t bg-muted/50">
              <EmbedAuthPrompt
                companyId={config.company.id}
                primaryColor={primaryColor}
                onAuthenticated={(userId) => {
                  setShowAuthPrompt(false);
                }}
                onDismiss={handleDismissAuthPrompt}
              />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
            <div className="flex gap-2 max-w-2xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isStreaming}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="flex-1 p-4 overflow-auto">
          <div className="space-y-3">
            <h3 className="font-semibold">Our Services</h3>
            {config.services.length === 0 ? (
              <p className="text-muted-foreground text-sm">No services listed yet.</p>
            ) : (
              config.services.map((service) => (
                <div 
                  key={service.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setActiveTab('chat');
                    handleSendMessage(`Tell me about ${service.name}`);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    {service.price && (
                      <span className="font-semibold">${service.price}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="flex-1 p-4 overflow-auto">
          <div className="space-y-3">
            <h3 className="font-semibold">Business Hours</h3>
            {config.business_hours.length === 0 ? (
              <p className="text-muted-foreground text-sm">Business hours not available.</p>
            ) : (
              <div className="space-y-2">
                {DAYS.map((day, index) => {
                  const hours = config.business_hours.find(h => h.day_of_week === index);
                  const isToday = new Date().getDay() === index;
                  
                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "flex justify-between items-center p-3 rounded-lg",
                        isToday && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <span className={cn("font-medium", isToday && "text-primary")}>
                        {day}
                        {isToday && <span className="ml-2 text-xs">(Today)</span>}
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
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Voice Chat Dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Chat
            </DialogTitle>
          </DialogHeader>
          <VoiceChat 
            companyId={config.company.id}
            companyName={config.company.name}
            onTranscript={(role, text) => {
              setVoiceTranscript(prev => [...prev, { role, text }]);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Emergency Phone Dialog */}
      <Dialog open={showEmergencyPhone} onOpenChange={setShowEmergencyPhone}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Contact
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <a 
              href={`tel:${config?.company.dispatch_phone}`}
              className="text-3xl font-bold text-destructive hover:underline block mb-4"
            >
              {config?.company.dispatch_phone}
            </a>
            <Button 
              size="lg"
              variant="destructive"
              className="w-full"
              onClick={() => window.location.href = `tel:${config?.company.dispatch_phone}`}
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
