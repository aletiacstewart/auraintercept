import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Users, Calendar, MessageSquare, Puzzle, FileText, Receipt, DollarSign, Activity, TrendingUp, Download, Copy, UserCircle, ExternalLink, Target, Package, Megaphone, LayoutDashboard, Share2, Globe, PenTool, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { DashboardSetupNav } from './DashboardSetupNav';
import { DashboardOnboardingHub } from './DashboardOnboardingHub';
import { AuraCommandCenter } from './AuraCommandCenter';
import { AuraTodayStrip } from './AuraTodayStrip';
import { ROICalculator } from '@/components/integrations/ROICalculator';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CompanyGuidesPDF } from '@/components/documentation/CompanyGuidesPDF';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDashboardViewMode } from '@/hooks/useDashboardViewMode';
import { DashboardViewToggle } from './DashboardViewToggle';

export function CompanyAdminDashboard() {
  const { companyId, userRole } = useAuth();
  const { isAtLeastTier, inTrial } = useSubscription();
  const navigate = useNavigate();
  const { isSimple } = useDashboardViewMode();
  const [snapshotOpen, setSnapshotOpen] = useState(false);

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

      const { data: employeeProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId);
      
      const employeeIds = (employeeProfiles ?? []).map(p => p.id);

      const [employees, customers, appointments, quotes, invoices, monthlyRevenue, feedback, reminderLogs, leads, inventory, campaigns, socialPosts, blogPosts, siteMetrics] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id, status').eq('company_id', companyId),
        supabase.from('quotes').select('id, total_amount, status').eq('company_id', companyId),
        supabase.from('invoices').select('id, total, status, quote_id').eq('company_id', companyId),
        supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
        supabase.from('customer_feedback').select('rating').eq('company_id', companyId).not('rating', 'is', null),
        supabase.from('reminder_logs').select('id, channel', { count: 'exact' }).eq('company_id', companyId).gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('leads').select('id, status').eq('company_id', companyId),
        supabase.from('inventory_items').select('id, quantity, min_quantity').eq('company_id', companyId),
        supabase.from('marketing_campaigns').select('id, status').eq('company_id', companyId),
        supabase.from('scheduled_social_posts').select('id, status').eq('company_id', companyId),
        employeeIds.length > 0 
          ? supabase.from('blog_posts').select('id, published').in('author_id', employeeIds)
          : Promise.resolve({ data: [], count: 0 }),
        supabase.from('site_metrics').select('page_views, unique_visitors, chat_interactions').eq('company_id', companyId),
      ]);

      const allQuotes = quotes.data ?? [];
      const openQuotes = allQuotes.filter(q => q.status === 'draft' || q.status === 'sent');
      const openQuotesTotal = openQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      
      const allInvoices = invoices.data ?? [];
      const outstandingInvoices = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      
      const revenue = (monthlyRevenue.data ?? []).reduce((sum, i) => sum + (i.total || 0), 0);

      const acceptedQuotes = allQuotes.filter(q => q.status === 'accepted').length;
      const totalQuotesForConversion = allQuotes.filter(q => q.status !== 'draft').length;
      const quoteConversionRate = totalQuotesForConversion > 0 ? Math.round((acceptedQuotes / totalQuotesForConversion) * 100) : 0;

      const allAppointments = appointments.data ?? [];
      const completedAppointments = allAppointments.filter(a => a.status === 'completed').length;
      const totalAppointmentsForCompletion = allAppointments.filter(a => a.status !== 'scheduled').length;
      const appointmentCompletionRate = totalAppointmentsForCompletion > 0 ? Math.round((completedAppointments / totalAppointmentsForCompletion) * 100) : 0;

      const feedbackData = feedback.data ?? [];
      const avgRating = feedbackData.length > 0 
        ? feedbackData.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackData.length 
        : 0;
      const satisfactionRate = Math.round((avgRating / 5) * 100);

      const allLeads = leads.data ?? [];
      const convertedLeads = allLeads.filter(l => l.status === 'converted' || l.status === 'won').length;
      const totalLeadsForConversion = allLeads.length;
      const leadConversionRate = totalLeadsForConversion > 0 ? Math.round((convertedLeads / totalLeadsForConversion) * 100) : 0;

      const messagesCount = reminderLogs.count ?? 0;

      const allInventory = inventory.data ?? [];
      const inventoryCount = allInventory.length;
      const lowStockItems = allInventory.filter(item => 
        item.quantity !== null && item.min_quantity !== null && item.quantity <= item.min_quantity
      ).length;

      const allCampaigns = campaigns.data ?? [];
      const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
      const totalCampaigns = allCampaigns.length;

      const allSocialPosts = socialPosts.data ?? [];
      const publishedSocialPosts = allSocialPosts.filter(p => p.status === 'published').length;
      const scheduledSocialPosts = allSocialPosts.filter(p => p.status === 'pending').length;
      const totalSocialPosts = allSocialPosts.length;

      const allBlogPosts = blogPosts.data ?? [];
      const totalBlogPosts = allBlogPosts.length;

      const allSiteMetrics = siteMetrics.data ?? [];
      const totalPageViews = allSiteMetrics.reduce((sum, m) => sum + (m.page_views || 0), 0);
      const totalVisitors = allSiteMetrics.reduce((sum, m) => sum + (m.unique_visitors || 0), 0);
      const totalChatInteractions = allSiteMetrics.reduce((sum, m) => sum + (m.chat_interactions || 0), 0);

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
        activeCampaigns,
        totalCampaigns,
        publishedSocialPosts,
        scheduledSocialPosts,
        totalSocialPosts,
        totalBlogPosts,
        totalPageViews,
        totalVisitors,
        totalChatInteractions,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = companyLoading || statsLoading;

  const hasTierAccess = (requiredTier?: SubscriptionTier) => {
    if (!requiredTier) return true;
    if (isPlatformAdmin) return true;
    if (inTrial) return true;
    return isAtLeastTier(requiredTier);
  };

  const allStatCards = [
    { title: 'Employees', value: stats?.employees ?? 0, icon: Users, description: 'Team members', colorClass: 'bg-feature-employees/15 text-feature-employees', href: '/dashboard/employees' },
    { title: 'Customers', value: stats?.customers ?? 0, icon: UserCircle, description: 'Total customers', colorClass: 'bg-feature-customers/15 text-feature-customers', href: '/dashboard/customers' },
    { title: 'Leads', value: stats?.leads ?? 0, icon: Target, description: `${stats?.newLeads ?? 0} new`, colorClass: 'bg-feature-leads/15 text-feature-leads', href: '/dashboard/leads', requiredTier: 'multi_track' as SubscriptionTier },
    { title: 'Appointments', value: stats?.appointments ?? 0, icon: Calendar, description: 'Total scheduled', colorClass: 'bg-feature-appointments/15 text-feature-appointments', href: '/dashboard/appointments' },
    { title: 'Open Quotes', value: stats?.openQuotes ?? 0, icon: FileText, description: `$${(stats?.openQuotesTotal ?? 0).toLocaleString()} total`, colorClass: 'bg-feature-quotes/15 text-feature-quotes', href: '/dashboard/quotes' },
    { title: 'Outstanding', value: stats?.outstandingInvoices ?? 0, icon: Receipt, description: `$${(stats?.outstandingTotal ?? 0).toLocaleString()} unpaid`, colorClass: 'bg-feature-invoices/15 text-feature-invoices', href: '/dashboard/invoices', requiredTier: 'multi_track' as SubscriptionTier },
    { title: 'Revenue (Month)', value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, icon: DollarSign, description: format(new Date(), 'MMMM yyyy'), colorClass: 'bg-secondary/15 text-secondary', isString: true, href: '/dashboard/analytics' },
    { title: 'Messages', value: stats?.messagesCount ?? 0, icon: MessageSquare, description: 'This month', colorClass: 'bg-channel-sms/15 text-channel-sms', href: '/dashboard/messages' },
    { title: 'Inventory', value: stats?.inventoryCount ?? 0, icon: Package, description: stats?.lowStockItems ? `${stats.lowStockItems} low stock` : 'Items tracked', colorClass: 'bg-feature-inventory/15 text-feature-inventory', href: '/dashboard/inventory', requiredTier: 'multi_track' as SubscriptionTier },
    { title: 'Campaigns', value: stats?.activeCampaigns ?? 0, icon: Megaphone, description: `${stats?.totalCampaigns ?? 0} total campaigns`, colorClass: 'bg-feature-marketing/15 text-feature-marketing', href: '/dashboard/campaigns', requiredTier: 'command' as SubscriptionTier },
    { title: 'Social Posts', value: stats?.totalSocialPosts ?? 0, icon: Share2, description: `${stats?.publishedSocialPosts ?? 0} published, ${stats?.scheduledSocialPosts ?? 0} scheduled`, colorClass: 'bg-feature-marketing/15 text-feature-marketing', href: '/dashboard/social-content', requiredTier: 'command' as SubscriptionTier },
    { title: 'Blog Posts', value: stats?.totalBlogPosts ?? 0, icon: PenTool, description: 'Published articles', colorClass: 'bg-primary/15 text-primary', href: '/dashboard/blog', requiredTier: 'command' as SubscriptionTier },
    { title: 'Website Traffic', value: stats?.totalPageViews ?? 0, icon: Globe, description: `${stats?.totalVisitors ?? 0} visitors, ${stats?.totalChatInteractions ?? 0} chats`, colorClass: 'bg-feature-analytics/15 text-feature-analytics', href: '/dashboard/analytics', requiredTier: 'multi_track' as SubscriptionTier },
  ];

  // Simple mode: show only the 5 most actionable KPIs an SMB owner cares about daily.
  // Pro mode: show every tier-allowed stat card.
  const SIMPLE_TITLES = new Set(['Appointments', 'Open Quotes', 'Outstanding', 'Revenue (Month)', 'Leads']);
  const tierFilteredCards = allStatCards.filter(card => hasTierAccess(card.requiredTier));
  const statCards = isSimple
    ? tierFilteredCards.filter(c => SIMPLE_TITLES.has(c.title)).slice(0, 5)
    : tierFilteredCards;

  const allQuickActions = [
    { label: 'Appointments', icon: Calendar, colorClass: 'bg-feature-appointments/15 text-feature-appointments', href: '/dashboard/appointments' },
    { label: 'Analytics', icon: TrendingUp, colorClass: 'bg-feature-analytics/15 text-feature-analytics', href: '/dashboard/analytics' },
    { label: 'Communication Logs', icon: MessageSquare, colorClass: 'bg-channel-sms/15 text-channel-sms', href: '/dashboard/messages' },
    { label: 'Knowledge Base', icon: FileText, colorClass: 'bg-primary/15 text-primary', href: '/dashboard/knowledge' },
    { label: 'Inventory', icon: Package, colorClass: 'bg-feature-inventory/15 text-feature-inventory', href: '/dashboard/inventory', requiredTier: 'multi_track' as SubscriptionTier },
    { label: 'Campaigns', icon: Megaphone, colorClass: 'bg-feature-marketing/15 text-feature-marketing', href: '/dashboard/campaigns', requiredTier: 'command' as SubscriptionTier },
    { label: 'Calculators', icon: DollarSign, colorClass: 'bg-feature-analytics/15 text-feature-analytics', href: '/dashboard/calculators' },
    { label: 'Integrations', icon: Puzzle, colorClass: 'bg-muted text-muted-foreground', href: '/dashboard/3rd-party-overview' },
  ];

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
          
          action={
            <div className="flex items-center gap-3 flex-wrap">
              <DashboardViewToggle />
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
              {!isSimple && (
                <div 
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => navigate('/dashboard/ai-agents')}
                >
                  <span className="text-xs text-muted-foreground">Intelligence Network:</span>
                  <span className="text-sm font-medium text-secondary">Active</span>
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <ExternalLink className="h-3 w-3 text-secondary" />
                </div>
              )}
            </div>
          }
        />

        {/* Setup nav + onboarding hub: only show in Pro mode (or always, when still relevant) */}
        {!isSimple && (
          <>
            <DashboardSetupNav />
            <DashboardOnboardingHub companyId={companyId || undefined} />
          </>
        )}

        {/* Company guide download + logo — Pro mode only (clutter for daily users) */}
        {!isSimple && (
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
              className="w-16 h-16 rounded-xl border-2 border-primary overflow-hidden"
            >
              {company?.logo_url ? (
                <img src={company.logo_url} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                >
                  {company?.name?.charAt(0) || 'C'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TODAY KPI STRIP (Hero) ===== */}
        {companyId && <AuraTodayStrip companyId={companyId} />}

        {/* ===== AURA COMMAND CENTER (Primary) ===== */}
        <AuraCommandCenter />

        {/* ===== ROI CALCULATOR (Pro mode only — promotes embedded calculator) ===== */}
        {!isSimple && (
          <Card className="bg-card border-border border-t-2 border-t-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <DollarSign className="h-5 w-5 text-primary" />
                ROI Calculator — see what 24/7 AI saves you
              </CardTitle>
              <CardDescription>
                Live What-If sliders. Adjust your appointment volume and no-show rate to see your annual recovery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ROICalculator />
            </CardContent>
          </Card>
        )}

        {/* ===== BUSINESS SNAPSHOT (Collapsible) ===== */}
        <Collapsible open={snapshotOpen} onOpenChange={setSnapshotOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-lg hover:bg-accent"
            >
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Business Snapshot
              </span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', snapshotOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => (
                <Card 
                  key={stat.title} 
                  className="relative overflow-hidden cursor-pointer transition-all duration-300 group bg-card border-border hover:border-primary/40"
                  onClick={() => navigate(stat.href)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-lg ${stat.colorClass.replace('text-', 'bg-').replace('/15', '/60')}`} />
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-card-foreground/90 tracking-wide">
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
                      <div className="text-2xl font-bold text-card-foreground">
                        {stat.isString ? stat.value : (stat.value as number).toLocaleString()}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions & Business Metrics — Pro mode only */}
            {!isSimple && (
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="bg-card border-border border-t-2 border-t-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-card-foreground">
                      <Activity className="w-4 h-4 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks to manage your business</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          variant="outline"
                          className="h-auto py-2.5 px-1.5 flex flex-col items-center gap-1.5 whitespace-normal bg-muted/50 border-border hover:border-primary/40 hover:bg-accent text-card-foreground/80 transition-all duration-200"
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

                <Card className="bg-card border-border border-t-2 border-t-secondary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <TrendingUp className="w-5 h-5 text-secondary" />
                      Business Metrics
                    </CardTitle>
                    <CardDescription>Performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Lead Conversion', value: stats?.leadConversionRate ?? 0, colorVar: 'hsl(var(--secondary))' },
                        { label: 'Quote Conversion', value: stats?.quoteConversionRate ?? 0, colorVar: 'hsl(var(--primary))' },
                        { label: 'Appt. Completion', value: stats?.appointmentCompletionRate ?? 0, colorVar: 'hsl(var(--accent-foreground))' },
                        { label: 'Customer Satisfaction', value: stats?.satisfactionRate ?? 0, colorVar: 'hsl(var(--warning))' },
                      ].map(metric => (
                        <div key={metric.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm text-card-foreground/80">
                            <span>{metric.label}</span>
                            <span className="font-medium text-card-foreground">{metric.value}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted border border-border/50">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${metric.value}%`, background: metric.colorVar }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

      </div>
    </PageContainer>
  );
}
