import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Bot, TrendingUp, Activity, DollarSign, FileText, Megaphone, Package, Shield, Target, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';


export function PlatformAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [companies, profiles, appointments, allQuotes, invoices, campaigns, customers, leads, inventory, warranties] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id, status'),
        supabase.from('quotes').select('id, status'),
        supabase.from('invoices').select('total, status, paid_at'),
        supabase.from('marketing_campaigns').select('id, status').eq('status', 'active'),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id, status'),
        supabase.from('inventory_items').select('id, quantity, min_quantity'),
        supabase.from('warranty_policies').select('id', { count: 'exact', head: true }),
      ]);

      // Calculate platform revenue
      const paidInvoices = (invoices.data ?? []).filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      const monthlyRevenue = paidInvoices
        .filter(i => i.paid_at && new Date(i.paid_at) >= new Date(monthStart) && new Date(i.paid_at) <= new Date(monthEnd))
        .reduce((sum, i) => sum + (i.total || 0), 0);

      // Calculate quote stats
      const quotesData = allQuotes.data ?? [];
      const pendingQuotes = quotesData.filter(q => q.status === 'sent').length;
      const acceptedQuotes = quotesData.filter(q => q.status === 'accepted').length;
      const totalQuotesForConversion = quotesData.filter(q => q.status !== 'draft').length;
      const quoteConversionRate = totalQuotesForConversion > 0 
        ? Math.round((acceptedQuotes / totalQuotesForConversion) * 100) 
        : 0;

      // Calculate appointment stats
      const appointmentsData = appointments.data ?? [];
      const completedAppointments = appointmentsData.filter(a => a.status === 'completed').length;
      const totalAppointmentsForCompletion = appointmentsData.filter(a => a.status !== 'scheduled').length;
      const appointmentCompletionRate = totalAppointmentsForCompletion > 0 
        ? Math.round((completedAppointments / totalAppointmentsForCompletion) * 100) 
        : 0;

      // Calculate inventory stats
      const allInventory = inventory.data ?? [];
      const inventoryCount = allInventory.length;
      const lowStockItems = allInventory.filter(item => 
        item.quantity !== null && item.min_quantity !== null && item.quantity <= item.min_quantity
      ).length;

      // Calculate leads stats
      const allLeads = leads.data ?? [];
      const newLeads = allLeads.filter(l => l.status === 'new').length;
      const convertedLeads = allLeads.filter(l => l.status === 'converted' || l.status === 'won').length;
      const leadConversionRate = allLeads.length > 0 
        ? Math.round((convertedLeads / allLeads.length) * 100) 
        : 0;

      return {
        companies: companies.count ?? 0,
        users: profiles.count ?? 0,
        customers: customers.count ?? 0,
        leads: allLeads.length,
        newLeads,
        appointments: appointmentsData.length,
        pendingQuotes,
        totalRevenue,
        monthlyRevenue,
        activeCampaigns: campaigns.data?.length ?? 0,
        inventoryCount,
        lowStockItems,
        warranties: warranties.count ?? 0,
        leadConversionRate,
        quoteConversionRate,
        appointmentCompletionRate,
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
      title: 'Customers', 
      value: stats?.customers ?? 0, 
      icon: UserCircle, 
      description: 'Across all companies',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    { 
      title: 'Leads', 
      value: stats?.leads ?? 0, 
      icon: Target, 
      description: `${stats?.newLeads ?? 0} new leads`,
      gradient: 'from-orange-500 to-orange-600'
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
      title: 'Inventory', 
      value: stats?.inventoryCount ?? 0, 
      icon: Package, 
      description: stats?.lowStockItems ? `${stats.lowStockItems} low stock` : 'Items tracked',
      gradient: 'from-amber-500 to-amber-600'
    },
    { 
      title: 'Warranties', 
      value: stats?.warranties ?? 0, 
      icon: Shield, 
      description: 'Active policies',
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      title: 'Active Campaigns', 
      value: stats?.activeCampaigns ?? 0, 
      icon: Megaphone, 
      description: 'Marketing campaigns running',
      gradient: 'from-pink-500 to-pink-600'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-white/70 mt-1">
          Welcome to the Aura Intercept admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="relative overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
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
              <p className="text-xs text-white/70 mt-1">{stat.description}</p>
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
            <CardDescription className="text-white/70">Recent activity across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white">System Status</span>
                <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white">API Endpoints</span>
                <span className="text-sm font-medium text-green-400">All Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white">Edge Functions</span>
                <span className="text-sm font-medium text-green-400">Running</span>
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
            <CardDescription className="text-white/70">Platform performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly Active Companies</span>
                  <span className="font-medium">{stats?.companies ?? 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${Math.min((stats?.companies ?? 0) * 10, 100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Lead Conversion</span>
                  <span className="font-medium">{stats?.leadConversionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${stats?.leadConversionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quote Conversion</span>
                  <span className="font-medium">{stats?.quoteConversionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${stats?.quoteConversionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Appointment Completion</span>
                  <span className="font-medium">{stats?.appointmentCompletionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${stats?.appointmentCompletionRate ?? 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}