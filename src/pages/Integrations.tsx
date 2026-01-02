import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuickStartWizard } from '@/components/integrations/QuickStartWizard';
import { CRMConnectionSettings } from '@/components/integrations/CRMConnectionSettings';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Phone, 
  Mic,
  Mail,
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Loader2,
  Rocket,
  BookOpen,
  Calendar,
  Rss,
  Server,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl: string;
  fields: IntegrationField[];
  checkConnection: (data: Record<string, string>) => boolean;
  note?: string;
}

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  required: boolean;
  helpText?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and manage subscriptions.',
    icon: CreditCard,
    color: 'bg-purple-500',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [],
    checkConnection: () => true,
    note: '💡 Platform managed. 2.9% + $0.30 per transaction. No setup needed for your reminders.',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Voice calls and SMS messaging.',
    icon: Phone,
    color: 'bg-red-500',
    docsUrl: 'https://console.twilio.com',
    fields: [
      { key: 'twilio_account_sid', label: 'Account SID', placeholder: 'AC...', type: 'text', required: true },
      { key: 'twilio_auth_token', label: 'Auth Token', placeholder: 'Your auth token', type: 'password', required: true },
      { key: 'twilio_phone_number', label: 'Phone Number', placeholder: '+1234567890', type: 'text', required: true, helpText: 'E.164 format' },
    ],
    checkConnection: (data) => !!(data.twilio_account_sid && data.twilio_auth_token && data.twilio_phone_number),
    note: '💡 SMS ~$0.0079/msg, Voice ~$0.014/min. Required for SMS & voice reminders.',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Premium AI voice synthesis with natural emotions.',
    icon: Mic,
    color: 'bg-blue-500',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    fields: [
      { key: 'elevenlabs_api_key', label: 'API Key', placeholder: 'Your ElevenLabs API key', type: 'password', required: true, helpText: 'Get from elevenlabs.io/app/settings/api-keys' },
      { key: 'elevenlabs_agent_id', label: 'Agent ID', placeholder: 'agent_... (or paste without the agent_ prefix)', type: 'text', required: false, helpText: 'Optional: Create in ElevenLabs Conversational AI. We accept either "agent_..." or the raw id.' },
    ],
    checkConnection: (data) => !!data.elevenlabs_api_key,
    note: '💡 Best for: High-quality, emotional voices. ~$0.30/1K chars. Choose if voice quality is priority.',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email notifications and reminders.',
    icon: Mail,
    color: 'bg-emerald-500',
    docsUrl: 'https://resend.com/api-keys',
    fields: [
      { key: 'resend_api_key', label: 'API Key', placeholder: 're_...', type: 'password', required: true, helpText: 'Get from resend.com/api-keys' },
    ],
    checkConnection: (data) => !!data.resend_api_key,
    note: '💡 3,000 free emails/mo, then $0.001/email. Most cost-effective reminder channel.',
  },
];

export default function Integrations() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showQuickStart, setShowQuickStart] = useState(false);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (!companyId) throw new Error('No company ID');
      const payload = { company_id: companyId, ...data };
      if (integrations?.id) {
        const { error } = await supabase.from('tenant_integrations').update(payload).eq('id', integrations.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tenant_integrations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration saved!');
      setSelectedIntegration(null);
      setFormData({});
    },
    onError: () => toast.error('Failed to save integration'),
  });

  const handleOpenSetup = (integration: Integration) => {
    const existingData: Record<string, string> = {};
    integration.fields.forEach((field) => {
      const value = integrations?.[field.key as keyof typeof integrations];
      if (value && typeof value === 'string') existingData[field.key] = value;
    });
    setFormData(existingData);
    setSelectedIntegration(integration);
  };

  const handleSave = () => {
    if (!selectedIntegration) return;
    const missingFields = selectedIntegration.fields.filter((f) => f.required && !formData[f.key]).map((f) => f.label);
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    saveMutation.mutate(formData);
  };

  const getConnectionStatus = (integration: Integration) => {
    if (!integrations) return false;
    const data: Record<string, string> = {};
    integration.fields.forEach((field) => {
      const value = integrations[field.key as keyof typeof integrations];
      if (value && typeof value === 'string') data[field.key] = value;
    });
    return integration.checkConnection(data);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

   // Get TTS connection status
  const hasElevenLabs = !!integrations?.elevenlabs_api_key;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">Connect services to power your reminders</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setShowQuickStart(true)} className="gap-2">
              <Rocket className="w-4 h-4" />
              Quick Start
            </Button>
            
            {/* TTS Quick Setup */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Voice:</span>
                <Button
                  variant={hasElevenLabs ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs relative",
                    hasElevenLabs && "bg-green-500/10 text-green-600 border-green-500/30",
                    !hasElevenLabs && "ring-2 ring-primary/50"
                  )}
                  onClick={() => handleOpenSetup(INTEGRATIONS.find(i => i.id === 'elevenlabs')!)}
                >
                  <Mic className="w-3 h-3 mr-1" />
                  ElevenLabs
                  {hasElevenLabs && <Check className="w-3 h-3 ml-1" />}
                  {!hasElevenLabs && (
                    <Badge className="absolute -top-2 -right-2 h-4 px-1 text-[10px] bg-primary">★</Badge>
                  )}
                </Button>
              </div>
              {!hasElevenLabs && (
                <p className="text-[10px] text-muted-foreground">
                  ★ Recommended: ElevenLabs - Premium quality voices
                </p>
              )}
            </div>
          </div>
        </div>

        <QuickStartWizard
          open={showQuickStart}
          onOpenChange={setShowQuickStart}
          onComplete={() => queryClient.invalidateQueries({ queryKey: ['integrations'] })}
          hasResend={!!integrations?.resend_api_key}
          hasTwilio={!!(integrations?.twilio_account_sid && integrations?.twilio_auth_token && integrations?.twilio_phone_number)}
          hasElevenLabs={!!integrations?.elevenlabs_api_key}
        />

        {/* Setup Progress */}
        {(() => {
          const isTTSConfigured = !!integrations?.elevenlabs_api_key;
          
          const statuses = [
            { name: 'Stripe', connected: true, icon: CreditCard, color: 'bg-purple-500' },
            { name: 'Email', connected: !!integrations?.resend_api_key, icon: Mail, color: 'bg-emerald-500' },
            { name: 'SMS', connected: !!(integrations?.twilio_account_sid && integrations?.twilio_auth_token && integrations?.twilio_phone_number), icon: Phone, color: 'bg-red-500' },
            { name: 'Voice', connected: isTTSConfigured, icon: Mic, color: 'bg-blue-500' },
          ];
          const connectedCount = statuses.filter(s => s.connected).length;
          const percentage = Math.round((connectedCount / statuses.length) * 100);
          
          return (
            <Card className={cn(
              "border-border/50",
              percentage === 100 && "border-green-500/30 bg-green-500/5"
            )}>
              <CardContent className="py-4">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Setup Progress</span>
                      <span className={cn(
                        "text-sm font-bold",
                        percentage === 100 ? "text-green-600" : "text-primary"
                      )}>
                        {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <div className="flex items-center gap-3">
                    {statuses.map((status) => (
                      <div
                        key={status.name}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                          status.connected 
                            ? "bg-green-500/10 text-green-600" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <status.icon className="w-3 h-3" />
                        {status.name}
                        {status.connected && <Check className="w-3 h-3" />}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Getting Started Accordion */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="twilio">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                      <Phone className="w-3 h-3 text-white" />
                    </div>
                    Twilio Setup (Voice & SMS)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create a Twilio account at <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">twilio.com</a></li>
                    <li>Get Account SID and Auth Token from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Console</a></li>
                    <li>Purchase a phone number with Voice capabilities</li>
                    <li>Enter credentials in the Twilio card below</li>
                  </ol>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <p className="font-medium text-foreground">Voice Webhook URL:</p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value="https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming"
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText('https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming');
                          toast.success('Copied!');
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs">Set as "A CALL COMES IN" webhook (HTTP POST)</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="elevenlabs">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                      <Mic className="w-3 h-3 text-white" />
                    </div>
                    ElevenLabs Setup (AI Voice)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create an ElevenLabs account at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">elevenlabs.io</a></li>
                    <li>Go to <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → API Keys</a></li>
                    <li>Generate and copy your API key</li>
                    <li>Select voice in AI Agent → Settings</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="resend">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center">
                      <Mail className="w-3 h-3 text-white" />
                    </div>
                    Resend Setup (Email)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create a Resend account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a></li>
                    <li>Verify your email domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/domains</a></li>
                    <li>Go to <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">API Keys</a> and create a new key</li>
                    <li>Enter your API key in the Resend card below</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>


            </Accordion>
          </CardContent>
        </Card>

        {/* Integration Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map((integration) => {
            const isConnected = getConnectionStatus(integration);
            const Icon = integration.icon;
            return (
              <Card key={integration.id} className="border-border/50 relative">
                {isConnected && (
                  <Badge className="absolute top-3 right-3 bg-green-500/10 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', integration.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                  {integration.note && (
                    <p className="text-xs text-muted-foreground/80 mb-3 p-2 rounded bg-muted/50 border border-border/50">
                      {integration.note}
                    </p>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : integration.id === 'stripe' ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="/dashboard/subscription">Manage Billing</a>
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant={isConnected ? 'outline' : 'default'}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenSetup(integration)}
                      >
                        {isConnected ? 'Update' : 'Connect'}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CRM Integrations */}
        <CRMConnectionSettings />

        {/* Calendar Integrations */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Calendar</h2>
            <p className="text-sm text-muted-foreground">Sync appointments with your preferred calendar</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* ICS Feed */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-orange-500">
                    <Rss className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">ICS Feed</CardTitle>
                    <CardDescription className="text-xs">Universal, one-way sync</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">Works with Google, Apple, Outlook, and any calendar app. Free and easy to set up.</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/dashboard/integrations/calendar">
                    Set Up <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* CalDAV */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-blue-500">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">CalDAV</CardTitle>
                    <CardDescription className="text-xs">Two-way sync</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">Real-time sync for Apple Calendar, Android, and Thunderbird. Free.</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/dashboard/integrations/calendar">
                    Set Up <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Google Calendar */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-green-500">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Google Calendar
                      <Badge variant="secondary" className="text-[10px]">Premium</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">Two-way instant sync</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">OAuth-based integration with automatic updates. Requires Google Cloud setup.</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/dashboard/integrations/calendar">
                    Set Up <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {/* Setup Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', selectedIntegration.color)}>
                    <selectedIntegration.icon className="w-4 h-4 text-white" />
                  </div>
                  Connect {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>Enter your API credentials</DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4 pt-4">
              {selectedIntegration.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => togglePasswordVisibility(field.key)}
                      >
                        {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedIntegration(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
