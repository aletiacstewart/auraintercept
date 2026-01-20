import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuickStartWizard } from '@/components/integrations/QuickStartWizard';
import { CRMConnectionSettings } from '@/components/integrations/CRMConnectionSettings';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
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
  Users,
  Puzzle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

// CRM Provider display names
const CRM_PROVIDER_NAMES: Record<string, string> = {
  salesforce: 'Salesforce',
  hubspot: 'HubSpot',
  zoho: 'Zoho CRM',
  pipedrive: 'Pipedrive',
  freshsales: 'Freshsales',
};

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
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', placeholder: 'pk_live_... or pk_test_...', type: 'text', required: true },
      { key: 'stripe_secret_key', label: 'Secret Key', placeholder: 'sk_live_... or sk_test_...', type: 'password', required: true },
      { key: 'stripe_webhook_secret', label: 'Webhook Secret (Optional)', placeholder: 'whsec_...', type: 'password', required: false },
    ],
    checkConnection: (data) => !!(data.stripe_publishable_key && data.stripe_secret_key),
    note: '💡 Set up your own Stripe account. 2.9% + $0.30 per transaction. Required for invoice payments.',
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
  const { companyId, userRole } = useAuth();
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

  // Fetch CRM connection status
  const { data: crmConnection } = useQuery({
    queryKey: ['crm-connection', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('crm_connections')
        .select('provider, status')
        .eq('company_id', companyId)
        .eq('status', 'connected')
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch Google Calendar connection status
  const { data: calendarConnection } = useQuery({
    queryKey: ['calendar-connection', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('google_calendar_connections')
        .select('sync_enabled, calendar_id')
        .eq('company_id', companyId)
        .eq('sync_enabled', true)
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
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <PageHeader
            icon={Puzzle}
            title="3rd Party Overview"
            description="Connect services to power your AI agents"
            featureColor="integrations"
            showAuraBar
          />
          <Button onClick={() => setShowQuickStart(true)} className="gap-2">
            <Rocket className="w-4 h-4" />
            Quick Start
          </Button>
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
          const isStripeConfigured = !!(integrations?.stripe_publishable_key && integrations?.stripe_secret_key);
          
          const statuses = [
            { name: 'Stripe', connected: isStripeConfigured, icon: CreditCard, color: 'bg-purple-500' },
            { name: 'Email', connected: !!integrations?.resend_api_key, icon: Mail, color: 'bg-emerald-500' },
            { name: 'SMS', connected: !!(integrations?.twilio_account_sid && integrations?.twilio_auth_token && integrations?.twilio_phone_number), icon: Phone, color: 'bg-red-500' },
            { name: 'Voice', connected: isTTSConfigured, icon: Mic, color: 'bg-blue-500' },
          ];
          const connectedCount = statuses.filter(s => s.connected).length;
          const percentage = Math.round((connectedCount / statuses.length) * 100);
          
          return (
            <Card className="guide-card guide-card-primary">
              <CardContent className="py-4">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Setup Progress</span>
                      <span className={cn(
                        "text-sm font-bold",
                        percentage === 100 ? "text-green-400" : "text-primary"
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
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-slate-600/50 text-white/70"
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

        {/* CRM & Calendar Setup Progress */}
        <div className={cn("grid gap-4", userRole === 'platform_admin' ? "md:grid-cols-2" : "md:grid-cols-1")}>
          {/* CRM Setup Progress - Platform Admin Only */}
          {userRole === 'platform_admin' && (
            <Card className="guide-card guide-card-crm">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-card-foreground/70" />
                        <span className="text-sm font-medium text-card-foreground">CRM Integration</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-card-foreground/30 text-card-foreground/60">Optional</Badge>
                      </div>
                      <span className={cn(
                        "text-sm font-bold",
                        crmConnection ? "text-green-400" : "text-card-foreground/50"
                      )}>
                        {crmConnection ? '100%' : '0%'}
                      </span>
                    </div>
                    <Progress value={crmConnection ? 100 : 0} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    {crmConnection ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <Users className="w-3 h-3" />
                        {CRM_PROVIDER_NAMES[crmConnection.provider] || crmConnection.provider}
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <Button variant="outline-card" size="sm" asChild>
                        <Link to="/dashboard/integrations/crm">
                          Connect CRM <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Setup Progress */}
          <Card className="guide-card guide-card-calendar">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-card-foreground/70" />
                      <span className="text-sm font-medium text-card-foreground">Calendar Sync</span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      calendarConnection ? "text-green-400" : "text-card-foreground/50"
                    )}>
                      {calendarConnection ? '100%' : '0%'}
                    </span>
                  </div>
                  <Progress value={calendarConnection ? 100 : 0} className="h-2" />
                </div>
                <div className="flex items-center gap-2">
                  {calendarConnection ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      <Calendar className="w-3 h-3" />
                      Google Calendar
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <Button variant="outline-card" size="sm" asChild>
                      <Link to="/dashboard/integrations/calendar">
                        Set Up Calendar <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started - Simplified link to sub-pages */}
        <Card className="border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Need help setting up?</p>
                  <p className="text-sm text-muted-foreground">Detailed setup guides available on each integration page</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/voice">Voice Setup</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/sms">SMS Setup</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/email">Email Setup</Link>
                </Button>
              </div>
            </div>
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
                    <p className="text-xs text-white/80 mb-3 p-2 rounded bg-slate-600/50 border border-slate-500/30">
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

        {/* CRM Integrations - Platform Admin Only */}
        {userRole === 'platform_admin' && <CRMConnectionSettings />}

        {/* Calendar Integrations */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Calendar</h2>
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
      </PageContainer>
    </DashboardLayout>
  );
}
