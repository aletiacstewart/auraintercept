import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Calendar, 
  Phone, 
  TrendingUp,
  Clock,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface CompanyAnalyticsProps {
  companyId: string;
}

export function CompanyAnalytics({ companyId }: CompanyAnalyticsProps) {
  // Fetch company-specific stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['company-analytics-stats', companyId],
    queryFn: async () => {
      const [profiles, appointments, callLogs, invoices, quotes] = await Promise.all([
        supabase.from('profiles').select('id').eq('company_id', companyId),
        supabase.from('appointments').select('id, status, datetime').eq('company_id', companyId),
        supabase.from('call_logs').select('id, status, direction, duration_seconds, started_at').eq('company_id', companyId),
        supabase.from('invoices').select('id, status, total, paid_at').eq('company_id', companyId),
        supabase.from('quotes').select('id, status, total_amount').eq('company_id', companyId),
      ]);

      const totalUsers = profiles.data?.length ?? 0;
      const totalAppointments = appointments.data?.length ?? 0;
      const totalCalls = callLogs.data?.length ?? 0;

      // Calculate completion rates
      const completedAppointments = appointments.data?.filter(a => a.status === 'completed').length ?? 0;
      const completedCalls = callLogs.data?.filter(c => c.status === 'completed').length ?? 0;
      
      // Calculate total call duration
      const totalCallMinutes = Math.round(
        (callLogs.data?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) ?? 0) / 60
      );

      // Revenue calculations
      const paidInvoices = invoices.data?.filter(i => i.status === 'paid') ?? [];
      const outstandingInvoices = invoices.data?.filter(i => i.status !== 'paid' && i.status !== 'cancelled') ?? [];
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      const collectionRate = invoices.data && invoices.data.length > 0 
        ? Math.round((paidInvoices.length / invoices.data.length) * 100) 
        : 0;

      // Quote calculations
      const totalQuotes = quotes.data?.length ?? 0;
      const acceptedQuotes = quotes.data?.filter(q => q.status === 'accepted').length ?? 0;
      const quoteConversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
      const avgQuoteValue = totalQuotes > 0 
        ? (quotes.data?.reduce((sum, q) => sum + (q.total_amount || 0), 0) ?? 0) / totalQuotes 
        : 0;

      return {
        totalUsers,
        totalAppointments,
        totalCalls,
        completedAppointments,
        completedCalls,
        totalCallMinutes,
        appointmentCompletionRate: totalAppointments > 0 
          ? Math.round((completedAppointments / totalAppointments) * 100) 
          : 0,
        callCompletionRate: totalCalls > 0 
          ? Math.round((completedCalls / totalCalls) * 100) 
          : 0,
        totalRevenue,
        outstandingAmount,
        collectionRate,
        totalQuotes,
        quoteConversionRate,
        avgQuoteValue,
      };
    },
    enabled: !!companyId,
  });

  // Fetch appointments by day (last 14 days)
  const { data: appointmentsByDay, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['company-analytics-appointments', companyId],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14);
      const { data } = await supabase
        .from('appointments')
        .select('datetime, status')
        .eq('company_id', companyId)
        .gte('datetime', fourteenDaysAgo.toISOString());

      // Group by day
      const byDay = new Map<string, { scheduled: number; completed: number; cancelled: number }>();
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), 13 - i), 'MMM dd');
        byDay.set(date, { scheduled: 0, completed: 0, cancelled: 0 });
      }

      data?.forEach(apt => {
        const date = format(new Date(apt.datetime), 'MMM dd');
        const entry = byDay.get(date);
        if (entry) {
          if (apt.status === 'scheduled') entry.scheduled++;
          else if (apt.status === 'completed') entry.completed++;
          else if (apt.status === 'cancelled') entry.cancelled++;
        }
      });

      return Array.from(byDay.entries()).map(([date, counts]) => ({
        date,
        ...counts,
      }));
    },
    enabled: !!companyId,
  });

  // Fetch calls by day (last 14 days)
  const { data: callsByDay, isLoading: callsLoading } = useQuery({
    queryKey: ['company-analytics-calls', companyId],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14);
      const { data } = await supabase
        .from('call_logs')
        .select('started_at, direction, status')
        .eq('company_id', companyId)
        .gte('started_at', fourteenDaysAgo.toISOString());

      // Group by day
      const byDay = new Map<string, { inbound: number; outbound: number }>();
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), 13 - i), 'MMM dd');
        byDay.set(date, { inbound: 0, outbound: 0 });
      }

      data?.forEach(call => {
        const date = format(new Date(call.started_at), 'MMM dd');
        const entry = byDay.get(date);
        if (entry) {
          if (call.direction === 'inbound') entry.inbound++;
          else entry.outbound++;
        }
      });

      return Array.from(byDay.entries()).map(([date, counts]) => ({
        date,
        ...counts,
      }));
    },
    enabled: !!companyId,
  });

  // Call status distribution
  const { data: callStatusData } = useQuery({
    queryKey: ['company-analytics-call-status', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('call_logs')
        .select('status')
        .eq('company_id', companyId);
      
      const statusCounts = new Map<string, number>();
      data?.forEach(call => {
        statusCounts.set(call.status, (statusCounts.get(call.status) || 0) + 1);
      });

      return Array.from(statusCounts.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
    enabled: !!companyId,
  });

  const statCards = [
    { 
      title: 'Team Members', 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      description: 'Employees',
      gradient: 'from-primary to-primary/80'
    },
    { 
      title: 'Appointments', 
      value: stats?.totalAppointments ?? 0, 
      icon: Calendar, 
      description: `${stats?.appointmentCompletionRate ?? 0}% completed`,
      gradient: 'from-secondary to-secondary/80'
    },
    { 
      title: 'AI Calls', 
      value: stats?.totalCalls ?? 0, 
      icon: Phone, 
      description: `${stats?.totalCallMinutes ?? 0} minutes total`,
      gradient: 'from-accent to-accent/80'
    },
    { 
      title: 'Revenue', 
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, 
      icon: TrendingUp, 
      description: `${stats?.collectionRate ?? 0}% collected`,
      gradient: 'from-primary to-secondary'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Analytics</h1>
        <p className="text-white/70 mt-1">
          Performance metrics for your company
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
              )}
              <p className="text-xs text-white/70 mt-1">{stat.description}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          </Card>
        ))}
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="calls">AI Agent Calls</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointments (Last 14 Days)
                </CardTitle>
                <CardDescription>Daily appointment volume</CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={appointmentsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="scheduled" stackId="a" fill="hsl(var(--primary))" name="Scheduled" />
                      <Bar dataKey="completed" stackId="a" fill="hsl(var(--secondary))" name="Completed" />
                      <Bar dataKey="cancelled" stackId="a" fill="hsl(var(--muted))" name="Cancelled" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Appointment Status</CardTitle>
                <CardDescription>Overall distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-foreground">Completed</span>
                  </div>
                  <span className="font-medium text-foreground">{stats?.completedAppointments ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Scheduled</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {(stats?.totalAppointments ?? 0) - (stats?.completedAppointments ?? 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Completion Rate</span>
                    <span className="font-medium text-foreground">{stats?.appointmentCompletionRate ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all" 
                      style={{ width: `${stats?.appointmentCompletionRate ?? 0}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  AI Agent Calls (Last 14 Days)
                </CardTitle>
                <CardDescription>Daily call volume by direction</CardDescription>
              </CardHeader>
              <CardContent>
                {callsLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={callsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
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
                        dataKey="inbound" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Inbound"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="outbound" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        name="Outbound"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Call Status</CardTitle>
                <CardDescription>Distribution by outcome</CardDescription>
              </CardHeader>
              <CardContent>
                {callStatusData && callStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={callStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {callStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No call data yet
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Total Minutes</span>
                    <span className="font-medium text-white">{stats?.totalCallMinutes ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Success Rate</span>
                    <span className="font-medium text-white">{stats?.callCompletionRate ?? 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>Your company financial metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">Total Revenue</span>
                  <span className="font-medium text-green-600">${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">Outstanding Invoices</span>
                  <span className="font-medium text-amber-600">${(stats?.outstandingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">Collection Rate</span>
                  <span className="font-medium text-foreground">{stats?.collectionRate ?? 0}%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Invoice collection progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Collection Rate</span>
                    <span className="font-medium text-foreground">{stats?.collectionRate ?? 0}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-border overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all" 
                      style={{ width: `${stats?.collectionRate ?? 0}%` }} 
                    />
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                    <span className="text-sm text-green-400">Collected</span>
                    <span className="font-medium text-green-400">${(stats?.totalRevenue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <span className="text-sm text-amber-400">Pending</span>
                    <span className="font-medium text-amber-400">${(stats?.outstandingAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Quote Metrics
                </CardTitle>
                <CardDescription>Quote performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">Total Quotes</span>
                  <span className="font-medium text-foreground">{stats?.totalQuotes ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">Conversion Rate</span>
                  <span className="font-medium text-foreground">{stats?.quoteConversionRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">Average Quote Value</span>
                  <span className="font-medium text-foreground">${(stats?.avgQuoteValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Quote Status</CardTitle>
                <CardDescription>Conversion progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-foreground">Accepted</span>
                  </div>
                  <span className="font-medium text-foreground">{stats?.quoteConversionRate ?? 0}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Conversion Rate</span>
                    <span className="font-medium text-foreground">{stats?.quoteConversionRate ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all" 
                      style={{ width: `${stats?.quoteConversionRate ?? 0}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}