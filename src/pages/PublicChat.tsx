import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bot, Send, User, Loader2, Calendar, Clock, DollarSign, 
  AlertTriangle, Star, MessageSquare, Sparkles, Building2,
  Phone, X, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { getAgentStyle } from '@/lib/agentStyles';

interface CompanyConfig {
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
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

  // Communicate with parent window in embed mode
  useEffect(() => {
    if (isEmbedMode && window.parent !== window) {
      // Notify parent that chat is ready
      window.parent.postMessage({ type: 'aura-chat-ready', companySlug }, '*');
    }
  }, [isEmbedMode, companySlug]);

  // Use multi-agent chat hook
  const { 
    messages, 
    isLoading: isStreaming, 
    currentAgent, 
    sendMessage, 
    clearMessages 
  } = useMultiAgentChat({
    companyId: config?.company?.id,
    onAgentChange: (agent) => {
      console.log('[PublicChat] Agent changed to:', agent);
    }
  });

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
      {/* Header - hidden in embed mode */}
      {!isEmbedMode && (
        <header 
          className="px-4 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.company.logo_url ? (
                <img 
                  src={config.company.logo_url} 
                  alt={config.company.name} 
                  className="h-10 w-10 rounded-full object-cover bg-white p-1"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
              )}
              <div>
                <h1 className="font-semibold">{config.company.name}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/80">Virtual Assistant</p>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-[10px] px-1.5 py-0 border-0', agentInfo.bgColor, agentInfo.color)}
                  >
                    {agentInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Clock className="h-3 w-3 mr-1" />
              {getTodayHours()}
            </Badge>
          </div>
        </header>
      )}

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
                    {QUICK_ACTIONS.map((action) => (
                      <Button 
                        key={action.id}
                        variant={action.variant || 'outline'} 
                        size="sm"
                        className={cn(
                          "justify-start gap-2",
                          action.variant === 'destructive' && "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                        )}
                        onClick={() => handleSendMessage(action.message)}
                      >
                        <action.icon className="h-4 w-4" />
                        <span className="truncate">{action.label}</span>
                      </Button>
                    ))}
                  </div>
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
                        {/* Agent Badge for assistant messages */}
                        {message.role === 'assistant' && msgAgentInfo && (
                          <Badge 
                            variant="secondary" 
                            className={cn('text-[10px] px-1.5 py-0 mb-1 border-0', msgAgentInfo.bgColor, msgAgentInfo.color)}
                          >
                            {msgAgentInfo.label}
                          </Badge>
                        )}
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                  <div className="flex-1 text-muted-foreground text-sm">Thinking...</div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button type="submit" disabled={isStreaming || !input.trim()}>
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
    </div>
  );
}
