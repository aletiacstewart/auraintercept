import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  LineChart, 
  Line, 
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
  Legend
} from 'recharts';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { Eye, Users, MessageSquare, MousePointer, TrendingUp, Mic, Phone, BarChart3, ChevronDown } from 'lucide-react';

interface SmartWebsiteAnalyticsProps {
  websiteId: string;
  metrics: {
    page_views: number;
    unique_visitors: number;
    chat_interactions: number;
    booking_clicks: number;
    voice_interactions?: number;
  } | null;
  monthlyLimit: number;
  onViewLimitOptions: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function categorizeReferrer(referrer: string | null): string {
  if (!referrer) return 'Direct';
  const r = referrer.toLowerCase();
  if (r.includes('google') || r.includes('bing') || r.includes('yahoo') || r.includes('duckduckgo')) return 'Search';
  if (r.includes('facebook') || r.includes('twitter') || r.includes('instagram') || r.includes('linkedin') || r.includes('tiktok')) return 'Social';
  return 'Referral';
}

export function SmartWebsiteAnalytics({ 
  websiteId, 
  metrics, 
  monthlyLimit,
  onViewLimitOptions 
}: SmartWebsiteAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30');

  // Fetch visitor logs for trends
  const { data: visitorLogs } = useQuery({
    queryKey: ['smart-website-visitor-logs', websiteId, timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange));
      const { data, error } = await supabase
        .from('site_visitor_logs')
        .select('visited_at, referrer, visitor_fingerprint')
        .eq('website_id', websiteId)
        .gte('visited_at', startDate.toISOString())
        .order('visited_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!websiteId,
  });

  // Fetch chat logs for interaction trends
  const { data: chatLogs } = useQuery({
    queryKey: ['smart-website-chat-logs', websiteId, timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange));
      const { data, error } = await supabase
        .from('site_chat_logs')
        .select('created_at, interaction_type, duration_seconds')
        .eq('website_id', websiteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!websiteId,
  });

  // Process daily trend data
  const dailyTrendData = useMemo(() => {
    if (!visitorLogs) return [];
    
    const startDate = subDays(new Date(), parseInt(timeRange));
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = visitorLogs.filter(log => 
        format(parseISO(log.visited_at), 'yyyy-MM-dd') === dayStr
      );
      const uniqueFingerprints = new Set(dayLogs.map(l => l.visitor_fingerprint));
      
      return {
        date: format(day, 'MMM d'),
        pageViews: dayLogs.length,
        uniqueVisitors: uniqueFingerprints.size,
      };
    });
  }, [visitorLogs, timeRange]);

  // Process referrer data for pie chart
  const referrerData = useMemo(() => {
    if (!visitorLogs || visitorLogs.length === 0) return [];
    
    const referrerCounts = visitorLogs.reduce((acc, log) => {
      const source = categorizeReferrer(log.referrer);
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(referrerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [visitorLogs]);

  // Process hourly distribution
  const hourlyData = useMemo(() => {
    if (!visitorLogs) return [];
    
    const hourCounts = Array(24).fill(0);
    visitorLogs.forEach(log => {
      const hour = parseISO(log.visited_at).getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts.map((count, hour) => ({
      hour: format(new Date().setHours(hour, 0, 0, 0), 'ha'),
      visits: count,
    }));
  }, [visitorLogs]);

  // Process engagement trend data (chat + voice over time)
  const engagementTrendData = useMemo(() => {
    if (!chatLogs) return [];
    
    const startDate = subDays(new Date(), parseInt(timeRange));
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = chatLogs.filter(log => 
        format(parseISO(log.created_at), 'yyyy-MM-dd') === dayStr
      );
      
      return {
        date: format(day, 'MMM d'),
        chatOpens: dayLogs.filter(l => l.interaction_type === 'chat_opened').length,
        voiceSessions: dayLogs.filter(l => l.interaction_type === 'voice_started').length,
        messages: dayLogs.filter(l => l.interaction_type === 'message_sent').length,
      };
    });
  }, [chatLogs, timeRange]);

  // Calculate engagement breakdown for pie chart
  const engagementBreakdown = useMemo(() => {
    const pageViewOnly = (metrics?.page_views || 0) - (metrics?.chat_interactions || 0) - (metrics?.voice_interactions || 0);
    return [
      { name: 'View Only', value: Math.max(0, pageViewOnly) },
      { name: 'Chat', value: metrics?.chat_interactions || 0 },
      { name: 'Voice', value: metrics?.voice_interactions || 0 },
    ].filter(item => item.value > 0);
  }, [metrics]);

  // Calculate average voice duration
  const avgVoiceDuration = useMemo(() => {
    if (!chatLogs) return 0;
    const voiceEndLogs = chatLogs.filter(l => l.interaction_type === 'voice_ended' && l.duration_seconds);
    if (voiceEndLogs.length === 0) return 0;
    const totalSeconds = voiceEndLogs.reduce((sum, l) => sum + (l.duration_seconds || 0), 0);
    return Math.round(totalSeconds / voiceEndLogs.length);
  }, [chatLogs]);

  const usagePercentage = monthlyLimit 
    ? ((metrics?.page_views || 0) / monthlyLimit) * 100
    : 0;

  return (
    <Collapsible defaultOpen>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <CardTitle className="text-lg">Website Analytics</CardTitle>
                <CardDescription>Track your website performance and visitor engagement</CardDescription>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-card-foreground/70" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Time Range Selector */}
            <div className="flex justify-end">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="min-w-0">
          <CardContent className="pt-6 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-card-foreground">{metrics?.page_views || 0}</p>
                <p className="text-sm text-card-foreground/70 truncate">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="pt-6 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10 shrink-0">
                <Users className="w-5 h-5 text-chart-2" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-card-foreground">{metrics?.unique_visitors || 0}</p>
                <p className="text-sm text-card-foreground/70 truncate">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="pt-6 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10 shrink-0">
                <MessageSquare className="w-5 h-5 text-chart-3" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-card-foreground">{metrics?.chat_interactions || 0}</p>
                <p className="text-sm text-card-foreground/70 truncate">Chat Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="pt-6 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-5/10 shrink-0">
                <Mic className="w-5 h-5 text-chart-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-card-foreground">{metrics?.voice_interactions || 0}</p>
                <p className="text-sm text-card-foreground/70 truncate">Voice Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="pt-6 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10 shrink-0">
                <MousePointer className="w-5 h-5 text-chart-4" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-card-foreground">{metrics?.booking_clicks || 0}</p>
                <p className="text-sm text-card-foreground/70 truncate">Booking Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="pt-6 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 shrink-0">
                <Phone className="w-5 h-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-card-foreground">{avgVoiceDuration}s</p>
                <p className="text-sm text-card-foreground/70 truncate">Avg Voice Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Traffic Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Daily Traffic Trend
          </CardTitle>
          <CardDescription>Page views and unique visitors over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pageViews" 
                  name="Page Views"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="uniqueVisitors" 
                  name="Unique Visitors"
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources and Engagement Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {referrerData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referrerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {referrerData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No visitor data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>How visitors interact with your website</CardDescription>
          </CardHeader>
          <CardContent>
            {engagementBreakdown.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {engagementBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No engagement data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat & Voice Engagement Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            AI Engagement Trend
          </CardTitle>
          <CardDescription>Chat and voice interactions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="chatOpens" 
                  name="Chat Opens"
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="voiceSessions" 
                  name="Voice Sessions"
                  stroke="hsl(var(--chart-5))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  name="Messages"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>When visitors are most active</CardDescription>
        </CardHeader>
        <CardContent>
          {visitorLogs && visitorLogs.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="visits" 
                    name="Visits"
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No visitor data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>
            {metrics?.page_views || 0} of {monthlyLimit.toLocaleString()} visitors this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(usagePercentage, 100)} className="h-3" />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              {usagePercentage.toFixed(1)}% used
            </p>
            {usagePercentage >= 80 && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-amber-500">
                  {usagePercentage >= 100 
                    ? 'Limit reached'
                    : 'Approaching limit'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onViewLimitOptions}
                >
                  View Options
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
