import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Receipt,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface RevenueAnalyticsProps {
  companyId: string;
}

export function RevenueAnalytics({ companyId }: RevenueAnalyticsProps) {
  // Fetch revenue stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['revenue-analytics-stats', companyId],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);
      
      const [currentPeriod, previousPeriod, allInvoices] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, total, status, created_at, paid_at')
          .eq('company_id', companyId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('invoices')
          .select('id, total, status')
          .eq('company_id', companyId)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('invoices')
          .select('id, total, status')
          .eq('company_id', companyId),
      ]);

      const currentRevenue = currentPeriod.data
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
      
      const previousRevenue = previousPeriod.data
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
      
      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const totalRevenue = allInvoices.data
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;

      const outstandingAmount = allInvoices.data
        ?.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
        .reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;

      const invoiceCount = currentPeriod.data?.length ?? 0;
      const paidCount = currentPeriod.data?.filter(i => i.status === 'paid').length ?? 0;
      const collectionRate = invoiceCount > 0 ? (paidCount / invoiceCount) * 100 : 0;

      // Average invoice value
      const avgInvoiceValue = paidCount > 0 ? currentRevenue / paidCount : 0;

      return {
        currentRevenue,
        previousRevenue,
        revenueGrowth,
        totalRevenue,
        outstandingAmount,
        invoiceCount,
        collectionRate,
        avgInvoiceValue,
      };
    },
    enabled: !!companyId,
  });

  // Fetch revenue by day (last 30 days)
  const { data: revenueByDay, isLoading: chartLoading } = useQuery({
    queryKey: ['revenue-analytics-daily', companyId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data } = await supabase
        .from('invoices')
        .select('total, paid_at, status')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgo.toISOString());

      const byDay = new Map<string, number>();
      
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), 29 - i), 'MMM dd');
        byDay.set(date, 0);
      }

      data?.forEach(invoice => {
        if (invoice.paid_at) {
          const date = format(new Date(invoice.paid_at), 'MMM dd');
          if (byDay.has(date)) {
            byDay.set(date, (byDay.get(date) || 0) + (invoice.total || 0));
          }
        }
      });

      return Array.from(byDay.entries()).map(([date, amount]) => ({
        date,
        amount,
      }));
    },
    enabled: !!companyId,
  });

  // Fetch revenue by service type
  const { data: revenueByService } = useQuery({
    queryKey: ['revenue-analytics-by-service', companyId],
    queryFn: async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('service_type, deal_value')
        .eq('company_id', companyId)
        .eq('status', 'completed');

      const byService = new Map<string, number>();
      appointments?.forEach(apt => {
        const service = apt.service_type || 'Other';
        byService.set(service, (byService.get(service) || 0) + (apt.deal_value || 0));
      });

      return Array.from(byService.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
    enabled: !!companyId,
  });

  // Export to CSV
  const handleExport = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('id, customer_name, total, status, created_at, paid_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (!data) return;

    const csv = [
      ['Invoice ID', 'Customer', 'Amount', 'Status', 'Created', 'Paid'],
      ...data.map(i => [
        i.id,
        i.customer_name || 'N/A',
        `$${(i.total || 0).toFixed(2)}`,
        i.status,
        i.created_at ? format(new Date(i.created_at), 'yyyy-MM-dd') : 'N/A',
        i.paid_at ? format(new Date(i.paid_at), 'yyyy-MM-dd') : 'N/A',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Revenue Analytics</h3>
          <p className="text-sm text-muted-foreground">Track revenue trends and payment performance</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30 days)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(stats?.currentRevenue ?? 0).toLocaleString()}
                </div>
                <div className={`flex items-center text-xs ${(stats?.revenueGrowth ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(stats?.revenueGrowth ?? 0) >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stats?.revenueGrowth ?? 0).toFixed(1)}% vs last period
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-500">
                  ${(stats?.outstandingAmount ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Pending collection</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.collectionRate ?? 0).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">Invoices paid</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Invoice</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(stats?.avgInvoiceValue ?? 0).toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Revenue Trend (30 Days)</CardTitle>
            <CardDescription>Daily revenue from paid invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByDay}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Top performing services</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByService && revenueByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByService}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueByService.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No service revenue data
              </div>
            )}
            <div className="mt-4 space-y-2">
              {revenueByService?.map((service, index) => (
                <div key={service.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="truncate max-w-[120px]">{service.name}</span>
                  </div>
                  <span className="font-medium">${service.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
