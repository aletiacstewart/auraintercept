import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Eye, EyeOff, Loader2, Puzzle, Rss, Server, Zap } from 'lucide-react';
import { IntegrationHealthTab } from '@/components/integrations/IntegrationHealthTab';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IntegrationCard, type IntegrationStatus } from '@/components/integrations/IntegrationCard';
import { CalendarSubscription } from '@/components/integrations/CalendarSubscription';
import { CalDAVSubscription } from '@/components/integrations/CalDAVSubscription';
import { GoogleCalendarSettings } from '@/components/integrations/GoogleCalendarSettings';
import { CarrierForwardingGuide } from '@/components/integrations/CarrierForwardingGuide';
import { SignalWireSetupGuide } from '@/components/integrations/SignalWireSetupGuide';
import { ResendSetupGuide } from '@/components/integrations/ResendSetupGuide';
import { ElevenLabsSetupGuide } from '@/components/integrations/ElevenLabsSetupGuide';
import { CrmConnectionsPanel } from '@/components/integrations/CrmConnectionsPanel';
import { UploadPostPanel } from '@/components/social/UploadPostPanel';
import {
  INTEGRATIONS,
  CATEGORY_LABELS,
  resolveCategory,
  validateIntegrationField,
  type IntegrationCategory,
  type IntegrationDef,
} from '@/lib/integrationConfig';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';

const CATEGORY_ORDER: IntegrationCategory[] = ['essential', 'recommended', 'optional'];

export default function IntegrationSetupWizard() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { requiredIntegrations, label } = useIndustryConfig();

  const [active, setActive] = useState<IntegrationDef | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_integrations_safe')
        .select('*')
        .eq('company_id', companyId!)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Record<string, unknown> | null;
    },
  });

  const { data: calendarConnection } = useQuery({
    queryKey: ['calendar-connection', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('google_calendar_connections')
        .select('sync_enabled, calendar_id')
        .eq('company_id', companyId!)
        .eq('sync_enabled', true)
        .maybeSingle();
      return data;
    },
  });

  const { data: uploadPostStatus } = useQuery({
    queryKey: ['upload-post-status', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('upload-post', {
        body: { action: 'status', companyId },
      });
      if (error) throw error;
      return data as { configured?: boolean; accounts?: unknown[] } | null;
    },
  });

  const { data: crmConnections } = useQuery({
    queryKey: ['crm-connections-count', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from('crm_connections').select('status').eq('company_id', companyId!);
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      if (!companyId) throw new Error('No company');
      const existingId = integrations?.id as string | undefined;
      const payload = { company_id: companyId, ...values };
      if (existingId) {
        const { error } = await supabase.from('tenant_integrations').update(payload).eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tenant_integrations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Saved. Aura can use this now.');
      setActive(null);
      setFormData({});
    },
    onError: () => toast.error('Could not save those details'),
  });

  const statusFor = (integration: IntegrationDef): IntegrationStatus => {
    switch (integration.id) {
      case 'google_calendar':
        return calendarConnection ? 'connected' : 'not_connected';
      case 'upload_post':
        if (uploadPostStatus?.configured && (uploadPostStatus.accounts?.length ?? 0) > 0) return 'connected';
        return uploadPostStatus?.configured ? 'attention' : 'not_connected';
      case 'crm': {
        if (!crmConnections?.length) return 'not_connected';
        return crmConnections.some((c) => c.status === 'error') ? 'attention' : 'connected';
      }
      default: {
        const flags = integration.connectedFlags ?? [];
        return flags.some((f) => !!integrations?.[f]) ? 'connected' : 'not_connected';
      }
    }
  };

  const grouped = useMemo(() => {
    const map: Record<IntegrationCategory, IntegrationDef[]> = { essential: [], recommended: [], optional: [] };
    INTEGRATIONS.forEach((i) => map[resolveCategory(i, requiredIntegrations)].push(i));
    return map;
  }, [requiredIntegrations]);

  const essentialConnected = grouped.essential.filter((i) => statusFor(i) === 'connected').length;
  const essentialTotal = grouped.essential.length || 1;
  const progress = Math.round((essentialConnected / essentialTotal) * 100);

  const openSetup = (integration: IntegrationDef) => {
    if (integration.setupKind === 'credentials') {
      const existing: Record<string, string> = {};
      integration.fields.forEach((f) => {
        const v = integrations?.[f.key];
        if (typeof v === 'string') existing[f.key] = v;
      });
      setFormData(existing);
    }
    setActive(integration);
  };

  // Deep link: /dashboard/integrations?open=google_calendar
  useEffect(() => {
    const target = searchParams.get('open');
    if (!target || active) return;
    const match = INTEGRATIONS.find((i) => i.id === target);
    if (match) {
      openSetup(match);
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, integrations]);

  const handleSave = () => {
    if (!active) return;
    const missing = active.fields.filter((f) => f.required && !formData[f.key]).map((f) => f.label);
    if (missing.length) {
      toast.error(`Still needed: ${missing.join(', ')}`);
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Puzzle}
            title="Connections"
            description="Everything Aura plugs into, in one place"
            featureColor="integrations"
            showAuraBar
            auraBarPlaceholder="Ask about connections..."
          />

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs italic text-amber-700 dark:text-amber-400">
            All 3rd-party fees are set by their respective vendors and are subject to change at any time, which may affect the cost of
            those services for your company.
          </div>

          <Tabs defaultValue="connections" className="space-y-6">
            <TabsList>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="health" className="gap-2">
                <Activity className="h-4 w-4" /> Health
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-6">
              <Card className="guide-card guide-card-primary">
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">Essential setup</span>
                    <span className={cn('text-sm font-bold', progress === 100 ? 'text-green-400' : 'text-primary')}>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {essentialConnected} of {grouped.essential.length} essentials connected · tailored for {label}
                  </p>
                </CardContent>
              </Card>

              {CATEGORY_ORDER.map((category) => {
                const items = grouped[category];
                if (!items.length) return null;
                return (
                  <section key={category} className="space-y-3">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{CATEGORY_LABELS[category].title}</h2>
                      <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[category].description}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((integration) => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          status={statusFor(integration)}
                          loading={isLoading}
                          onSetup={openSetup}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

              <CarrierForwardingGuide
                auraNumber={(integrations?.signalwire_phone_number as string) || ''}
                companyId={companyId}
              />
            </TabsContent>

            <TabsContent value="health">
              <IntegrationHealthTab />
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            {active && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', active.color)}>
                      <active.icon className="h-4 w-4 text-white" />
                    </div>
                    {active.name}
                  </DialogTitle>
                  <DialogDescription>{active.description}</DialogDescription>
                </DialogHeader>

                {active.setupKind === 'calendar' && (
                  <Tabs defaultValue="google" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="google" className="gap-2">
                        <Zap className="h-4 w-4" /> Google
                      </TabsTrigger>
                      <TabsTrigger value="ics" className="gap-2">
                        <Rss className="h-4 w-4" /> Any calendar
                      </TabsTrigger>
                      <TabsTrigger value="caldav" className="gap-2">
                        <Server className="h-4 w-4" /> Apple / CalDAV
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="google">
                      <GoogleCalendarSettings />
                    </TabsContent>
                    <TabsContent value="ics">
                      <CalendarSubscription type="company" />
                    </TabsContent>
                    <TabsContent value="caldav">
                      <CalDAVSubscription type="company" />
                    </TabsContent>
                  </Tabs>
                )}

                {active.setupKind === 'social' && <UploadPostPanel />}

                {active.setupKind === 'crm' && <CrmConnectionsPanel />}

                {active.setupKind === 'credentials' && (
                  <div className="space-y-4">
                    {active.id === 'signalwire' && <SignalWireSetupGuide />}
                    {active.id === 'resend' && <ResendSetupGuide />}
                    {active.id === 'elevenlabs' && companyId && (
                      <ElevenLabsSetupGuide companyId={companyId} agentId={(integrations?.elevenlabs_agent_id as string) || undefined} />
                    )}

                    {active.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>
                          {field.label}
                          {field.required && <span className="ml-1 text-destructive">*</span>}
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
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                              onClick={() => setShowPasswords((p) => ({ ...p, [field.key]: !p[field.key] }))}
                            >
                              {showPasswords[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                        {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                      </div>
                    ))}

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setActive(null)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </DashboardLayout>
  );
}
