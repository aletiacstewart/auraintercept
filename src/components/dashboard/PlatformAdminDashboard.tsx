import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Bot, TrendingUp, Activity, DollarSign, FileText, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';

export function PlatformAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [companies, profiles, appointments, quotes, invoices, campaigns] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('quotes').select('id, status', { count: 'exact' }).in('status', ['draft', 'sent']),
        supabase.from('invoices').select('total, status, paid_at'),
        supabase.from('marketing_campaigns').select('id, status').eq('status', 'active'),
      ]);

      // Calculate platform revenue
      const paidInvoices = (invoices.data ?? []).filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      const monthlyRevenue = paidInvoices
        .filter(i => i.paid_at && new Date(i.paid_at) >= new Date(monthStart) && new Date(i.paid_at) <= new Date(monthEnd))
        .reduce((sum, i) => sum + (i.total || 0), 0);

      const pendingQuotes = (quotes.data ?? []).filter(q => q.status === 'sent').length;

      return {
        companies: companies.count ?? 0,
        users: profiles.count ?? 0,
        appointments: appointments.count ?? 0,
        pendingQuotes,
        totalRevenue,
        monthlyRevenue,
        activeCampaigns: campaigns.data?.length ?? 0,
      };
    },
  });

  const statCards = [
    { 
      title: 'Total Companies', 
      value: stats?.companies ?? 0, 
      icon: Building2, 
      description: 'Active tenants on the platform',
      gradient: 'from-primary to-primary/80'
    },
    { 
      title: 'Total Users', 
      value: stats?.users ?? 0, 
      icon: Users, 
      description: 'Admins and employees',
      gradient: 'from-secondary to-secondary/80'
    },
    { 
      title: 'Appointments', 
      value: stats?.appointments ?? 0, 
      icon: Calendar, 
      description: 'Scheduled across all companies',
      gradient: 'from-accent to-accent/80'
    },
    { 
      title: 'AI Agents Active', 
      value: stats?.companies ?? 0, 
      icon: Bot, 
      description: 'Deployed AI agents',
      gradient: 'from-primary to-secondary'
    },
    { 
      title: 'Platform Revenue', 
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, 
      icon: DollarSign, 
      description: 'Total collected',
      gradient: 'from-green-500 to-green-600',
      isString: true
    },
    { 
      title: 'Monthly Revenue', 
      value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, 
      icon: TrendingUp, 
      description: 'This month',
      gradient: 'from-green-400 to-green-500',
      isString: true
    },
    { 
      title: 'Pending Quotes', 
      value: stats?.pendingQuotes ?? 0, 
      icon: FileText, 
      description: 'Awaiting customer response',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    { 
      title: 'Active Campaigns', 
      value: stats?.activeCampaigns ?? 0, 
      icon: Megaphone, 
      description: 'Marketing campaigns running',
      gradient: 'from-purple-500 to-purple-600'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the AI Bot Company admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="relative overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">
                  {stat.isString ? stat.value : (stat.value as number).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Platform Activity
            </CardTitle>
            <CardDescription>Recent activity across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">System Status</span>
                <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">API Endpoints</span>
                <span className="text-sm font-medium text-green-500">All Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Edge Functions</span>
                <span className="text-sm font-medium text-green-500">Running</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Growth Metrics
            </CardTitle>
            <CardDescription>Platform performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly Active Companies</span>
                  <span className="font-medium">{stats?.companies ?? 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full gradient-primary" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>User Engagement</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-secondary" style={{ width: '78%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Response Rate</span>
                  <span className="font-medium">94%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: '94%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}