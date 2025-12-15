import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { TrendingDown, TrendingUp, MessageSquare, Mail, Phone, ArrowUpRight, ArrowDownRight, Download, CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DatePreset = 'all' | '7d' | '30d' | '90d' | 'custom';

const COLORS = {
  sms: '#3b82f6',
  email: '#8b5cf6', 
  call: '#10b981',
  subscribe: '#22c55e',
  unsubscribe: '#ef4444'
};

interface SubscriptionEvent {
  id: string;
  company_id: string;
  appointment_id: string;
  channel: string;
  action: string;
  source: string;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
}

interface ReminderLog {
  id: string;
  company_id: string;
  status: string;
  channel: string;
  created_at: string;
}

export function SubscriptionAnalytics() {
  const { companyId } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['subscription-events', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as SubscriptionEvent[];
    },
    enabled: !!companyId,
  });

  // Fetch reminder logs for trend chart (last 4 weeks)
  const fourWeeksAgo = subWeeks(new Date(), 4);
  const { data: reminderLogs, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminder-logs-trends', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('id, company_id, status, channel, created_at')
        .eq('company_id', companyId)
        .gte('created_at', fourWeeksAgo.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ReminderLog[];
    },
    enabled: !!companyId,
  });

  const isLoading = eventsLoading || remindersLoading;

  // Calculate weekly trend data for line chart
  const weeklyTrendData = useMemo(() => {
    const weeks: { weekStart: Date; weekLabel: string; reminders: number; unsubscribes: number; resubscribes: number }[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      
      const remindersInWeek = reminderLogs?.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= weekStart && logDate <= weekEnd;
      }).length || 0;
      
      const unsubscribesInWeek = events?.filter(e => {
        const eventDate = new Date(e.created_at);
        return e.action === 'unsubscribe' && eventDate >= weekStart && eventDate <= weekEnd;
      }).length || 0;
      
      const resubscribesInWeek = events?.filter(e => {
        const eventDate = new Date(e.created_at);
        return e.action === 'subscribe' && eventDate >= weekStart && eventDate <= weekEnd;
      }).length || 0;
      
      weeks.push({
        weekStart,
        weekLabel: format(weekStart, 'MMM d'),
        reminders: remindersInWeek,
        unsubscribes: unsubscribesInWeek,
        resubscribes: resubscribesInWeek
      });
    }
    
    return weeks;
  }, [events, reminderLogs]);

  // Filter events based on date range
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    if (datePreset === 'all') return events;
    
    let startDate: Date;
    let endDate = endOfDay(new Date());
    
    if (datePreset === 'custom') {
      if (!customStartDate) return events;
      startDate = startOfDay(customStartDate);
      endDate = customEndDate ? endOfDay(customEndDate) : endOfDay(new Date());
    } else {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      startDate = startOfDay(subDays(new Date(), daysMap[datePreset]));
    }
    
    return events.filter(event => {
      const eventDate = new Date(event.created_at);
      return isWithinInterval(eventDate, { start: startDate, end: endDate });
    });
  }, [events, datePreset, customStartDate, customEndDate]);

  const exportToCSV = () => {
    if (!filteredEvents || filteredEvents.length === 0) {
      toast.error('No data to export');
      return;
    }

    // CSV headers
    const headers = ['Date', 'Time', 'Channel', 'Action', 'Source', 'Customer Email', 'Customer Phone'];
    
    // CSV rows
    const rows = filteredEvents.map(event => {
      const date = new Date(event.created_at);
      return [
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm:ss'),
        event.channel.toUpperCase(),
        event.action === 'subscribe' ? 'Re-subscribed' : 'Unsubscribed',
        event.source.replace('_', ' '),
        event.customer_email || '',
        event.customer_phone || ''
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscription-events-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredEvents.length} events to CSV`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats from filtered events
  const totalUnsubscribes = filteredEvents?.filter(e => e.action === 'unsubscribe').length || 0;
  const totalSubscribes = filteredEvents?.filter(e => e.action === 'subscribe').length || 0;
  
  const channelStats = {
    sms: {
      unsubscribes: filteredEvents?.filter(e => e.channel === 'sms' && e.action === 'unsubscribe').length || 0,
      subscribes: filteredEvents?.filter(e => e.channel === 'sms' && e.action === 'subscribe').length || 0
    },
    email: {
      unsubscribes: filteredEvents?.filter(e => e.channel === 'email' && e.action === 'unsubscribe').length || 0,
      subscribes: filteredEvents?.filter(e => e.channel === 'email' && e.action === 'subscribe').length || 0
    },
    call: {
      unsubscribes: filteredEvents?.filter(e => e.channel === 'call' && e.action === 'unsubscribe').length || 0,
      subscribes: filteredEvents?.filter(e => e.channel === 'call' && e.action === 'subscribe').length || 0
    }
  };

  // Chart data for channel breakdown
  const channelChartData = [
    { 
      name: 'SMS', 
      unsubscribes: channelStats.sms.unsubscribes,
      resubscribes: channelStats.sms.subscribes
    },
    { 
      name: 'Email', 
      unsubscribes: channelStats.email.unsubscribes,
      resubscribes: channelStats.email.subscribes
    },
    { 
      name: 'Call', 
      unsubscribes: channelStats.call.unsubscribes,
      resubscribes: channelStats.call.subscribes
    }
  ];

  // Pie chart data for source breakdown
  const sourceStats = {
    customer_portal: filteredEvents?.filter(e => e.source === 'customer_portal').length || 0,
    email_link: filteredEvents?.filter(e => e.source === 'email_link').length || 0,
    admin: filteredEvents?.filter(e => e.source === 'admin').length || 0
  };

  const sourceChartData = [
    { name: 'Customer Portal', value: sourceStats.customer_portal, color: '#3b82f6' },
    { name: 'Email Link', value: sourceStats.email_link, color: '#8b5cf6' },
    { name: 'Admin', value: sourceStats.admin, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Recent events for the table (from filtered)
  const recentEvents = filteredEvents?.slice(0, 10) || [];

  const getDateRangeLabel = () => {
    if (datePreset === 'all') return 'All time';
    if (datePreset === '7d') return 'Last 7 days';
    if (datePreset === '30d') return 'Last 30 days';
    if (datePreset === '90d') return 'Last 90 days';
    if (datePreset === 'custom' && customStartDate) {
      const endLabel = customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'Today';
      return `${format(customStartDate, 'MMM d, yyyy')} - ${endLabel}`;
    }
    return 'All time';
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filter and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Subscription Analytics</h3>
          <p className="text-sm text-muted-foreground">Track customer opt-in and opt-out trends</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Preset Select */}
          <Select value={datePreset} onValueChange={(value: DatePreset) => setDatePreset(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Pickers (shown when custom is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            disabled={!filteredEvents || filteredEvents.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Showing results badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{filteredEvents.length} events</Badge>
        <span>{getDateRangeLabel()}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Total Unsubscribes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalUnsubscribes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {datePreset === 'all' ? 'All time' : getDateRangeLabel()} opt-outs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Total Re-subscribes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalSubscribes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {datePreset === 'all' ? 'All time' : getDateRangeLabel()} opt-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Change</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-2 ${
              totalSubscribes - totalUnsubscribes >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalSubscribes - totalUnsubscribes >= 0 ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : (
                <ArrowDownRight className="w-6 h-6" />
              )}
              {Math.abs(totalSubscribes - totalUnsubscribes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Re-subscribes minus unsubscribes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4-Week Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4-Week Trends</CardTitle>
          <CardDescription>Reminders sent and subscription changes over the past 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyTrendData.some(d => d.reminders > 0 || d.unsubscribes > 0 || d.resubscribes > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="weekLabel" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="reminders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Reminders Sent"
                />
                <Line 
                  type="monotone" 
                  dataKey="unsubscribes" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  name="Unsubscribes"
                />
                <Line 
                  type="monotone" 
                  dataKey="resubscribes" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2 }}
                  name="Re-subscribes"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available for the past 4 weeks
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Channel</CardTitle>
            <CardDescription>Unsubscribes vs re-subscribes per channel</CardDescription>
          </CardHeader>
          <CardContent>
            {channelChartData.some(d => d.unsubscribes > 0 || d.resubscribes > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={channelChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={60} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }} 
                  />
                  <Bar dataKey="unsubscribes" fill={COLORS.unsubscribe} name="Unsubscribes" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="resubscribes" fill={COLORS.subscribe} name="Re-subscribes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No subscription events yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Source</CardTitle>
            <CardDescription>Where preference changes happen</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No subscription events yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['sms', 'email', 'call'] as const).map(channel => (
          <Card key={channel}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 capitalize">
                {getChannelIcon(channel)}
                {channel === 'sms' ? 'SMS' : channel.charAt(0).toUpperCase() + channel.slice(1)} Channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xl font-bold text-red-600">{channelStats[channel].unsubscribes}</div>
                  <p className="text-xs text-muted-foreground">Opt-outs</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-xl font-bold text-green-600">{channelStats[channel].subscribes}</div>
                  <p className="text-xs text-muted-foreground">Opt-ins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
          <CardDescription>Latest subscription preference changes</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">
                      {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 capitalize">
                        {getChannelIcon(event.channel)}
                        {event.channel === 'sms' ? 'SMS' : event.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={event.action === 'unsubscribe' ? 'destructive' : 'default'}
                        className={event.action === 'subscribe' ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}
                      >
                        {event.action === 'unsubscribe' ? (
                          <><ArrowDownRight className="w-3 h-3 mr-1" /> Unsubscribed</>
                        ) : (
                          <><ArrowUpRight className="w-3 h-3 mr-1" /> Re-subscribed</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {event.source.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No subscription events recorded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
