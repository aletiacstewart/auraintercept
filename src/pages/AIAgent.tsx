import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { AIAgentSettings } from '@/components/ai/AIAgentSettings';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Phone, MessageSquare, Calendar, Brain, CheckCircle2, XCircle, PhoneOutgoing, ExternalLink, Monitor, Code, Settings, PhoneCall, FileText, Star, ThumbsUp, Globe, Truck, MapPin, Clock, CheckSquare, Navigation, HeadphonesIcon } from 'lucide-react';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';
import { TestCallDialog } from '@/components/ai/TestCallDialog';
import { Button } from '@/components/ui/button';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';

const AIAgent = () => {
  const { companyId, userRole } = useAuth();
  const { isAtLeastTier } = useSubscription();
  const [viewMode, setViewMode] = useState<'customer' | 'debug'>('customer');
  const [activeTab, setActiveTab] = useState<'console' | 'settings'>('console');
  const [consoleType, setConsoleType] = useState<'customer' | 'fieldops'>('customer');
  
  // Employees can view but not configure - they inherit company settings
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  // Check integration status
  const { data: integrations } = useQuery({
    queryKey: ['integrations-status', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('twilio_account_sid, twilio_phone_number, elevenlabs_api_key, tts_provider, openai_api_key, google_tts_api_key')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Check which TTS providers are connected
  const connectedTTSProviders = {
    elevenlabs: !!integrations?.elevenlabs_api_key,
    openai: !!integrations?.openai_api_key,
    google: !!integrations?.google_tts_api_key,
  };
  
  const hasAnyTTS = connectedTTSProviders.elevenlabs || connectedTTSProviders.openai || connectedTTSProviders.google;
  const hasTwilio = !!(integrations?.twilio_account_sid && integrations?.twilio_phone_number);
  const hasVoice = hasTwilio && hasAnyTTS;

  // Get current selected TTS provider info
  const selectedProvider = integrations?.tts_provider || 'elevenlabs';
  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      elevenlabs: 'ElevenLabs',
      openai: 'OpenAI TTS',
      google: 'Google TTS',
    };
    return names[provider] || 'ElevenLabs';
  };

  // Get connected provider names for display
  const getConnectedProviderNames = () => {
    const connected: string[] = [];
    if (connectedTTSProviders.elevenlabs) connected.push('ElevenLabs');
    if (connectedTTSProviders.openai) connected.push('OpenAI');
    if (connectedTTSProviders.google) connected.push('Google');
    return connected;
  };

  return (
    <DashboardLayout>
      <FeatureGate requiredTier="enterprise">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AI Agent</h1>
              <p className="text-muted-foreground mt-1">
                Test and monitor your AI-powered virtual assistant
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasVoice && (
                <>
                  <TestCallDialog
                    trigger={
                      <Button variant="outline">
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Test Call
                      </Button>
                    }
                  />
                  <OutboundCallDialog
                    trigger={
                      <Button>
                        <PhoneOutgoing className="w-4 h-4 mr-2" />
                        Make Outbound Call
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                RAG Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="bg-green-500">Active</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Knowledge base connected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Booking Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="bg-green-500">Ready</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Appointment logic enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Voice Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasVoice ? (
                <>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Twilio + {getConnectedProviderNames().join(', ')}
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    {canManageSettings ? 'Requires Setup' : 'Not Configured'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {canManageSettings ? (
                      !hasTwilio && !hasAnyTTS 
                        ? 'Configure Twilio & a TTS provider'
                        : !hasTwilio 
                          ? 'Configure Twilio'
                          : 'Configure a TTS provider'
                    ) : (
                      'Contact your admin to enable'
                    )}
                  </p>
                  {canManageSettings && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {!hasTwilio && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                          <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                            Twilio <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {!hasAnyTTS && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                          <a href="/dashboard/integrations">
                            Setup TTS <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                SMS Handler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasTwilio ? (
                <>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Twilio connected
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    {canManageSettings ? 'Requires Setup' : 'Not Configured'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {canManageSettings ? 'Configure Twilio integration' : 'Contact your admin to enable'}
                  </p>
                  {canManageSettings && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2" asChild>
                      <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                        Sign up for Twilio <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'console' | 'settings')}>
          <TabsList>
            <TabsTrigger value="console">
              <Bot className="h-4 w-4 mr-2" />
              Console
            </TabsTrigger>
            {canManageSettings && (
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="console" className="mt-6">
            {/* Console Type Selector for Admins */}
            {userRole !== 'employee' && (
              <Tabs value={consoleType} onValueChange={(v) => setConsoleType(v as 'customer' | 'fieldops')} className="mb-6">
                <TabsList>
                  <TabsTrigger value="customer">
                    <HeadphonesIcon className="h-4 w-4 mr-2" />
                    Customer Engagement
                  </TabsTrigger>
                  <TabsTrigger value="fieldops">
                    <Truck className="h-4 w-4 mr-2" />
                    Field Operations
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Console with View Toggle */}
            <div className={`grid gap-6 ${userRole === 'employee' || consoleType === 'fieldops' ? '' : 'lg:grid-cols-2'}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {userRole === 'employee' || consoleType === 'fieldops' ? 'Field Operations Console' : 'AI Agent Console'}
                  </h2>
                  {userRole !== 'employee' && consoleType === 'customer' && (
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'customer' | 'debug')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="customer" className="text-xs h-7 px-3">
                          <Monitor className="h-3 w-3 mr-1" />
                          Customer View
                        </TabsTrigger>
                        <TabsTrigger value="debug" className="text-xs h-7 px-3">
                          <Code className="h-3 w-3 mr-1" />
                          Debug
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
                
                {userRole === 'employee' || consoleType === 'fieldops' ? (
                  <FieldOpsAgentConsole />
                ) : (
                  viewMode === 'customer' ? (
                    <AIAgentConsole />
                  ) : (
                    <AIAgentChat />
                  )
                )}
              </div>

              {userRole !== 'employee' && consoleType === 'customer' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Customer Engagement Agents
                    </CardTitle>
                    <CardDescription>
                      Specialized AI agents that handle customer interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Engagement Agents Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <Bot className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Triage Agent
                            <Badge variant="secondary" className="text-xs">Entry Point</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Initial customer interaction, collects information, and routes to specialized agents.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Booking Agent
                            <Badge variant="secondary" className="text-xs">Scheduling</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Checks availability, finds first available slots, and schedules appointments.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <FileText className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Quoting Agent
                            <Badge variant="secondary" className="text-xs">Pricing</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Generates service quotes, provides pricing information, and presents options.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <Star className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Follow-up Agent
                            <Badge variant="secondary" className="text-xs">Feedback</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Collects customer feedback, tracks satisfaction, and handles post-service follow-up.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <ThumbsUp className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Review Agent
                            <Badge variant="secondary" className="text-xs">Reputation</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Requests customer reviews and provides links to Google, Facebook, and Yelp.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <Brain className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Knowledge Base
                            <Badge variant="secondary" className="text-xs">RAG</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Answers using your services, FAQs, business hours, and uploaded documents.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Technical Capabilities */}
                    <div className="pt-3 border-t border-border/50">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Communication Channels</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Text Chat
                          <span className="text-green-500">●</span>
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Voice Calls
                          {hasVoice && <span className="text-green-500">●</span>}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          SMS
                          {hasTwilio && <span className="text-green-500">●</span>}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          Web Widget
                          <span className="text-green-500">●</span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {canManageSettings && (
            <TabsContent value="settings" className="mt-6">
              <AIAgentSettings />
            </TabsContent>
          )}
        </Tabs>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default AIAgent;
