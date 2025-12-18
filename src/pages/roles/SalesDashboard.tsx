import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, DollarSign, UserPlus, TrendingUp, Phone, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function SalesDashboard() {
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
    queryKey: ['sales-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [quotes, pending, converted] = await Promise.all([
        supabase
          .from('quotes')
          .select('id, total_amount', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('quotes')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'pending'),
        supabase
          .from('quotes')
          .select('total_amount')
          .eq('company_id', companyId)
          .eq('status', 'accepted')
          .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      const totalConvertedValue = converted.data?.reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;
      
      return {
        monthlyQuotes: quotes.count || 0,
        pendingQuotes: pending.count || 0,
        convertedValue: totalConvertedValue,
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
    <RoleDashboardLayout jobRole="sales_rep">
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
                Welcome, {profile?.full_name || 'Sales Rep'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Sales Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Quotes
              </CardTitle>
              <FileText className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.monthlyQuotes ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Created this month</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Quotes
              </CardTitle>
              <DollarSign className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pendingQuotes ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Converted Value
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${stats?.convertedValue?.toLocaleString() ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quotes
              </CardTitle>
              <FileText className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/quotes')}>
                Manage
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Console
              </CardTitle>
              <Bot className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/ai-agent')}>
                Open
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sales AI Console Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Sales AI Console</CardTitle>
            <p className="text-sm text-muted-foreground">Use AI to generate quotes, follow up leads, and close deals</p>
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
            onClick={() => navigate('/dashboard/quotes')}
          >
            <FileText className="w-6 h-6 text-secondary" />
            <span>Quotes</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/calls')}
          >
            <Phone className="w-6 h-6 text-accent" />
            <span>Call History</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/analytics')}
          >
            <TrendingUp className="w-6 h-6 text-primary" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agents')}
          >
            <UserPlus className="w-6 h-6 text-secondary" />
            <span>AI Agents Hub</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}