import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { AIAgentSettings } from '@/components/ai/AIAgentSettings';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { MarketingSalesAgentConsole } from '@/components/marketing/MarketingSalesAgentConsole';
import { AnalyticsAgentConsole } from '@/components/analytics/AnalyticsAgentConsole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Phone, MessageSquare, Calendar, Brain, CheckCircle2, XCircle, PhoneOutgoing, ExternalLink, Monitor, Code, Settings, PhoneCall, HeadphonesIcon, Briefcase, Megaphone, BarChart3, Cpu, Truck } from 'lucide-react';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';
import { TestCallDialog } from '@/components/ai/TestCallDialog';
import { Button } from '@/components/ui/button';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';

type ConsoleType = 'customer' | 'fieldops' | 'businessops' | 'marketing' | 'analytics';

const AIAgent = () => {
  const { companyId, userRole } = useAuth();
  const { isAtLeastTier } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'customer' | 'debug'>('customer');
  const [activeTab, setActiveTab] = useState<'console' | 'settings'>('console');
  
  // Get console type from URL or default to 'customer'
  const consoleParam = searchParams.get('console') as ConsoleType | null;
  const [consoleType, setConsoleType] = useState<ConsoleType>(consoleParam || 'customer');
  
  // Sync console type with URL params
  useEffect(() => {
    if (consoleParam && ['customer', 'fieldops', 'businessops', 'marketing', 'analytics'].includes(consoleParam)) {
      setConsoleType(consoleParam);
    }
  }, [consoleParam]);
  
  const handleConsoleTypeChange = (value: ConsoleType) => {
    setConsoleType(value);
    setSearchParams({ console: value });
  };
  
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
              <Tabs value={consoleType} onValueChange={(v) => handleConsoleTypeChange(v as ConsoleType)} className="mb-6">
                <TabsList className="flex-wrap h-auto gap-1">
                  <TabsTrigger value="customer">
                    <HeadphonesIcon className="h-4 w-4 mr-2" />
                    Customer Engagement
                  </TabsTrigger>
                  <TabsTrigger value="fieldops">
                    <Truck className="h-4 w-4 mr-2" />
                    Field Operations
                  </TabsTrigger>
                  <TabsTrigger value="businessops">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Business Operations
                  </TabsTrigger>
                  <TabsTrigger value="marketing">
                    <Megaphone className="h-4 w-4 mr-2" />
                    Marketing & Sales
                  </TabsTrigger>
                  {(userRole === 'platform_admin' || userRole === 'company_admin') && (
                    <TabsTrigger value="analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics & Insights
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            )}

            {/* Console with View Toggle */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">
                      {userRole === 'employee' || consoleType === 'fieldops' 
                        ? 'Field Operations Console' 
                        : consoleType === 'businessops'
                          ? 'Business Operations Console'
                          : consoleType === 'marketing'
                            ? 'Marketing & Sales Console'
                            : consoleType === 'analytics'
                              ? 'Analytics & Insights Console'
                              : 'Customer Engagement Console'}
                    </h2>
                    {canManageSettings && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/ai-agents')}
                        className="h-7"
                      >
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        Manage Agents
                      </Button>
                    )}
                  </div>
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
                ) : consoleType === 'businessops' ? (
                  <BusinessOpsAgentConsole />
                ) : consoleType === 'marketing' ? (
                  <MarketingSalesAgentConsole />
                ) : consoleType === 'analytics' ? (
                  <AnalyticsAgentConsole />
                ) : (
                  viewMode === 'customer' ? (
                    <AIAgentConsole allowCompanySelection={userRole === 'platform_admin'} />
                  ) : (
                    <AIAgentChat />
                  )
                )}
              </div>

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
