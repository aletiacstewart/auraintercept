import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface WidgetAnalyticsProps {
  companyId: string;
}

export function WidgetAnalytics({ companyId }: WidgetAnalyticsProps) {
  // Fetch widget stats from site_metrics (aggregated monthly data with company_id)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['widget-analytics-stats', companyId],
    queryFn: async () => {
      const { data: metrics } = await supabase
        .from('site_metrics')
        .select('page_views, unique_visitors, chat_interactions, booking_clicks, month_year')
        .eq('company_id', companyId)
        .order('month_year', { ascending: false });

      if (!metrics || metrics.length === 0) {
        return {
          totalPageViews: 0,
          uniqueVisitors: 0,
          totalChats: 0,
          bookingClicks: 0,
          engagementRate: 0,
          monthlyData: [],
        };
      }

      // Sum all metrics
      const totalPageViews = metrics.reduce((sum, m) => sum + (m.page_views || 0), 0);
      const uniqueVisitors = metrics.reduce((sum, m) => sum + (m.unique_visitors || 0), 0);
      const totalChats = metrics.reduce((sum, m) => sum + (m.chat_interactions || 0), 0);
      const bookingClicks = metrics.reduce((sum, m) => sum + (m.booking_clicks || 0), 0);

      // Chat engagement rate
      const engagementRate = uniqueVisitors > 0 ? Math.round((totalChats / uniqueVisitors) * 100) : 0;

      // Prepare monthly data for charts (last 6 months)
      const monthlyData = metrics.slice(0, 6).reverse().map(m => ({
        month: m.month_year,
        pageViews: m.page_views || 0,
        visitors: m.unique_visitors || 0,
        chats: m.chat_interactions || 0,
      }));

      return {
        totalPageViews,
        uniqueVisitors,
        totalChats,
        bookingClicks,
        engagementRate,
        monthlyData,
      };
    },
    enabled: !!companyId,
  });

  // Fetch smart websites for this company
  const { data: websiteCount } = useQuery({
    queryKey: ['widget-analytics-websites', companyId],
    queryFn: async () => {
      const { count } = await supabase
        .from('smart_websites')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);
      return count ?? 0;
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.totalPageViews?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total page views</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.uniqueVisitors?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Distinct visitors</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chat Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-channel-sms" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.totalChats?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Widget conversations</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.engagementRate ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Chat engagement rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Monthly Traffic
            </CardTitle>
            <CardDescription>Page views and unique visitors by month</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : stats?.monthlyData && stats.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.monthlyData}>
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
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary)/.2)"
                    name="Page Views"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary)/.2)"
                    name="Unique Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No traffic data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Monthly Chat Activity
            </CardTitle>
            <CardDescription>Chat interactions by month</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : stats?.monthlyData && stats.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyData}>
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
                  <Bar dataKey="chats" fill="hsl(var(--primary))" name="Chat Interactions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No chat data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking & Website Stats */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Website Widget Summary</CardTitle>
          <CardDescription>Performance overview for your smart websites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active Websites</p>
                  <p className="text-xs text-muted-foreground">Smart websites</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{websiteCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Booking Clicks</p>
                  <p className="text-xs text-muted-foreground">CTA conversions</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats?.bookingClicks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Avg. per Visitor</p>
                  <p className="text-xs text-muted-foreground">Pages viewed</p>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {stats?.uniqueVisitors && stats.uniqueVisitors > 0 
                  ? (stats.totalPageViews / stats.uniqueVisitors).toFixed(1)
                  : '0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
