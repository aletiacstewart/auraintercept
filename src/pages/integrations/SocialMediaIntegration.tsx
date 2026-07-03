import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SocialMediaSetupGuide } from '@/components/integrations/SocialMediaSetupGuide';
import { PlatformCredentialsSettings } from '@/components/integrations/PlatformCredentialsSettings';
import { TenantSocialCredentialsForm } from '@/components/integrations/TenantSocialCredentialsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  Video,
  Building2,
  Check,
  ExternalLink,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Unlink,
  Copy,
  Settings2,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
} from 'lucide-react';
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
  const [expandedOwnApi, setExpandedOwnApi] = useState<SocialPlatform | null>(null);

  const isPlatformAdmin = userRole === 'platform_admin';

  // Fetch connected social accounts
  const { data: socialAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, company_id, platform, platform_account_id, platform_account_name, platform_page_id, connected_by, connected_at, last_used_at, last_error, is_active, permissions_granted, created_at, updated_at')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!companyId,
  });

  // Fetch tenant credentials to determine if own API is configured
  const { data: tenantCreds } = useQuery({
    queryKey: ['tenant-integrations-status', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('meta_app_id, linkedin_client_id, tiktok_client_key, google_business_client_id')
        .eq('company_id', companyId)
        .maybeSingle();
      return data as Record<string, string | null> | null;
    },
    enabled: !!companyId,
  });

  const hasOwnApiCredentials = (platform: SocialPlatform): boolean => {
    if (!tenantCreds) return false;
    switch (platform) {
      case 'facebook':
      case 'instagram':
        return !!(tenantCreds.meta_app_id);
      case 'linkedin':
        return !!(tenantCreds.linkedin_client_id);
      case 'tiktok':
        return !!(tenantCreds.tiktok_client_key);
      case 'google_business':
        return !!(tenantCreds.google_business_client_id);
      default:
        return false;
    }
  };

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

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error('You must be signed in to connect a social account');
        setConnectingPlatform(null);
        return;
      }

      const res = await fetch(
        `${supabaseUrl}/functions/v1/social-oauth?action=init&platform=${platform}&company_id=${companyId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        setConnectingPlatform(null);
        return;
      }

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
            description="Post content with the Manual Bridge or connect your own developer app for automatic posting"
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
              const hasOwnCreds = hasOwnApiCredentials(integration.id);
              const isOwnApiExpanded = expandedOwnApi === integration.id;

              return (
                <TabsContent key={integration.id} value={integration.id} className="space-y-6">

                  {/* Posting Method Choice */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base">Choose Your Posting Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Manual Bridge Card */}
                      <Card className="border-green-500/30 bg-green-500/5">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-500/15">
                              <Copy className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">Manual Bridge</CardTitle>
                              <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 bg-green-500/10 mt-0.5">
                                ✅ Available Now
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <CardDescription className="text-xs">
                            AI generates your platform-specific content. You copy it with one click and post it directly in the platform's composer — no API approval needed.
                          </CardDescription>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3 h-3 text-primary" />
                              AI generates platform-specific content
                            </div>
                            <div className="flex items-center gap-2">
                              <Copy className="w-3 h-3 text-primary" />
                              Copy with one click from the Schedule Queue
                            </div>
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-3 h-3 text-primary" />
                              Opens {integration.name} composer directly
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-primary" />
                              Mark as posted to track in dashboard
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-green-500/30 text-green-700 hover:bg-green-500/10"
                            asChild
                          >
                            <Link to="/dashboard/ai-consoles/social-media">
                              Go to Social Media Console →
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Own API Setup Card */}
                      <Card className={cn(
                        'border-border/50',
                        hasOwnCreds && 'border-primary/30 bg-primary/5'
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-muted">
                                <Settings2 className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <CardTitle className="text-sm">Own API Credentials</CardTitle>
                                <Badge variant="outline" className="text-[10px] mt-0.5">
                                  ⚙️ Advanced
                                </Badge>
                              </div>
                            </div>
                            {hasOwnCreds && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Configured
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <CardDescription className="text-xs">
                            Register your own developer app on {integration.name}, enter your credentials below, then connect via OAuth for fully automatic posting.
                          </CardDescription>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Settings2 className="w-3 h-3" />
                              Register app at {integration.name} Developer Portal
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3 h-3" />
                              Enter Client ID & Secret below
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3" />
                              Connect via OAuth for automatic posting
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setExpandedOwnApi(isOwnApiExpanded ? null : integration.id)}
                          >
                            {isOwnApiExpanded ? (
                              <><ChevronUp className="w-3 h-3 mr-1" /> Hide Setup</>
                            ) : (
                              <><Settings2 className="w-3 h-3 mr-1" /> {hasOwnCreds ? 'Update Credentials' : 'Set Up Own API'}</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Manual Bridge Active Banner */}
                    <Alert className="border-emerald-500/30 bg-emerald-500/5">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-400">
                        <strong>✓ Manual Bridge — Active by default:</strong> Aura generates your post and copies it to your clipboard with one click; you paste it into the platform's composer (deep link opens automatically). No developer setup required. Want full automation? Use "Set Up Own API" below to register your own developer app and connect via OAuth.
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* Own API Expanded Section */}
                  {isOwnApiExpanded && (
                    <div className="space-y-6 border rounded-xl p-4 bg-muted/20">
                      {/* Developer Setup Guide */}
                      <SocialMediaSetupGuide platform={integration.id} />

                      {/* Credentials Form */}
                      <TenantSocialCredentialsForm
                        companyId={companyId!}
                        platform={integration.id}
                        onSaved={() => {
                          queryClient.invalidateQueries({ queryKey: ['tenant-integrations-status'] });
                        }}
                      />

                      {/* OAuth Connect Section */}
                      {hasOwnCreds && (
                        <Card className="border-border/50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', integration.color)}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{integration.name} OAuth Connection</CardTitle>
                                  <CardDescription>Connect your account using your own app credentials</CardDescription>
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
                                  Click to authorize access via OAuth using your own app credentials.
                                </p>
                              </div>
                            )}
                            <div className="border-t pt-4">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                                  View API Documentation <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
