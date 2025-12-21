import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Bot, MessageSquare, Plus, Settings, Puzzle, FileText, Receipt, Package, DollarSign, AlertTriangle, Activity, TrendingUp, HeadphonesIcon, Truck, Briefcase, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { OnboardingChecklist } from '@/components/company/OnboardingChecklist';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function CompanyAdminDashboard() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['company-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [employees, appointments, quotes, invoices, inventory, monthlyRevenue, feedback, reminderLogs] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id, status').eq('company_id', companyId),
        supabase.from('quotes').select('id, total_amount, status').eq('company_id', companyId),
        supabase.from('invoices').select('id, total, status, quote_id').eq('company_id', companyId),
        supabase.from('inventory_items').select('id, quantity, min_quantity').eq('company_id', companyId).eq('is_active', true),
        supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
        supabase.from('customer_feedback').select('rating').eq('company_id', companyId).not('rating', 'is', null),
        supabase.from('reminder_logs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', monthStart).lte('created_at', monthEnd),
      ]);

      // Calculate totals
      const allQuotes = quotes.data ?? [];
      const openQuotes = allQuotes.filter(q => q.status === 'draft' || q.status === 'sent');
      const openQuotesTotal = openQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      
      const allInvoices = invoices.data ?? [];
      const outstandingInvoices = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      
      const revenue = (monthlyRevenue.data ?? []).reduce((sum, i) => sum + (i.total || 0), 0);

      // Calculate low stock items
      const lowStockCount = (inventory.data ?? []).filter(item => item.quantity < item.min_quantity).length;

      // Calculate quote conversion rate
      const acceptedQuotes = allQuotes.filter(q => q.status === 'accepted').length;
      const totalQuotesForConversion = allQuotes.filter(q => q.status !== 'draft').length;
      const quoteConversionRate = totalQuotesForConversion > 0 ? Math.round((acceptedQuotes / totalQuotesForConversion) * 100) : 0;

      // Calculate appointment completion rate
      const allAppointments = appointments.data ?? [];
      const completedAppointments = allAppointments.filter(a => a.status === 'completed').length;
      const totalAppointmentsForCompletion = allAppointments.filter(a => a.status !== 'scheduled').length;
      const appointmentCompletionRate = totalAppointmentsForCompletion > 0 ? Math.round((completedAppointments / totalAppointmentsForCompletion) * 100) : 0;

      // Calculate customer satisfaction
      const feedbackData = feedback.data ?? [];
      const avgRating = feedbackData.length > 0 
        ? feedbackData.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackData.length 
        : 0;
      const satisfactionRate = Math.round((avgRating / 5) * 100);

      // Messages count (reminder logs as proxy)
      const messagesCount = reminderLogs.count ?? 0;

      return {
        employees: employees.count ?? 0,
        appointments: allAppointments.length,
        openQuotes: openQuotes.length,
        openQuotesTotal,
        outstandingInvoices: outstandingInvoices.length,
        outstandingTotal,
        monthlyRevenue: revenue,
        lowStockAlerts: lowStockCount,
        quoteConversionRate,
        appointmentCompletionRate,
        satisfactionRate,
        messagesCount,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = companyLoading || statsLoading;

  const statCards = [
    { 
      title: 'Employees', 
      value: stats?.employees ?? 0, 
      icon: Users, 
      description: 'Team members',
      gradient: 'from-primary to-primary/80'
    },
    { 
      title: 'Appointments', 
      value: stats?.appointments ?? 0, 
      icon: Calendar, 
      description: 'Total scheduled',
      gradient: 'from-secondary to-secondary/80'
    },
    { 
      title: 'Open Quotes', 
      value: stats?.openQuotes ?? 0, 
      icon: FileText, 
      description: `$${(stats?.openQuotesTotal ?? 0).toLocaleString()} total`,
      gradient: 'from-accent to-accent/80'
    },
    { 
      title: 'Outstanding', 
      value: stats?.outstandingInvoices ?? 0, 
      icon: Receipt, 
      description: `$${(stats?.outstandingTotal ?? 0).toLocaleString()} unpaid`,
      gradient: 'from-primary to-secondary'
    },
    { 
      title: 'Revenue (Month)', 
      value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, 
      icon: DollarSign, 
      description: format(new Date(), 'MMMM yyyy'),
      gradient: 'from-green-500 to-green-600',
      isString: true
    },
    { 
      title: 'Low Stock', 
      value: stats?.lowStockAlerts ?? 0, 
      icon: AlertTriangle, 
      description: 'Items need reorder',
      gradient: 'from-yellow-500 to-yellow-600',
      highlight: (stats?.lowStockAlerts ?? 0) > 0
    },
    { 
      title: 'AI Agent', 
      value: 'Active', 
      icon: Bot, 
      description: 'Ready to assist',
      gradient: 'from-purple-500 to-purple-600',
      isString: true
    },
    { 
      title: 'Messages', 
      value: stats?.messagesCount ?? 0, 
      icon: MessageSquare, 
      description: 'This month',
      gradient: 'from-blue-500 to-blue-600'
    },
  ];

  const quickActions = [
    { label: 'Add Employee', icon: Plus, href: '/dashboard/employees', gradient: 'from-primary to-primary/80' },
    { label: 'Create Quote', icon: FileText, href: '/dashboard/quotes', gradient: 'from-secondary to-secondary/80' },
    { label: 'Create Invoice', icon: Receipt, href: '/dashboard/invoices', gradient: 'from-accent to-accent/80' },
    { label: 'Customer AI', icon: HeadphonesIcon, href: '/dashboard/ai-agent?console=customer', gradient: 'from-purple-500 to-purple-600' },
    { label: 'Field Ops AI', icon: Truck, href: '/dashboard/ai-agent?console=fieldops', gradient: 'from-green-500 to-green-600' },
    { label: 'Business AI', icon: Briefcase, href: '/dashboard/ai-agent?console=businessops', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Marketing AI', icon: Megaphone, href: '/dashboard/ai-agent?console=marketing', gradient: 'from-orange-500 to-orange-600' },
    { label: 'Integrations', icon: Puzzle, href: '/dashboard/integrations', gradient: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Trial Banner */}
      <TrialBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{company?.name}</h1>
              <p className="text-muted-foreground mt-1">
                Company Dashboard
              </p>
            </>
          )}
        </div>
        <div 
          className="w-16 h-16 rounded-xl border-2 overflow-hidden"
          style={{ borderColor: company?.primary_color || 'hsl(var(--primary))' }}
        >
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Company Logo" className="w-full h-full object-cover" />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
              style={{ 
                background: `linear-gradient(135deg, ${company?.primary_color || '#0EA5E9'}, ${company?.secondary_color || '#8B5CF6'})`,
                color: 'white'
              }}
            >
              {company?.name?.charAt(0) || 'C'}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
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
                <div className={`text-3xl font-bold ${stat.highlight ? 'text-yellow-600' : ''}`}>
                  {stat.isString ? stat.value : (stat.value as number).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          </Card>
        ))}
      </div>

      {/* Quick Actions & Activity Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks to manage your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                    <action.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-medium text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Business Metrics
            </CardTitle>
            <CardDescription>Performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quote Conversion</span>
                  <span className="font-medium">{stats?.quoteConversionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats?.quoteConversionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Appointment Completion</span>
                  <span className="font-medium">{stats?.appointmentCompletionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${stats?.appointmentCompletionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Customer Satisfaction</span>
                  <span className="font-medium">{stats?.satisfactionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${stats?.satisfactionRate ?? 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />
    </div>
  );
}
