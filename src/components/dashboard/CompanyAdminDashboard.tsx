import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Users, Calendar, MessageSquare, Puzzle, FileText, Receipt, DollarSign, Activity, TrendingUp, Download, Copy, UserCircle, ExternalLink, Target, Package, Shield, Megaphone, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { DashboardSetupNav } from './DashboardSetupNav';
import { DashboardOnboardingHub } from './DashboardOnboardingHub';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CompanyGuidesPDF } from '@/components/documentation/CompanyGuidesPDF';

export function CompanyAdminDashboard() {
  const { companyId, userRole } = useAuth();
  const { isAtLeastTier, inTrial } = useSubscription();
  const navigate = useNavigate();
  
  // Platform admin sees everything
  const isPlatformAdmin = userRole === 'platform_admin';

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

      const [employees, customers, appointments, quotes, invoices, monthlyRevenue, feedback, reminderLogs, leads, inventory, warranties, campaigns] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id, status').eq('company_id', companyId),
        supabase.from('quotes').select('id, total_amount, status').eq('company_id', companyId),
        supabase.from('invoices').select('id, total, status, quote_id').eq('company_id', companyId),
        supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
        supabase.from('customer_feedback').select('rating').eq('company_id', companyId).not('rating', 'is', null),
        supabase.from('reminder_logs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('leads').select('id, status').eq('company_id', companyId),
        supabase.from('inventory_items').select('id, quantity, min_quantity').eq('company_id', companyId),
        supabase.from('warranty_policies').select('id').eq('company_id', companyId),
        supabase.from('marketing_campaigns').select('id, status').eq('company_id', companyId),
      ]);

      // Calculate totals
      const allQuotes = quotes.data ?? [];
      const openQuotes = allQuotes.filter(q => q.status === 'draft' || q.status === 'sent');
      const openQuotesTotal = openQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      
      const allInvoices = invoices.data ?? [];
      const outstandingInvoices = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      
      const revenue = (monthlyRevenue.data ?? []).reduce((sum, i) => sum + (i.total || 0), 0);

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

      // Calculate lead conversion rate
      const allLeads = leads.data ?? [];
      const convertedLeads = allLeads.filter(l => l.status === 'converted' || l.status === 'won').length;
      const totalLeadsForConversion = allLeads.length;
      const leadConversionRate = totalLeadsForConversion > 0 ? Math.round((convertedLeads / totalLeadsForConversion) * 100) : 0;

      // Messages count (reminder logs as proxy)
      const messagesCount = reminderLogs.count ?? 0;

      // Calculate inventory stats
      const allInventory = inventory.data ?? [];
      const inventoryCount = allInventory.length;
      const lowStockItems = allInventory.filter(item => 
        item.quantity !== null && item.min_quantity !== null && item.quantity <= item.min_quantity
      ).length;

      // Warranty policies count
      const warrantyCount = warranties.data?.length ?? 0;

      // Marketing campaigns stats
      const allCampaigns = campaigns.data ?? [];
      const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
      const totalCampaigns = allCampaigns.length;

      return {
        employees: employees.count ?? 0,
        customers: customers.count ?? 0,
        leads: allLeads.length,
        newLeads: allLeads.filter(l => l.status === 'new').length,
        appointments: allAppointments.length,
        openQuotes: openQuotes.length,
        openQuotesTotal,
        outstandingInvoices: outstandingInvoices.length,
        outstandingTotal,
        monthlyRevenue: revenue,
        quoteConversionRate,
        appointmentCompletionRate,
        satisfactionRate,
        leadConversionRate,
        messagesCount,
        inventoryCount,
        lowStockItems,
        warrantyCount,
        activeCampaigns,
        totalCampaigns,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = companyLoading || statsLoading;

  // Helper to check tier access
  const hasTierAccess = (requiredTier?: SubscriptionTier) => {
    if (!requiredTier) return true;
    if (isPlatformAdmin) return true;
    if (inTrial) return true;
    return isAtLeastTier(requiredTier);
  };

  const allStatCards = [
    { 
      title: 'Employees', 
      value: stats?.employees ?? 0, 
      icon: Users, 
      description: 'Team members',
      colorClass: 'bg-feature-employees/15 text-feature-employees',
      href: '/dashboard/employees'
    },
    { 
      title: 'Customers', 
      value: stats?.customers ?? 0, 
      icon: UserCircle, 
      description: 'Total customers',
      colorClass: 'bg-feature-customers/15 text-feature-customers',
      href: '/dashboard/customers'
    },
    { 
      title: 'Leads', 
      value: stats?.leads ?? 0, 
      icon: Target, 
      description: `${stats?.newLeads ?? 0} new`,
      colorClass: 'bg-feature-leads/15 text-feature-leads',
      href: '/dashboard/leads',
      requiredTier: 'multi_track' as SubscriptionTier
    },
    {
      title: 'Appointments', 
      value: stats?.appointments ?? 0, 
      icon: Calendar, 
      description: 'Total scheduled',
      colorClass: 'bg-feature-appointments/15 text-feature-appointments',
      href: '/dashboard/appointments'
    },
    { 
      title: 'Open Quotes', 
      value: stats?.openQuotes ?? 0, 
      icon: FileText, 
      description: `$${(stats?.openQuotesTotal ?? 0).toLocaleString()} total`,
      colorClass: 'bg-feature-quotes/15 text-feature-quotes',
      href: '/dashboard/quotes'
    },
    { 
      title: 'Outstanding', 
      value: stats?.outstandingInvoices ?? 0, 
      icon: Receipt, 
      description: `$${(stats?.outstandingTotal ?? 0).toLocaleString()} unpaid`,
      colorClass: 'bg-feature-invoices/15 text-feature-invoices',
      href: '/dashboard/invoices',
      requiredTier: 'multi_track' as SubscriptionTier
    },
    { 
      title: 'Revenue (Month)', 
      value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, 
      icon: DollarSign, 
      description: format(new Date(), 'MMMM yyyy'),
      colorClass: 'bg-green-500/15 text-green-500',
      isString: true,
      href: '/dashboard/analytics'
    },
    { 
      title: 'Messages', 
      value: stats?.messagesCount ?? 0, 
      icon: MessageSquare, 
      description: 'This month',
      colorClass: 'bg-channel-sms/15 text-channel-sms',
      href: '/dashboard/messages'
    },
    { 
      title: 'Inventory', 
      value: stats?.inventoryCount ?? 0, 
      icon: Package, 
      description: stats?.lowStockItems ? `${stats.lowStockItems} low stock` : 'Items tracked',
      colorClass: 'bg-feature-inventory/15 text-feature-inventory',
      href: '/dashboard/inventory',
      requiredTier: 'multi_track' as SubscriptionTier
    },
    { 
      title: 'Warranties', 
      value: stats?.warrantyCount ?? 0, 
      icon: Shield, 
      description: 'Active policies',
      colorClass: 'bg-feature-warranties/15 text-feature-warranties',
      href: '/dashboard/warranties',
      requiredTier: 'command' as SubscriptionTier
    },
    { 
      title: 'Campaigns', 
      value: stats?.activeCampaigns ?? 0, 
      icon: Megaphone, 
      description: `${stats?.totalCampaigns ?? 0} total campaigns`,
      colorClass: 'bg-feature-marketing/15 text-feature-marketing',
      href: '/dashboard/campaigns',
      requiredTier: 'command' as SubscriptionTier
    },
  ];

  // Filter stat cards by tier
  const statCards = allStatCards.filter(card => hasTierAccess(card.requiredTier));

  const allQuickActions = [
    { label: 'Appointments', icon: Calendar, colorClass: 'bg-feature-appointments/15 text-feature-appointments', href: '/dashboard/appointments' },
    { label: 'Analytics', icon: TrendingUp, colorClass: 'bg-feature-analytics/15 text-feature-analytics', href: '/dashboard/analytics' },
    { label: 'Communication Logs', icon: MessageSquare, colorClass: 'bg-channel-sms/15 text-channel-sms', href: '/dashboard/messages' },
    { label: 'Knowledge Base', icon: FileText, colorClass: 'bg-primary/15 text-primary', href: '/dashboard/knowledge' },
    { label: 'Inventory', icon: Package, colorClass: 'bg-feature-inventory/15 text-feature-inventory', href: '/dashboard/inventory', requiredTier: 'multi_track' as SubscriptionTier },
    { label: 'Warranties', icon: Shield, colorClass: 'bg-feature-warranties/15 text-feature-warranties', href: '/dashboard/warranties', requiredTier: 'command' as SubscriptionTier },
    { label: 'Campaigns', icon: Megaphone, colorClass: 'bg-feature-marketing/15 text-feature-marketing', href: '/dashboard/campaigns', requiredTier: 'command' as SubscriptionTier },
    { label: 'Calculators', icon: DollarSign, colorClass: 'bg-feature-analytics/15 text-feature-analytics', href: '/dashboard/calculators' },
    { label: 'Integrations', icon: Puzzle, colorClass: 'bg-muted text-muted-foreground', href: '/dashboard/3rd-party-overview' },
  ];

  // Filter quick actions by tier
  const quickActions = allQuickActions.filter(action => hasTierAccess(action.requiredTier));

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
      {/* Trial Banner */}
      <TrialBanner />

      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title={isLoading ? 'Loading...' : (company?.name || 'Company Dashboard')}
        description={`Company Dashboard ${companyId ? `• ID: ${companyId.slice(0, 8)}...` : ''}`}
        featureColor="overview"
        showAuraBar
        action={
          <div className="flex items-center gap-3 flex-wrap">
            {company?.registration_code && (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Registration Code:</span>
                <code className="text-sm font-mono font-bold text-foreground">{company.registration_code}</code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => {
                    navigator.clipboard.writeText(company.registration_code || '');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div 
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => navigate('/dashboard/ai-agents')}
            >
              <span className="text-xs text-muted-foreground">Intelligence Network:</span>
              <span className="text-sm font-medium text-green-600">Active</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <ExternalLink className="h-3 w-3 text-green-600 hover:text-green-500" />
            </div>
          </div>
        }
      />

      {/* Setup Navigation & Progress */}
      <DashboardSetupNav />

      {/* Onboarding Hub - Shows Launch Progress or Onboarding Checklist */}
      <DashboardOnboardingHub companyId={companyId || undefined} />
      <div className="flex items-center gap-4">
        <PDFDownloadLink 
          document={<CompanyGuidesPDF />} 
          fileName="company-admin-guide.pdf"
        >
          {({ loading }) => (
            <Button variant="outline" disabled={loading} className="gap-2">
              <Download className="h-4 w-4" />
              {loading ? 'Generating...' : 'Company Guide Download'}
            </Button>
          )}
        </PDFDownloadLink>
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
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden border-border/50 cursor-pointer hover:bg-slate-700/70 transition-colors"
            onClick={() => navigate(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-white">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.colorClass}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-1 pb-3 px-3">
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.isString ? stat.value : (stat.value as number).toLocaleString()}
                </div>
              )}
              <p className="text-[10px] text-white/70 mt-0.5">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Activity Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-white/70 text-xs">Common tasks to manage your business</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-2.5 px-1.5 flex flex-col items-center gap-1.5 hover:border-primary whitespace-normal"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.colorClass}`}>
                    <action.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-[10px] text-center leading-tight">{action.label}</span>
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
            <CardDescription className="text-white/70">Performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats?.quoteConversionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Appointment Completion</span>
                  <span className="font-medium">{stats?.appointmentCompletionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${stats?.appointmentCompletionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Customer Satisfaction</span>
                  <span className="font-medium">{stats?.satisfactionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${stats?.satisfactionRate ?? 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
    </PageContainer>
  );
}
