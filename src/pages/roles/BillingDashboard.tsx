import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BillingAgentConsole } from '@/components/billing/BillingAgentConsole';

export default function BillingDashboard() {
  const { user, loading: authLoading, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ['billing-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [pending, overdue, monthly] = await Promise.all([
        supabase
          .from('invoices')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'pending'),
        supabase
          .from('invoices')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'overdue'),
        supabase
          .from('invoices')
          .select('total')
          .eq('company_id', companyId)
          .eq('status', 'paid')
          .gte('paid_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      const monthlyRevenue = monthly.data?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      
      return {
        pendingInvoices: pending.count || 0,
        overdueInvoices: overdue.count || 0,
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
    <RoleDashboardLayout jobRole="billing_specialist">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing Dashboard</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingInvoices || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.overdueInvoices || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.monthlyRevenue?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full" variant="outline" onClick={() => navigate('/dashboard/invoices')}>
                Invoices
              </Button>
              <Button size="sm" className="w-full" variant="outline" onClick={() => navigate('/dashboard/quotes')}>
                Quotes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing AI Console */}
        <BillingAgentConsole companyId={companyId || undefined} />
      </div>
    </RoleDashboardLayout>
  );
}
