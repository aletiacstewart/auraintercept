import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle, Clock, Calendar, PenTool } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface BlogAnalyticsProps {
  companyId: string;
}

export function BlogAnalytics({ companyId }: BlogAnalyticsProps) {
  // Fetch blog stats - blog_posts is not company-scoped, so we check author
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['blog-analytics-stats', companyId],
    queryFn: async () => {
      // Get profiles for this company to filter blog posts by author
      const { data: companyProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId);

      const profileIds = companyProfiles?.map(p => p.id) ?? [];

      if (profileIds.length === 0) {
        return { total: 0, published: 0, drafts: 0, scheduledCount: 0 };
      }

      const [blogPosts, scheduled] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, published, published_at, created_at')
          .in('author_id', profileIds),
        supabase
          .from('scheduled_blog_posts')
          .select('id, status, scheduled_for')
          .eq('company_id', companyId),
      ]);

      const total = blogPosts.data?.length ?? 0;
      const published = blogPosts.data?.filter(p => p.published).length ?? 0;
      const drafts = blogPosts.data?.filter(p => !p.published).length ?? 0;
      const scheduledCount = scheduled.data?.filter(s => s.status === 'pending').length ?? 0;

      return {
        total,
        published,
        drafts,
        scheduledCount,
      };
    },
    enabled: !!companyId,
  });

  // Fetch posts by month (last 6 months)
  const { data: postsByMonth, isLoading: postsLoading } = useQuery({
    queryKey: ['blog-analytics-monthly', companyId],
    queryFn: async () => {
      const { data: companyProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId);

      const profileIds = companyProfiles?.map(p => p.id) ?? [];

      if (profileIds.length === 0) {
        return [];
      }

      const sixMonthsAgo = subMonths(new Date(), 6);
      const { data } = await supabase
        .from('blog_posts')
        .select('published, published_at, created_at')
        .in('author_id', profileIds)
        .gte('created_at', sixMonthsAgo.toISOString());

      // Create months array
      const months = eachMonthOfInterval({
        start: sixMonthsAgo,
        end: new Date(),
      });

      const byMonth = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthLabel = format(month, 'MMM yyyy');
        
        const postsInMonth = data?.filter(post => {
          const postDate = new Date(post.created_at);
          return postDate >= monthStart && postDate <= monthEnd;
        }) ?? [];

        return {
          month: monthLabel,
          created: postsInMonth.length,
          published: postsInMonth.filter(p => p.published).length,
        };
      });

      return byMonth;
    },
    enabled: !!companyId,
  });

  // Fetch recent activity (last 14 days)
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['blog-analytics-recent', companyId],
    queryFn: async () => {
      const { data: companyProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId);

      const profileIds = companyProfiles?.map(p => p.id) ?? [];

      if (profileIds.length === 0) {
        return [];
      }

      const fourteenDaysAgo = subDays(new Date(), 14);
      const { data } = await supabase
        .from('blog_posts')
        .select('created_at')
        .in('author_id', profileIds)
        .gte('created_at', fourteenDaysAgo.toISOString());

      const byDay = new Map<string, number>();
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), 13 - i), 'MMM dd');
        byDay.set(date, 0);
      }

      data?.forEach(post => {
        const date = format(new Date(post.created_at), 'MMM dd');
        if (byDay.has(date)) {
          byDay.set(date, (byDay.get(date) || 0) + 1);
        }
      });

      return Array.from(byDay.entries()).map(([date, count]) => ({
        date,
        posts: count,
      }));
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.total?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All blog posts</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.published?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Live posts</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.drafts?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.scheduledCount?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Pending publish</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Monthly Publishing
            </CardTitle>
            <CardDescription>Posts created & published (6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postsByMonth}>
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
                  <Bar dataKey="created" fill="hsl(var(--primary))" name="Created" />
                  <Bar dataKey="published" fill="hsl(142, 76%, 36%)" name="Published" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Posts created (Last 14 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentActivity}>
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
                    dataKey="posts" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Posts"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
