import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  Legend
} from 'recharts';
import { TrendingDown, TrendingUp, MessageSquare, Mail, Phone, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLORS = {
  sms: '#3b82f6',
  email: '#8b5cf6', 
  call: '#10b981',
  subscribe: '#22c55e',
  unsubscribe: '#ef4444'
};

export function SubscriptionAnalytics() {
  const { companyId } = useAuth();

  const { data: events, isLoading } = useQuery({
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
      return data || [];
    },
    enabled: !!companyId,
  });

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

  // Calculate stats
  const totalUnsubscribes = events?.filter(e => e.action === 'unsubscribe').length || 0;
  const totalSubscribes = events?.filter(e => e.action === 'subscribe').length || 0;
  
  const channelStats = {
    sms: {
      unsubscribes: events?.filter(e => e.channel === 'sms' && e.action === 'unsubscribe').length || 0,
      subscribes: events?.filter(e => e.channel === 'sms' && e.action === 'subscribe').length || 0
    },
    email: {
      unsubscribes: events?.filter(e => e.channel === 'email' && e.action === 'unsubscribe').length || 0,
      subscribes: events?.filter(e => e.channel === 'email' && e.action === 'subscribe').length || 0
    },
    call: {
      unsubscribes: events?.filter(e => e.channel === 'call' && e.action === 'unsubscribe').length || 0,
      subscribes: events?.filter(e => e.channel === 'call' && e.action === 'subscribe').length || 0
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
    customer_portal: events?.filter(e => e.source === 'customer_portal').length || 0,
    email_link: events?.filter(e => e.source === 'email_link').length || 0,
    admin: events?.filter(e => e.source === 'admin').length || 0
  };

  const sourceChartData = [
    { name: 'Customer Portal', value: sourceStats.customer_portal, color: '#3b82f6' },
    { name: 'Email Link', value: sourceStats.email_link, color: '#8b5cf6' },
    { name: 'Admin', value: sourceStats.admin, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Recent events for the table
  const recentEvents = events?.slice(0, 10) || [];

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
              All time opt-outs
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
              All time opt-ins
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
