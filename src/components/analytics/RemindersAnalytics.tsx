import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, MessageSquare, CheckCircle } from 'lucide-react';
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

const CHANNEL_COLORS = {
  email: 'hsl(var(--channel-email))',
  sms: 'hsl(var(--channel-sms))',
  voice: 'hsl(var(--channel-voice))',
};

interface RemindersAnalyticsProps {
  companyId: string;
}

export function RemindersAnalytics({ companyId }: RemindersAnalyticsProps) {
  // Fetch reminder stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reminders-analytics-stats', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('reminder_logs')
        .select('channel, status, created_at')
        .eq('company_id', companyId);

      const total = data?.length ?? 0;
      const byChannel = { email: 0, sms: 0, voice: 0 };
      const byStatus = { sent: 0, delivered: 0, failed: 0, pending: 0 };

      data?.forEach(log => {
        if (log.channel && byChannel[log.channel as keyof typeof byChannel] !== undefined) {
          byChannel[log.channel as keyof typeof byChannel]++;
        }
        if (log.status && byStatus[log.status as keyof typeof byStatus] !== undefined) {
          byStatus[log.status as keyof typeof byStatus]++;
        }
      });

      const deliveryRate = total > 0 ? Math.round(((byStatus.sent + byStatus.delivered) / total) * 100) : 0;

      return {
        total,
        byChannel,
        byStatus,
        deliveryRate,
      };
    },
    enabled: !!companyId,
  });

  // Fetch reminders by day (last 14 days)
  const { data: remindersByDay, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminders-analytics-daily', companyId],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14);
      const { data } = await supabase
        .from('reminder_logs')
        .select('channel, created_at')
        .eq('company_id', companyId)
        .gte('created_at', fourteenDaysAgo.toISOString());

      const byDay = new Map<string, { email: number; sms: number; voice: number }>();
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), 13 - i), 'MMM dd');
        byDay.set(date, { email: 0, sms: 0, voice: 0 });
      }

      data?.forEach(log => {
        const date = format(new Date(log.created_at), 'MMM dd');
        const entry = byDay.get(date);
        if (entry && log.channel) {
          const channel = log.channel as keyof typeof entry;
          if (entry[channel] !== undefined) {
            entry[channel]++;
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

  const channelData = stats ? [
    { name: 'Email', value: stats.byChannel.email, color: CHANNEL_COLORS.email },
    { name: 'SMS', value: stats.byChannel.sms, color: CHANNEL_COLORS.sms },
    { name: 'Voice', value: stats.byChannel.voice, color: CHANNEL_COLORS.voice },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.total?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-channel-email" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.byChannel.email?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Reminders sent</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SMS</CardTitle>
            <MessageSquare className="h-4 w-4 text-channel-sms" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.byChannel.sms?.toLocaleString() ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Reminders sent</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats?.deliveryRate ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reminders by Channel (Last 14 Days)
            </CardTitle>
            <CardDescription>Daily reminder volume by channel</CardDescription>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={remindersByDay}>
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
                  <Bar dataKey="email" stackId="a" fill={CHANNEL_COLORS.email} name="Email" />
                  <Bar dataKey="sms" stackId="a" fill={CHANNEL_COLORS.sms} name="SMS" />
                  <Bar dataKey="voice" stackId="a" fill={CHANNEL_COLORS.voice} name="Voice" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
            <CardDescription>Reminders by type</CardDescription>
          </CardHeader>
          <CardContent>
            {channelData.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No reminder data yet
              </div>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-channel-email" />
                  <span>Email</span>
                </div>
                <span className="font-medium">{stats?.byChannel.email ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-channel-sms" />
                  <span>SMS</span>
                </div>
                <span className="font-medium">{stats?.byChannel.sms ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-channel-voice" />
                  <span>Voice</span>
                </div>
                <span className="font-medium">{stats?.byChannel.voice ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
