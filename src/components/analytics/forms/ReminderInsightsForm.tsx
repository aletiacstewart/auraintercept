import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, Mail, MessageSquare, CheckCircle, XCircle, Clock, Loader2, Download, CalendarIcon, Phone,
  TrendingUp, TrendingDown, BarChart3, X, Sparkles
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
} from 'recharts';

interface ReminderLog {
  id: string;
  company_id: string;
  appointment_id: string;
  reminder_type: string;
  channel: string;
  status: string;
  recipient: string | null;
  message_preview: string | null;
  error_message: string | null;
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
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-secondary' : 'text-destructive'}`}>
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

interface ReminderInsightsFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze: (data: Record<string, unknown>) => void;
}

export function ReminderInsightsForm({ companyId, onCancel, onAnalyze }: ReminderInsightsFormProps) {
  const [activeTab, setActiveTab] = useState('stats');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Fetch analytics data (30 days)
  const { data: analyticsLogs, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['reminder-analytics', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('id, channel, status, created_at')
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Pick<ReminderLog, 'id' | 'channel' | 'status' | 'created_at'>[];
    },
    enabled: !!companyId,
  });

  // Fetch history data (filtered by date range)
  const { data: historyLogs, isLoading: loadingHistory } = useQuery({
    queryKey: ['reminder-logs', companyId, startDate, endDate],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('reminder_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (startDate) {
        query = query.gte('created_at', startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endOfDay(endDate).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReminderLog[];
    },
    enabled: !!companyId,
  });

  const exportToCSV = () => {
    if (!historyLogs || historyLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Date', 'Type', 'Channel', 'Status', 'Recipient', 'Message Preview', 'Error'];
    const rows = historyLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.reminder_type,
      log.channel,
      log.status,
      log.recipient || '',
      (log.message_preview || '').replace(/"/g, '""'),
      (log.error_message || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reminder-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  const handleAnalyzeClick = () => {
    const allLogs = analyticsLogs || [];
    const totalReminders = allLogs.length;
    const sentCount = allLogs.filter(l => l.status === 'sent').length;
    const failedCount = allLogs.filter(l => l.status === 'failed').length;
    const successRate = totalReminders > 0 ? Math.round((sentCount / totalReminders) * 100) : 0;
    
    const smsCount = allLogs.filter(l => l.channel === 'sms').length;
    const emailCount = allLogs.filter(l => l.channel === 'email').length;
    const callCount = allLogs.filter(l => l.channel === 'call').length;

    onAnalyze({
      totalReminders,
      sentCount,
      failedCount,
      successRate,
      channelBreakdown: { sms: smsCount, email: emailCount, call: callCount },
      period: '30 days',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Calculate analytics metrics
  const allLogs = analyticsLogs || [];
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

  // Calculate trend
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

  const isLoading = loadingAnalytics || loadingHistory;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Reminder Insights
            </CardTitle>
            <CardDescription>
              Analytics and history for reminder notifications
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleAnalyzeClick}
              disabled={isLoading || totalReminders === 0}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Analyze with AI
            </Button>
            <Button variant="ghost-card" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-muted/50 rounded-b-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : totalReminders === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No reminder data yet</p>
                <p className="text-sm">Analytics will appear once reminders start being sent</p>
              </div>
            ) : (
              <>
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
                    icon={<MessageSquare className="h-5 w-5 text-channel-sms" />}
                  />
                  <MetricCard
                    title="Emails Sent"
                    value={emailSent}
                    subtitle={`${emailCount} total attempts`}
                    icon={<Mail className="h-5 w-5 text-channel-email" />}
                  />
                  <MetricCard
                    title="Calls Made"
                    value={callsSent}
                    subtitle={`${callCount} total attempts`}
                    icon={<Phone className="h-5 w-5 text-channel-voice" />}
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
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} name="Sent" />
                            <Area type="monotone" dataKey="failed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Failed" />
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
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
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
                    <CardDescription>Compare SMS, Email, and Call delivery metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[150px]">
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
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-sm">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(subDays(new Date(), 7));
                  setEndDate(new Date());
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(subDays(new Date(), 30));
                  setEndDate(new Date());
                }}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={!historyLogs || historyLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* History List */}
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !historyLogs || historyLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No reminders found</p>
                <p className="text-sm">Try adjusting the date range</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{historyLogs.length} reminder{historyLogs.length !== 1 ? 's' : ''} found</p>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {historyLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mt-0.5">
                          {getStatusIcon(log.status)}
                          {getChannelIcon(log.channel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {log.reminder_type}
                            </Badge>
                            {getStatusBadge(log.status)}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          {log.recipient && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              To: {log.recipient}
                            </p>
                          )}
                          {log.message_preview && (
                            <p className="text-sm mt-1 truncate">{log.message_preview}</p>
                          )}
                          {log.error_message && (
                            <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
