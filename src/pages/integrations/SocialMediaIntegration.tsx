import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { PlatformCredentialsSettings } from '@/components/integrations/PlatformCredentialsSettings';
import { UploadPostPanel } from '@/components/social/UploadPostPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  AlertCircle,
  Unlink,
  Copy,
  Sparkles,
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

const PLATFORM_META: Record<SocialPlatform, { name: string; icon: React.ElementType; color: string }> = {
  facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  tiktok: { name: 'TikTok', icon: Video, color: 'bg-black' },
  google_business: { name: 'Google Business', icon: Building2, color: 'bg-green-600' },
};

export default function SocialMediaIntegration() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  // Company branding for the Upload-Post connect page
  const { data: company } = useQuery({
    queryKey: ['company-logo', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', companyId)
        .maybeSingle();
      return data as { logo_url: string | null } | null;
    },
    enabled: !!companyId,
  });

  // Legacy direct connections (grandfathered)
  const { data: socialAccounts } = useQuery({
    queryKey: ['social-accounts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, platform, platform_account_id, platform_account_name, connected_at, last_error, is_active')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as SocialAccount[];
    },
    enabled: !!companyId,
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

  const legacyAccounts = socialAccounts ?? [];

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Share2}
            title="Social Media"
            description="Connect your social accounts once through Upload-Post, then let your Social Media agent publish automatically"
            featureColor="integrations"
            action={
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/3rd-party-overview">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
            }
          />

          {/* Primary path: Upload-Post */}
          <UploadPostPanel companyId={companyId} companyLogoUrl={company?.logo_url} />

          {/* Fallback: Copy & Post */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/15">
                  <Copy className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Copy &amp; Post (no setup)</CardTitle>
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 bg-green-500/10 mt-0.5">
                    Included on every plan
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-xs">
                Prefer to stay hands-on? Aura writes each post for you, you copy it with one click and paste it into the platform's composer. Nothing to connect.
              </CardDescription>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  AI writes platform-specific content
                </div>
                <div className="flex items-center gap-2">
                  <Copy className="w-3 h-3 text-primary" />
                  One-click copy from the Schedule Queue
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3 h-3 text-primary" />
                  Opens the platform composer directly
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-primary" />
                  Mark as posted to track results
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-500/30 text-green-700 hover:bg-green-500/10"
                asChild
              >
                <Link to="/dashboard/ai-consoles/social-media">Go to Social Media Console →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Legacy direct connections, only if any remain */}
          {legacyAccounts.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Previously connected accounts</CardTitle>
                <CardDescription className="text-xs">
                  These accounts were linked with your own developer app and still work. New connections now go through Upload-Post above.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {legacyAccounts.map((account) => {
                  const meta = PLATFORM_META[account.platform] ?? {
                    name: account.platform,
                    icon: Share2,
                    color: 'bg-muted',
                  };
                  const Icon = meta.icon;
                  return (
                    <div key={account.id} className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', meta.color)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {account.platform_account_name || account.platform_account_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {meta.name} · connected {format(new Date(account.connected_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => disconnectMutation.mutate(account.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          <Unlink className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                      {account.last_error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4 mt-0.5" />
                          <p>{account.last_error}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Platform-wide developer credentials (platform admin only) */}
          <PlatformCredentialsSettings />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
