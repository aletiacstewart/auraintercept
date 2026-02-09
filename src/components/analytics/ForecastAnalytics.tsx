import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Download,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, addDays, subMonths } from 'date-fns';

interface ForecastAnalyticsProps {
  companyId: string;
}

export function ForecastAnalytics({ companyId }: ForecastAnalyticsProps) {
  // Fetch historical data for forecasting
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['forecast-analytics-historical', companyId],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const [appointments, invoices] = await Promise.all([
        supabase
          .from('appointments')
          .select('datetime, status, service_type, deal_value')
          .eq('company_id', companyId)
          .gte('datetime', sixMonthsAgo.toISOString()),
        supabase
          .from('invoices')
          .select('total, status, created_at, paid_at')
          .eq('company_id', companyId)
          .gte('created_at', sixMonthsAgo.toISOString()),
      ]);

      // Group by month for trend analysis
      const monthlyData = new Map<string, { appointments: number; revenue: number; avgValue: number }>();
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(date, 'MMM yyyy');
        monthlyData.set(key, { appointments: 0, revenue: 0, avgValue: 0 });
      }

      appointments.data?.forEach(apt => {
        const key = format(parseUTCDateTime(apt.datetime), 'MMM yyyy');
        if (monthlyData.has(key)) {
          const existing = monthlyData.get(key)!;
          existing.appointments++;
          existing.revenue += apt.deal_value || 0;
        }
      });

      invoices.data?.filter(i => i.status === 'paid').forEach(inv => {
        const key = format(new Date(inv.paid_at || inv.created_at!), 'MMM yyyy');
        if (monthlyData.has(key)) {
          const existing = monthlyData.get(key)!;
          existing.revenue += inv.total || 0;
        }
      });

      // Calculate averages
      monthlyData.forEach((value) => {
        value.avgValue = value.appointments > 0 ? value.revenue / value.appointments : 0;
      });

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));
    },
    enabled: !!companyId,
  });

  // Generate forecast based on historical trends
  const { data: forecast } = useQuery({
    queryKey: ['forecast-analytics-projection', companyId, historicalData],
    queryFn: async () => {
      if (!historicalData || historicalData.length < 3) {
        return null;
      }

      // Simple linear regression for forecasting
      const recentMonths = historicalData.slice(-3);
      const avgGrowthRate = recentMonths.length > 1 
        ? recentMonths.reduce((sum, m, i, arr) => {
            if (i === 0) return 0;
            const prevRevenue = arr[i - 1].revenue || 1;
            return sum + ((m.revenue - prevRevenue) / prevRevenue);
          }, 0) / (recentMonths.length - 1)
        : 0.05; // Default 5% growth

      const lastMonth = recentMonths[recentMonths.length - 1];
      const avgAppointments = recentMonths.reduce((sum, m) => sum + m.appointments, 0) / recentMonths.length;

      // Generate next 3 months forecast
      const projections = [];
      let currentRevenue = lastMonth.revenue;
      let currentAppointments = lastMonth.appointments;
      
      for (let i = 1; i <= 3; i++) {
        const futureDate = addDays(new Date(), i * 30);
        currentRevenue *= (1 + avgGrowthRate);
        currentAppointments = Math.round(avgAppointments * (1 + avgGrowthRate * 0.5));
        
        projections.push({
          month: format(futureDate, 'MMM yyyy'),
          appointments: currentAppointments,
          revenue: Math.round(currentRevenue),
          avgValue: currentAppointments > 0 ? Math.round(currentRevenue / currentAppointments) : 0,
          isProjection: true,
        });
      }

      return {
        projections,
        growthRate: avgGrowthRate * 100,
        projectedMonthlyRevenue: Math.round(currentRevenue),
        projectedMonthlyAppointments: currentAppointments,
      };
    },
    enabled: !!historicalData && historicalData.length > 0,
  });

  // Combine historical and forecast data
  const chartData = historicalData ? [
    ...historicalData,
    ...(forecast?.projections || []),
  ] : [];

  // Capacity planning metrics
  const { data: capacityData } = useQuery({
    queryKey: ['forecast-analytics-capacity', companyId],
    queryFn: async () => {
      const { data: employees } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId);

      // Count all employees as potential service providers
      const technicianCount = employees?.length ?? 0;

      // Assume 8 appointments per technician per day, 22 working days
      const maxMonthlyCapacity = technicianCount * 8 * 22;
      
      const currentAppointments = historicalData?.[historicalData.length - 1]?.appointments ?? 0;
      const utilizationRate = maxMonthlyCapacity > 0 
        ? (currentAppointments / maxMonthlyCapacity) * 100 
        : 0;

      return {
        technicianCount,
        maxMonthlyCapacity,
        currentUtilization: utilizationRate,
        recommendedHires: utilizationRate > 80 ? Math.ceil((utilizationRate - 80) / 10) : 0,
      };
    },
    enabled: !!companyId && !!historicalData,
  });

  // Export function
  const handleExport = () => {
    if (!chartData) return;

    const csv = [
      ['Month', 'Appointments', 'Revenue', 'Avg Value', 'Type'],
      ...chartData.map(d => [
        d.month,
        d.appointments.toString(),
        `$${d.revenue.toLocaleString()}`,
        `$${d.avgValue.toFixed(0)}`,
        d.isProjection ? 'Forecast' : 'Historical',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand-forecast-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Demand Forecast</h3>
          <p className="text-sm text-muted-foreground">Revenue and capacity projections based on historical trends</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Forecast Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(forecast?.growthRate ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(forecast?.growthRate ?? 0) >= 0 ? '+' : ''}{(forecast?.growthRate ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Monthly average</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(forecast?.projectedMonthlyRevenue ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Next month forecast</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${
                  (capacityData?.currentUtilization ?? 0) > 90 ? 'text-red-500' : 
                  (capacityData?.currentUtilization ?? 0) > 70 ? 'text-amber-500' : 'text-green-500'
                }`}>
                  {(capacityData?.currentUtilization ?? 0).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">Current load</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recommended Hires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {capacityData?.recommendedHires ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {capacityData?.technicianCount ?? 0} current technicians
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Revenue Trend & Forecast</CardTitle>
          <CardDescription>Historical data with 3-month projection (dashed line)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px]" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `$${value.toLocaleString()}`,
                    props.payload.isProjection ? 'Forecast Revenue' : 'Actual Revenue'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#forecastGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Appointments Forecast */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Appointment Volume Forecast</CardTitle>
            <CardDescription>Monthly appointment projections</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--secondary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Capacity Planning</CardTitle>
            <CardDescription>Resource allocation recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Capacity</span>
                <span className="font-medium">{capacityData?.maxMonthlyCapacity ?? 0} appts/month</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    (capacityData?.currentUtilization ?? 0) > 90 ? 'bg-red-500' : 
                    (capacityData?.currentUtilization ?? 0) > 70 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(capacityData?.currentUtilization ?? 0, 100)}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-2xl font-bold">{capacityData?.technicianCount ?? 0}</div>
                <p className="text-xs text-muted-foreground">Active Technicians</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-2xl font-bold">{forecast?.projectedMonthlyAppointments ?? 0}</div>
                <p className="text-xs text-muted-foreground">Projected Demand</p>
              </div>
            </div>

            {(capacityData?.recommendedHires ?? 0) > 0 && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-500">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="font-medium">Capacity Alert</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Consider hiring {capacityData?.recommendedHires} additional technician(s) to meet projected demand.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
