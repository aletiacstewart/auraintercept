import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Phone, MessageSquare, Calendar, Brain, CheckCircle2, XCircle, PhoneOutgoing } from 'lucide-react';
import { OutboundCallDialog } from '@/components/calls/OutboundCallDialog';

const AIAgent = () => {
  const { companyId } = useAuth();

  // Check integration status
  const { data: integrations } = useQuery({
    queryKey: ['integrations-status', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('twilio_account_sid, twilio_phone_number, elevenlabs_api_key')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const hasTwilio = !!(integrations?.twilio_account_sid && integrations?.twilio_phone_number);
  const hasElevenLabs = !!integrations?.elevenlabs_api_key;
  const hasVoice = hasTwilio && hasElevenLabs;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Agent</h1>
            <p className="text-muted-foreground mt-1">
              Test and monitor your AI-powered virtual assistant
            </p>
          </div>
          {hasVoice && (
            <OutboundCallDialog
              trigger={
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <PhoneOutgoing className="w-4 h-4" />
                  Make Outbound Call
                </button>
              }
            />
          )}
        </div>

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
                    Twilio + ElevenLabs ready
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Requires Setup
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {!hasTwilio && !hasElevenLabs 
                      ? 'Configure Twilio & ElevenLabs'
                      : !hasTwilio 
                        ? 'Configure Twilio'
                        : 'Configure ElevenLabs'}
                  </p>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AIAgentChat />

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
                      AI-powered phone conversations using Twilio for telephony and ElevenLabs for natural voice synthesis.
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
      </div>
    </DashboardLayout>
  );
};

export default AIAgent;
