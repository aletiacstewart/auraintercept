import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Gift, Users, TrendingUp, BarChart3, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function MarketingDashboard() {
  const { user, loading: authLoading, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['marketing-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [campaigns, referrals, completed] = await Promise.all([
        supabase
          .from('marketing_campaigns')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'active'),
        supabase
          .from('customer_referrals')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'pending'),
        supabase
          .from('customer_referrals')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'completed'),
      ]);
      
      return {
        activeCampaigns: campaigns.count || 0,
        pendingReferrals: referrals.count || 0,
        completedReferrals: completed.count || 0,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = profileLoading || statsLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="marketing_manager">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome, {profile?.full_name || 'Marketing Manager'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Marketing Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Campaigns
              </CardTitle>
              <Megaphone className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeCampaigns ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Referrals
              </CardTitle>
              <Gift className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pendingReferrals ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting conversion</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Referrals
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.completedReferrals ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully converted</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Campaigns
              </CardTitle>
              <BarChart3 className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/campaigns')}>
                Manage
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Referrals
              </CardTitle>
              <Users className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/referrals')}>
                View All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Marketing AI Console Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Marketing AI Console</CardTitle>
            <p className="text-sm text-muted-foreground">Use AI to generate campaigns, win back customers, and manage referrals</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/ai-agent')}>
              Open AI Console
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-5">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agent')}
          >
            <Bot className="w-6 h-6 text-primary" />
            <span>AI Console</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/campaigns')}
          >
            <Megaphone className="w-6 h-6 text-secondary" />
            <span>Campaigns</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/referrals')}
          >
            <Gift className="w-6 h-6 text-accent" />
            <span>Referrals</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/analytics')}
          >
            <BarChart3 className="w-6 h-6 text-primary" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agents')}
          >
            <TrendingUp className="w-6 h-6 text-secondary" />
            <span>AI Agents Hub</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}