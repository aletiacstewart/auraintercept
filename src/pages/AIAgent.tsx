import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { AIAgentSettings } from '@/components/ai/AIAgentSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Phone, MessageSquare, Calendar, Brain, CheckCircle2, XCircle, PhoneOutgoing, ExternalLink, Monitor, Code, Settings, PhoneCall } from 'lucide-react';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';
import { TestCallDialog } from '@/components/ai/TestCallDialog';
import { Button } from '@/components/ui/button';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';

const AIAgent = () => {
  const { companyId } = useAuth();
  const { isAtLeastTier } = useSubscription();
  const [viewMode, setViewMode] = useState<'customer' | 'debug'>('customer');
  const [activeTab, setActiveTab] = useState<'console' | 'settings'>('console');

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

  // Get TTS provider status dynamically
  const getTTSStatus = () => {
    const provider = integrations?.tts_provider || 'elevenlabs';
    const providerConfig: Record<string, { name: string; isConfigured: boolean; setupUrl: string }> = {
      elevenlabs: {
        name: 'ElevenLabs',
        isConfigured: !!integrations?.elevenlabs_api_key,
        setupUrl: 'https://elevenlabs.io/sign-up'
      },
      openai: {
        name: 'OpenAI TTS',
        isConfigured: !!integrations?.openai_api_key,
        setupUrl: 'https://platform.openai.com/api-keys'
      },
      google: {
        name: 'Google TTS',
        isConfigured: !!integrations?.google_tts_api_key,
        setupUrl: 'https://console.cloud.google.com/apis/credentials'
      }
    };
    return providerConfig[provider] || providerConfig.elevenlabs;
  };

  const hasTwilio = !!(integrations?.twilio_account_sid && integrations?.twilio_phone_number);
  const ttsStatus = getTTSStatus();
  const hasTTS = ttsStatus.isConfigured;
  const hasVoice = hasTwilio && hasTTS;

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
                    Twilio + {ttsStatus.name} ready
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Requires Setup
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {!hasTwilio && !hasTTS 
                      ? `Configure Twilio & ${ttsStatus.name}`
                      : !hasTwilio 
                        ? 'Configure Twilio'
                        : `Configure ${ttsStatus.name}`}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {!hasTwilio && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                          Twilio <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    {!hasTTS && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <a href={ttsStatus.setupUrl} target="_blank" rel="noopener noreferrer">
                          {ttsStatus.name} <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
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
                    Requires Setup
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Configure Twilio integration
                  </p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2" asChild>
                    <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                      Sign up for Twilio <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
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
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="mt-6">
            {/* Console with View Toggle */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">AI Agent Console</h2>
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
                </div>
                
                {viewMode === 'customer' ? (
                  <AIAgentConsole />
                ) : (
                  <AIAgentChat />
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Agent Capabilities
                  </CardTitle>
                  <CardDescription>
                    What your AI agent can do
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Appointment Booking</h4>
                        <p className="text-sm text-muted-foreground">
                          Check availability, find first available slots, and book appointments based on service duration and employee schedules.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Brain className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">RAG-Powered Responses</h4>
                        <p className="text-sm text-muted-foreground">
                          Answers questions using your knowledge base including services, FAQs, business hours, and uploaded documents.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          Voice Calling
                          {hasVoice && <Badge variant="outline" className="text-xs">Live</Badge>}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          AI-powered phone conversations using Twilio for telephony and {ttsStatus.name} for natural voice synthesis.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Multi-Channel Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Works across text chat, SMS, and voice channels with consistent responses and context.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AIAgentSettings />
          </TabsContent>
        </Tabs>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default AIAgent;
