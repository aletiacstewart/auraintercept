import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, Instagram, Facebook, Twitter, Linkedin, Calendar, CheckCircle } from 'lucide-react';
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
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#000000',
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
};

interface SocialMediaAnalyticsProps {
  companyId: string;
}

export function SocialMediaAnalytics({ companyId }: SocialMediaAnalyticsProps) {
  // Fetch social content stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['social-analytics-stats', companyId],
    queryFn: async () => {
      const [drafts, scheduled] = await Promise.all([
        supabase
          .from('social_content_drafts')
          .select('platform, status, created_at')
          .eq('company_id', companyId),
        supabase
          .from('scheduled_social_posts')
          .select('platforms, status, scheduled_for, published_at, created_at')
          .eq('company_id', companyId),
      ]);

      const totalDrafts = drafts.data?.length ?? 0;
      const totalScheduled = scheduled.data?.length ?? 0;
      const published = scheduled.data?.filter(p => p.status === 'published').length ?? 0;
      const pending = scheduled.data?.filter(p => p.status === 'pending').length ?? 0;

      // Group by platform - scheduled_social_posts uses 'platforms' array
      const byPlatform: Record<string, number> = {};
      
      // From drafts (single platform)
      drafts.data?.forEach(item => {
        if (item.platform) {
          byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
        }
      });
      
      // From scheduled posts (platforms array)
      scheduled.data?.forEach(item => {
        if (item.platforms && Array.isArray(item.platforms)) {
          item.platforms.forEach(platform => {
            byPlatform[platform] = (byPlatform[platform] || 0) + 1;
          });
        }
      });

      return {
        totalDrafts,
        totalScheduled,
        published,
        pending,
        total: totalDrafts + totalScheduled,
        byPlatform,
      };
    },
    enabled: !!companyId,
  });

  // Fetch posts by day (last 14 days)
  const { data: postsByDay, isLoading: postsLoading } = useQuery({
    queryKey: ['social-analytics-daily', companyId],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14);
      const { data } = await supabase
        .from('scheduled_social_posts')
        .select('status, scheduled_for, published_at')
        .eq('company_id', companyId)
        .gte('scheduled_for', fourteenDaysAgo.toISOString());

      const byDay = new Map<string, { scheduled: number; published: number }>();
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), 13 - i), 'MMM dd');
        byDay.set(date, { scheduled: 0, published: 0 });
      }

      data?.forEach(post => {
        const date = format(new Date(post.scheduled_for), 'MMM dd');
        const entry = byDay.get(date);
        if (entry) {
          if (post.status === 'published') {
            entry.published++;
          } else {
            entry.scheduled++;
          }
        }
      });

      return Array.from(byDay.entries()).map(([date, counts]) => ({
        date,
        ...counts,
      }));
    },
    enabled: !!companyId,
  });

  const platformData = stats?.byPlatform 
    ? Object.entries(stats.byPlatform).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: PLATFORM_COLORS[name] || 'hsl(var(--muted))',
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.total?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Drafts & posts</p>
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
            <p className="text-xs text-muted-foreground mt-1">Posts published</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.pending?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Pending posts</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.totalDrafts?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Content drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Posts (Last 14 Days)
            </CardTitle>
            <CardDescription>Daily post activity</CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postsByDay}>
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
                  <Bar dataKey="published" stackId="a" fill="hsl(142, 76%, 36%)" name="Published" />
                  <Bar dataKey="scheduled" stackId="a" fill="hsl(var(--primary))" name="Scheduled" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Content by platform</CardDescription>
          </CardHeader>
          <CardContent>
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No social content yet
              </div>
            )}
            <div className="mt-4 space-y-2">
              {platformData.map((platform) => {
                const Icon = PLATFORM_ICONS[platform.name.toLowerCase()] || Share2;
                return (
                  <div key={platform.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: platform.color }} />
                      <span>{platform.name}</span>
                    </div>
                    <span className="font-medium">{platform.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
