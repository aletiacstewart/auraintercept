import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  BookOpen,
  Calendar,
  Rss,
  Server,
  ArrowRight,
  Puzzle,
  Search,
  Lock,
  Unlock,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { getIntegrationRequirements } from '@/lib/documentationConfig';

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
    id: 'signalwire',
    name: 'SignalWire',
    description: 'Voice calls and SMS messaging.',
    icon: Phone,
    color: 'bg-blue-500',
    docsUrl: 'https://signalwire.com/signin',
    fields: [
      { key: 'signalwire_space_url', label: 'Space URL', placeholder: 'yourspace.signalwire.com', type: 'text', required: true, helpText: 'Your SignalWire space URL' },
      { key: 'signalwire_project_id', label: 'Project ID', placeholder: 'Your project ID', type: 'text', required: true },
      { key: 'signalwire_api_token', label: 'API Token', placeholder: 'Your API token', type: 'password', required: true },
      { key: 'signalwire_phone_number', label: 'Phone Number', placeholder: '+1234567890', type: 'text', required: true, helpText: 'E.164 format' },
    ],
    checkConnection: (data) => !!(data.signalwire_project_id && data.signalwire_api_token && data.signalwire_phone_number && data.signalwire_space_url),
    note: '💡 SMS ~$0.004/msg (40% cheaper), Voice ~$0.01/min. Required for SMS & voice reminders.',
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
  {
    id: 'tavily',
    name: 'Tavily AI',
    description: 'AI-powered web research for content.',
    icon: Search,
    color: 'bg-cyan-500',
    docsUrl: 'https://tavily.com',
    fields: [
      { key: 'tavily_api_key', label: 'API Key', placeholder: 'tvly-...', type: 'password', required: true, helpText: 'Get from app.tavily.com' },
    ],
    checkConnection: (data) => !!data.tavily_api_key,
    note: '💡 1,000 free searches/mo. Enhances social content with current trends.',
  },
];

export default function Integrations() {
  const { companyId, subscriptionTier } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Get tier-based integration requirements
  const integrationRequirements = getIntegrationRequirements(subscriptionTier);

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
        </div>

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

        {/* Calendar Setup Progress */}
        <div className="grid gap-4 md:grid-cols-1">
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
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/voice">Voice Setup</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/sms">SMS Setup</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/email">Email Setup</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/integrations/social">Social Media</Link>
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
            const requirement = integrationRequirements[integration.id as keyof typeof integrationRequirements];
            const isRequired = requirement?.required ?? false;
            const requirementReason = requirement?.reason ?? '';
            
            return (
              <Card key={integration.id} className={cn(
                "border-border/50 relative transition-all",
                !isRequired && !isConnected && "opacity-75"
              )}>
                {/* Status Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  {isRequired ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-border/50 text-[10px]">
                      <Unlock className="w-2.5 h-2.5 mr-1" />
                      Optional
                    </Badge>
                  )}
                  {isConnected && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">
                      <Check className="w-2.5 h-2.5 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', integration.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-1">{integration.description}</p>
                  
                  {/* Tier-specific reason */}
                  {requirementReason && (
                    <p className={cn(
                      "text-xs mb-2 italic",
                      isRequired ? "text-primary/80" : "text-muted-foreground/70"
                    )}>
                      {requirementReason}
                    </p>
                  )}
                  
                  {integration.note && (
                    <p className="text-xs text-foreground/80 mb-3 p-2 rounded bg-muted/50 border border-border/30">
                      {integration.note}
                    </p>
                  )}
                  
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant={isConnected ? 'outline' : isRequired ? 'default' : 'secondary'}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenSetup(integration)}
                      >
                        {isConnected ? 'Update' : isRequired ? 'Set Up Now' : 'Enable'}
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

        {/* CRM Integrations - Temporarily hidden, may revisit later */}
        {/* {userRole === 'platform_admin' && <CRMConnectionSettings />} */}

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
