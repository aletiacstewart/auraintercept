import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, FileBarChart, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AnalyticsDashboard() {
  const { user, loading: authLoading, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ['analytics-manager-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [appointments, revenue] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('datetime', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('invoices')
          .select('total')
          .eq('company_id', companyId)
          .eq('status', 'paid')
          .gte('paid_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      const monthlyRevenue = revenue.data?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      
      return {
        monthlyAppointments: appointments.count || 0,
        monthlyRevenue,
      };
    },
    enabled: !!companyId,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="analytics_manager">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Business intelligence and forecasting</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.monthlyAppointments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.monthlyRevenue?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/analytics')}>
                View
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/ai-agent')}>
                AI Console
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics AI Console</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Use AI to generate reports, run forecasts, and analyze business data.</p>
            <Button onClick={() => navigate('/dashboard/ai-agent')}>
              Open AI Console
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardLayout>
  );
}
