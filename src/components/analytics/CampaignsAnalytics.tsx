import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Mail, MessageSquare, CheckCircle, Clock, Users, MousePointer, TrendingUp } from 'lucide-react';
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

const STATUS_COLORS = {
  active: 'hsl(142, 76%, 36%)',
  completed: 'hsl(var(--primary))',
  draft: 'hsl(var(--muted))',
  scheduled: 'hsl(45, 93%, 47%)',
  paused: 'hsl(0, 84%, 60%)',
};

interface CampaignsAnalyticsProps {
  companyId: string;
}

export function CampaignsAnalytics({ companyId }: CampaignsAnalyticsProps) {
  // Fetch campaign stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['campaigns-analytics-stats', companyId],
    queryFn: async () => {
      const [campaigns, recipients] = await Promise.all([
        supabase
          .from('marketing_campaigns')
          .select('id, status, campaign_type, created_at')
          .eq('company_id', companyId),
        supabase
          .from('campaign_recipients')
          .select('id, status, channel, sent_at, delivered_at, opened_at, clicked_at, converted_at')
          .eq('company_id', companyId),
      ]);

      const allCampaigns = campaigns.data ?? [];
      const allRecipients = recipients.data ?? [];

      // Campaign status counts
      const byStatus = { active: 0, completed: 0, draft: 0, scheduled: 0, paused: 0 };
      allCampaigns.forEach(c => {
        if (byStatus[c.status as keyof typeof byStatus] !== undefined) {
          byStatus[c.status as keyof typeof byStatus]++;
        }
      });

      // Campaign type counts
      const byType: Record<string, number> = {};
      allCampaigns.forEach(c => {
        byType[c.campaign_type] = (byType[c.campaign_type] || 0) + 1;
      });

      // Recipient metrics
      const totalRecipients = allRecipients.length;
      const sent = allRecipients.filter(r => r.sent_at).length;
      const delivered = allRecipients.filter(r => r.delivered_at).length;
      const opened = allRecipients.filter(r => r.opened_at).length;
      const clicked = allRecipients.filter(r => r.clicked_at).length;
      const converted = allRecipients.filter(r => r.converted_at).length;

      // Calculate rates
      const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
      const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
      const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
      const conversionRate = clicked > 0 ? Math.round((converted / clicked) * 100) : 0;

      // Channel breakdown
      const byChannel = { email: 0, sms: 0 };
      allRecipients.forEach(r => {
        if (r.channel && byChannel[r.channel as keyof typeof byChannel] !== undefined) {
          byChannel[r.channel as keyof typeof byChannel]++;
        }
      });

      return {
        totalCampaigns: allCampaigns.length,
        activeCampaigns: byStatus.active,
        byStatus,
        byType,
        totalRecipients,
        sent,
        delivered,
        opened,
        clicked,
        converted,
        deliveryRate,
        openRate,
        clickRate,
        conversionRate,
        byChannel,
      };
    },
    enabled: !!companyId,
  });

  const statusData = stats?.byStatus 
    ? Object.entries(stats.byStatus)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || 'hsl(var(--muted))',
        }))
    : [];

  const funnelData = stats ? [
    { name: 'Sent', value: stats.sent },
    { name: 'Delivered', value: stats.delivered },
    { name: 'Opened', value: stats.opened },
    { name: 'Clicked', value: stats.clicked },
    { name: 'Converted', value: stats.converted },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.totalCampaigns?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stats?.activeCampaigns ?? 0} active</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.totalRecipients?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stats?.deliveryRate ?? 0}% delivered</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-channel-email" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.openRate ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stats?.opened?.toLocaleString() ?? 0} opened</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.clickRate ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stats?.clicked?.toLocaleString() ?? 0} clicked</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Campaign Funnel
            </CardTitle>
            <CardDescription>Recipient journey through campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Campaign Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No campaign data yet
              </div>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-channel-email" />
                  <span>Email</span>
                </div>
                <span className="font-medium">{stats?.byChannel.email ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-channel-sms" />
                  <span>SMS</span>
                </div>
                <span className="font-medium">{stats?.byChannel.sms ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Stats */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Campaign Performance Metrics</CardTitle>
          <CardDescription>Key conversion rates across all campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Delivery Rate</span>
                <span className="font-medium">{stats?.deliveryRate ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: `${stats?.deliveryRate ?? 0}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Open Rate</span>
                <span className="font-medium">{stats?.openRate ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${stats?.openRate ?? 0}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Click Rate</span>
                <span className="font-medium">{stats?.clickRate ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all" 
                  style={{ width: `${stats?.clickRate ?? 0}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium">{stats?.conversionRate ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all" 
                  style={{ width: `${stats?.conversionRate ?? 0}%` }} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
