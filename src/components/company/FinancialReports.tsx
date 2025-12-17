import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, FileText, Download, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function FinancialReports() {
  const { companyId } = useAuth();

  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-reports', companyId],
    queryFn: async () => {
      const now = new Date();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM'),
        };
      });

      // Fetch invoices for revenue data
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, status, paid_at, created_at')
        .eq('company_id', companyId)
        .gte('created_at', last6Months[0].start.toISOString());

      // Fetch quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select('total_amount, status, created_at')
        .eq('company_id', companyId)
        .gte('created_at', last6Months[0].start.toISOString());

      // Calculate monthly revenue
      const monthlyRevenue = last6Months.map(month => {
        const monthInvoices = invoices?.filter(inv => {
          const date = new Date(inv.created_at);
          return date >= month.start && date <= month.end;
        }) || [];
        
        const paid = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        const outstanding = monthInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        return {
          month: month.label,
          paid,
          outstanding,
        };
      });

      // Quote conversion stats
      const quoteStats = {
        total: quotes?.length || 0,
        accepted: quotes?.filter(q => q.status === 'accepted').length || 0,
        pending: quotes?.filter(q => q.status === 'pending').length || 0,
        declined: quotes?.filter(q => q.status === 'declined').length || 0,
      };

      // Invoice status breakdown
      const invoiceStats = {
        total: invoices?.length || 0,
        paid: invoices?.filter(i => i.status === 'paid').length || 0,
        pending: invoices?.filter(i => i.status === 'pending').length || 0,
        overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
      };

      const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const outstandingAmount = invoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0;

      return {
        monthlyRevenue,
        quoteStats,
        invoiceStats,
        totalRevenue,
        outstandingAmount,
      };
    },
    enabled: !!companyId,
  });

  const exportCSV = () => {
    if (!financialData) return;
    
    const rows = [
      ['Month', 'Paid Revenue', 'Outstanding'],
      ...financialData.monthlyRevenue.map(m => [m.month, m.paid.toString(), m.outstanding.toString()]),
    ];
    
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-64" />)}</div>;
  }

  const quoteChartData = [
    { name: 'Accepted', value: financialData?.quoteStats.accepted || 0 },
    { name: 'Pending', value: financialData?.quoteStats.pending || 0 },
    { name: 'Declined', value: financialData?.quoteStats.declined || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue (6mo)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              ${(financialData?.totalRevenue || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              ${(financialData?.outstandingAmount || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quote Conversion</CardDescription>
            <CardTitle className="text-2xl">
              {financialData?.quoteStats.total ? 
                Math.round((financialData.quoteStats.accepted / financialData.quoteStats.total) * 100) : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invoices Paid</CardDescription>
            <CardTitle className="text-2xl">
              {financialData?.invoiceStats.paid || 0} / {financialData?.invoiceStats.total || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Last 6 months revenue breakdown</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="paid" fill="hsl(var(--primary))" name="Paid" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outstanding" fill="hsl(var(--muted-foreground))" name="Outstanding" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quote Conversion */}
      {quoteChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Quote Conversion Funnel
            </CardTitle>
            <CardDescription>Breakdown of quote statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={quoteChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {quoteChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
