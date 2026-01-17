import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
import { Eye, Users, MessageSquare, MousePointer, TrendingUp } from 'lucide-react';

interface SmartWebsiteAnalyticsProps {
  websiteId: string;
  metrics: {
    page_views: number;
    unique_visitors: number;
    chat_interactions: number;
    booking_clicks: number;
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

  const usagePercentage = monthlyLimit 
    ? ((metrics?.page_views || 0) / monthlyLimit) * 100
    : 0;

  return (
    <div className="space-y-6">
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
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.page_views || 0}</p>
                <p className="text-sm text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Users className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.unique_visitors || 0}</p>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <MessageSquare className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.chat_interactions || 0}</p>
                <p className="text-sm text-muted-foreground">Chat Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <MousePointer className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.booking_clicks || 0}</p>
                <p className="text-sm text-muted-foreground">Booking Clicks</p>
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

      {/* Traffic Sources and Peak Hours */}
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
      </div>

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
    </div>
  );
}
