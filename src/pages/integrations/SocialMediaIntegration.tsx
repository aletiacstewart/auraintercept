import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SocialMediaSetupGuide } from '@/components/integrations/SocialMediaSetupGuide';
import { PlatformCredentialsSettings } from '@/components/integrations/PlatformCredentialsSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Share2, Instagram, Facebook, Linkedin, Video, Building2, Check, ExternalLink, Loader2, ArrowLeft, AlertCircle, Unlink } from 'lucide-react';
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

interface Integration {
  id: SocialPlatform;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl: string;
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
    note: '💡 Same Meta App is used for both Facebook and Instagram.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Share photos and updates to Instagram Business.',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    note: '💡 Requires Instagram Business or Creator account linked to a Facebook Page.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Share updates to profiles and company pages.',
    icon: Linkedin,
    color: 'bg-blue-700',
    docsUrl: 'https://www.linkedin.com/developers',
    note: '💡 100 free share requests/day.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Post videos directly to TikTok.',
    icon: Video,
    color: 'bg-black',
    docsUrl: 'https://developers.tiktok.com',
    note: '⚠️ AI-generated content requires is_aigc: true flag (handled automatically).',
  },
  {
    id: 'google_business',
    name: 'Google Business',
    description: 'Update your Google Business Profile.',
    icon: Building2,
    color: 'bg-green-600',
    docsUrl: 'https://developers.google.com/my-business',
    note: '💡 Can use same Google Cloud project as Calendar integration.',
  },
];

export default function SocialMediaIntegration() {
  const { companyId, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<SocialPlatform>('facebook');
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

  const isPlatformAdmin = userRole === 'platform_admin';

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

  // Check if platform credentials are configured (for platform admins)
  const { data: platformSettings } = useQuery({
    queryKey: ['platform-settings-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key');
      if (error) return [];
      return data || [];
    },
    enabled: isPlatformAdmin,
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

  const getConnectedAccount = (platform: SocialPlatform) => {
    return socialAccounts?.find((acc) => acc.platform === platform && acc.is_active);
  };

  // Listen for OAuth popup messages
  const handleOAuthMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'social-oauth-success') {
      toast.success(`${event.data.platform} connected successfully!`);
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setConnectingPlatform(null);
    } else if (event.data?.type === 'social-oauth-error') {
      toast.error(`Connection failed: ${event.data.error}`);
      setConnectingPlatform(null);
    }
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [handleOAuthMessage]);

  const handleConnect = async (platform: SocialPlatform) => {
    if (!companyId) {
      toast.error('No company selected');
      return;
    }

    setConnectingPlatform(platform);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUri = `${supabaseUrl}/functions/v1/social-oauth?action=callback`;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/social-oauth?action=init&platform=${platform}&company_id=${companyId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        setConnectingPlatform(null);
        return;
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        data.url,
        `social-oauth-${platform}`,
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );
    } catch (error) {
      console.error('OAuth init error:', error);
      toast.error('Failed to start connection. Please try again.');
      setConnectingPlatform(null);
    }
  };

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

          {/* Platform Credentials Settings (Platform Admin Only) */}
          <PlatformCredentialsSettings />

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
              const Icon = integration.icon;
              const isConnecting = connectingPlatform === integration.id;

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
                      {/* Connected Account or Connect Button */}
                      {connectedAccount ? (
                        <div className="space-y-3">
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
                          {connectedAccount.last_error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                              <AlertCircle className="w-4 h-4 mt-0.5" />
                              <p>{connectedAccount.last_error}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {integration.note && (
                            <p className="text-xs text-foreground/80 p-2 rounded bg-muted border border-border">
                              {integration.note}
                            </p>
                          )}
                          <Button
                            onClick={() => handleConnect(integration.id)}
                            className={cn('gap-2', integration.color, 'hover:opacity-90')}
                            disabled={isConnecting}
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Icon className="w-4 h-4" />
                                Connect {integration.name}
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Click to authorize access via OAuth. A popup will open for you to sign in and grant permissions.
                          </p>
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
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
