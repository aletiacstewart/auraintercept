import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Mail, MessageSquare, CheckCircle, Clock, BarChart3, Phone } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface ReminderLog {
  id: string;
  channel: string;
  status: string;
  created_at: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend.value}% vs last week</span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReminderAnalytics() {
  const { companyId } = useAuth();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["reminder-analytics", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("reminder_logs")
        .select("id, channel, status, created_at")
        .eq("company_id", companyId)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ReminderLog[];
    },
    enabled: !!companyId,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allLogs = logs || [];
  
  // Calculate metrics
  const totalReminders = allLogs.length;
  const sentCount = allLogs.filter(l => l.status === 'sent').length;
  const failedCount = allLogs.filter(l => l.status === 'failed').length;
  const skippedCount = allLogs.filter(l => l.status === 'skipped').length;
  const successRate = totalReminders > 0 ? Math.round((sentCount / totalReminders) * 100) : 0;
  
  const smsCount = allLogs.filter(l => l.channel === 'sms').length;
  const emailCount = allLogs.filter(l => l.channel === 'email').length;
  const callCount = allLogs.filter(l => l.channel === 'call').length;
  const smsSent = allLogs.filter(l => l.channel === 'sms' && l.status === 'sent').length;
  const emailSent = allLogs.filter(l => l.channel === 'email' && l.status === 'sent').length;
  const callsSent = allLogs.filter(l => l.channel === 'call' && l.status === 'sent').length;

  // Calculate trend (compare last 7 days vs previous 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  const fourteenDaysAgo = subDays(new Date(), 14);
  const lastWeekLogs = allLogs.filter(l => new Date(l.created_at) >= sevenDaysAgo);
  const prevWeekLogs = allLogs.filter(l => new Date(l.created_at) >= fourteenDaysAgo && new Date(l.created_at) < sevenDaysAgo);
  const lastWeekSuccess = lastWeekLogs.filter(l => l.status === 'sent').length;
  const prevWeekSuccess = prevWeekLogs.filter(l => l.status === 'sent').length;
  const trendValue = prevWeekSuccess > 0 
    ? Math.round(((lastWeekSuccess - prevWeekSuccess) / prevWeekSuccess) * 100) 
    : lastWeekSuccess > 0 ? 100 : 0;

  // Prepare daily data for chart
  const last14Days = eachDayOfInterval({
    start: subDays(new Date(), 13),
    end: new Date(),
  });

  const dailyData = last14Days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const dayLogs = allLogs.filter(l => {
      const logDate = new Date(l.created_at);
      return logDate >= dayStart && logDate < dayEnd;
    });
    
    return {
      date: format(day, 'MMM d'),
      sent: dayLogs.filter(l => l.status === 'sent').length,
      failed: dayLogs.filter(l => l.status === 'failed').length,
      skipped: dayLogs.filter(l => l.status === 'skipped').length,
      total: dayLogs.length,
    };
  });

  // Status distribution for pie chart
  const statusData = [
    { name: 'Sent', value: sentCount, color: 'hsl(var(--chart-1))' },
    { name: 'Failed', value: failedCount, color: 'hsl(var(--destructive))' },
    { name: 'Skipped', value: skippedCount, color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0);

  // Channel distribution for bar chart
  const channelData = [
    { 
      channel: 'SMS', 
      sent: smsSent, 
      failed: allLogs.filter(l => l.channel === 'sms' && l.status === 'failed').length,
      skipped: allLogs.filter(l => l.channel === 'sms' && l.status === 'skipped').length,
    },
    { 
      channel: 'Email', 
      sent: emailSent, 
      failed: allLogs.filter(l => l.channel === 'email' && l.status === 'failed').length,
      skipped: allLogs.filter(l => l.channel === 'email' && l.status === 'skipped').length,
    },
    { 
      channel: 'Call', 
      sent: callsSent, 
      failed: allLogs.filter(l => l.channel === 'call' && l.status === 'failed').length,
      skipped: allLogs.filter(l => l.channel === 'call' && l.status === 'skipped').length,
    },
  ];

  if (totalReminders === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reminder Analytics
          </CardTitle>
          <CardDescription>Track reminder delivery performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reminder data yet</p>
            <p className="text-sm">Analytics will appear once reminders start being sent</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Reminders"
          value={totalReminders}
          subtitle="Last 30 days"
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle={`${sentCount} delivered`}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          trend={{ value: Math.abs(trendValue), isPositive: trendValue >= 0 }}
        />
        <MetricCard
          title="SMS Sent"
          value={smsSent}
          subtitle={`${smsCount} total attempts`}
          icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title="Emails Sent"
          value={emailSent}
          subtitle={`${emailCount} total attempts`}
          icon={<Mail className="h-5 w-5 text-purple-600" />}
        />
        <MetricCard
          title="Calls Made"
          value={callsSent}
          subtitle={`${callCount} total attempts`}
          icon={<Phone className="h-5 w-5 text-green-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Trend */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Delivery Trend</CardTitle>
            <CardDescription>Reminder deliveries over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stackId="1"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                    name="Sent"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stackId="1"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                    name="Failed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>Distribution by outcome</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Comparison */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Channel Performance</CardTitle>
          <CardDescription>Compare SMS vs Email delivery metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="sent" name="Sent" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="failed" name="Failed" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="skipped" name="Skipped" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
