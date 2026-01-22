import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SocialMediaSetupGuide } from '@/components/integrations/SocialMediaSetupGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Share2, Instagram, Facebook, Linkedin, Video, Building2, Check, ExternalLink, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google_business';

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  platform_account_name: string | null;
  platform_account_id: string;
  is_active: boolean;
  connected_at: string;
  last_error: string | null;
}

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  required: boolean;
  helpText?: string;
}

interface Integration {
  id: SocialPlatform;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl: string;
  fields: IntegrationField[];
  note?: string;
}

const SOCIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Publish posts to your Facebook Pages.',
    icon: Facebook,
    color: 'bg-blue-600',
    docsUrl: 'https://developers.facebook.com',
    fields: [
      { key: 'meta_app_id', label: 'App ID', placeholder: 'Your Meta App ID', type: 'text', required: true, helpText: 'Found in Meta App Dashboard → Settings → Basic' },
      { key: 'meta_app_secret', label: 'App Secret', placeholder: 'Your Meta App Secret', type: 'password', required: true, helpText: 'Keep this secret! Click "Show" in Meta dashboard to reveal' },
    ],
    note: '💡 Same Meta App is used for both Facebook and Instagram. Set up once for both platforms.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Share photos and updates to Instagram Business.',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    fields: [
      { key: 'meta_app_id', label: 'App ID', placeholder: 'Your Meta App ID', type: 'text', required: true, helpText: 'Same as Facebook - uses Meta Graph API' },
      { key: 'meta_app_secret', label: 'App Secret', placeholder: 'Your Meta App Secret', type: 'password', required: true, helpText: 'Same as Facebook - uses Meta Graph API' },
    ],
    note: '💡 Requires Instagram Business or Creator account linked to a Facebook Page.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Share updates to profiles and company pages.',
    icon: Linkedin,
    color: 'bg-blue-700',
    docsUrl: 'https://www.linkedin.com/developers',
    fields: [
      { key: 'linkedin_client_id', label: 'Client ID', placeholder: 'Your LinkedIn Client ID', type: 'text', required: true, helpText: 'Found in LinkedIn Developer App → Auth tab' },
      { key: 'linkedin_client_secret', label: 'Client Secret', placeholder: 'Your LinkedIn Client Secret', type: 'password', required: true, helpText: 'Keep this secret!' },
    ],
    note: '💡 100 free share requests/day. Uses X-Restli-Protocol-Version 2.0.0 header.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Post videos directly to TikTok.',
    icon: Video,
    color: 'bg-black',
    docsUrl: 'https://developers.tiktok.com',
    fields: [
      { key: 'tiktok_client_key', label: 'Client Key', placeholder: 'Your TikTok Client Key', type: 'text', required: true, helpText: 'Found in TikTok Developer Portal → Manage Apps' },
      { key: 'tiktok_client_secret', label: 'Client Secret', placeholder: 'Your TikTok Client Secret', type: 'password', required: true, helpText: 'Keep this secret!' },
    ],
    note: '⚠️ AI-generated content requires is_aigc: true flag (handled automatically).',
  },
  {
    id: 'google_business',
    name: 'Google Business',
    description: 'Update your Google Business Profile.',
    icon: Building2,
    color: 'bg-green-600',
    docsUrl: 'https://developers.google.com/my-business',
    fields: [
      { key: 'google_business_client_id', label: 'Client ID', placeholder: 'Your Google Client ID', type: 'text', required: true, helpText: 'From Google Cloud Console → Credentials' },
      { key: 'google_business_client_secret', label: 'Client Secret', placeholder: 'Your Google Client Secret', type: 'password', required: true, helpText: 'Keep this secret!' },
    ],
    note: '💡 Can use same Google Cloud project as Calendar integration.',
  },
];

export default function SocialMediaIntegration() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedTab, setSelectedTab] = useState<SocialPlatform>('facebook');

  // Fetch tenant integrations for API credentials
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
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

  // Fetch connected social accounts
  const { data: socialAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      return data as SocialAccount[];
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
      toast.success('Credentials saved!');
      setSelectedIntegration(null);
      setFormData({});
    },
    onError: () => toast.error('Failed to save credentials'),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast.success('Account disconnected');
    },
    onError: () => toast.error('Failed to disconnect account'),
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

  const hasCredentials = (integration: Integration) => {
    if (!integrations) return false;
    return integration.fields.every((field) => {
      if (!field.required) return true;
      const value = integrations[field.key as keyof typeof integrations];
      return value && typeof value === 'string' && value.length > 0;
    });
  };

  const getConnectedAccount = (platform: SocialPlatform) => {
    return socialAccounts?.find((acc) => acc.platform === platform && acc.is_active);
  };

  const handleConnect = async (platform: SocialPlatform) => {
    // TODO: Implement OAuth popup flow
    toast.info(`OAuth connection for ${platform} coming soon!`);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isLoading = integrationsLoading || accountsLoading;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Share2}
            title="Social Media"
            description="Connect your social accounts for automated posting"
            featureColor="integrations"
            action={
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/3rd-party-overview">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
            }
          />

          {/* Platform Tabs */}
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as SocialPlatform)}>
            <TabsList className="grid w-full grid-cols-5">
              {SOCIAL_INTEGRATIONS.map((integration) => {
                const Icon = integration.icon;
                const isConnected = !!getConnectedAccount(integration.id);
                return (
                  <TabsTrigger key={integration.id} value={integration.id} className="gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{integration.name}</span>
                    {isConnected && <Check className="w-3 h-3 text-green-500" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SOCIAL_INTEGRATIONS.map((integration) => {
              const connectedAccount = getConnectedAccount(integration.id);
              const hasKeys = hasCredentials(integration);
              const Icon = integration.icon;

              return (
                <TabsContent key={integration.id} value={integration.id} className="space-y-6">
                  {/* Setup Guide */}
                  <SocialMediaSetupGuide platform={integration.id} />

                  {/* Connection Card */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', integration.color)}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name} Connection</CardTitle>
                            <CardDescription>{integration.description}</CardDescription>
                          </div>
                        </div>
                        {connectedAccount && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* API Credentials Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">API Credentials</p>
                            <p className="text-xs text-muted-foreground">
                              {hasKeys ? 'Credentials configured' : 'Enter your developer app credentials'}
                            </p>
                          </div>
                          <Button
                            variant={hasKeys ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleOpenSetup(integration)}
                          >
                            {hasKeys ? 'Update Credentials' : 'Add Credentials'}
                          </Button>
                        </div>
                        {integration.note && (
                          <p className="text-xs text-foreground/80 p-2 rounded bg-muted border border-border">
                            {integration.note}
                          </p>
                        )}
                      </div>

                      {/* Connected Account Section */}
                      {hasKeys && (
                        <div className="border-t pt-4 space-y-3">
                          <p className="text-sm font-medium">Connected Account</p>
                          {connectedAccount ? (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', integration.color)}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {connectedAccount.platform_account_name || connectedAccount.platform_account_id}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Connected {format(new Date(connectedAccount.connected_at), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => disconnectMutation.mutate(connectedAccount.id)}
                                disabled={disconnectMutation.isPending}
                              >
                                <Unlink className="w-4 h-4 mr-1" />
                                Disconnect
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs text-muted-foreground">
                                No account connected. Click below to authorize access.
                              </p>
                              <Button
                                onClick={() => handleConnect(integration.id)}
                                className={cn('gap-2', integration.color, 'hover:opacity-90')}
                              >
                                <Icon className="w-4 h-4" />
                                Connect {integration.name}
                              </Button>
                            </div>
                          )}
                          {connectedAccount?.last_error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                              <AlertCircle className="w-4 h-4 mt-0.5" />
                              <p>{connectedAccount.last_error}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Docs Link */}
                      <div className="border-t pt-4">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                            View API Documentation <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>

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
                      {selectedIntegration.name} Credentials
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>Enter your API credentials from the developer console</DialogDescription>
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
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
