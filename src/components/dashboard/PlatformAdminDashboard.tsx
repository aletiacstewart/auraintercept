import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Building2, Users, Calendar, Bot, TrendingUp, Activity, DollarSign, FileText, Megaphone, Package, Target, UserCircle, ChevronDown, ChevronUp, ExternalLink, Smartphone, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DashboardSetupNav } from './DashboardSetupNav';
import { AuraCommandCenter } from './AuraCommandCenter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CompanyStats {
  id: string;
  name: string;
  users: number;
  customers: number;
  appointments: number;
  leads: number;
  quotes: number;
  invoices: number;
  revenue: number;
  inventory: number;
  campaigns: number;
}

export function PlatformAdminDashboard() {
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const weekAgo = subDays(now, 7).toISOString();

    const [companies, profiles, appointments, allQuotes, invoices, campaigns, customers, leads, inventory, recentCompanies, integrations, agentEvents] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id, status'),
        supabase.from('quotes').select('id, status'),
        supabase.from('invoices').select('total, status, paid_at'),
        supabase.from('marketing_campaigns').select('id, status').eq('status', 'active'),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id, status'),
        supabase.from('inventory_items').select('id, quantity, min_quantity'),
        supabase.from('companies').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('tenant_integrations_safe').select('id, has_signalwire, has_elevenlabs, has_resend'),
        supabase.from('ai_agent_events').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
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

      // Calculate platform activity metrics
      const recentSignups = recentCompanies.count ?? 0;
      const integrationsData = integrations.data ?? [];
      const activeIntegrations = integrationsData.filter(i => 
        i.has_signalwire || i.has_elevenlabs || i.has_resend
      ).length;
      const recentAgentEvents = agentEvents.count ?? 0;

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
        leadConversionRate,
        quoteConversionRate,
        appointmentCompletionRate,
        recentSignups,
        activeIntegrations,
        recentAgentEvents,
      };
    },
  });

  // Fetch per-company breakdown
  const { data: companyBreakdown, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: ['company-breakdown'],
    queryFn: async () => {
      // Get all companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (!companiesData) return [];

      // Fetch all related data in parallel
      const [profiles, customers, appointments, leads, quotes, invoices, inventory, campaigns] = await Promise.all([
        supabase.from('profiles').select('id, company_id'),
        supabase.from('customer_profiles').select('id, company_id'),
        supabase.from('appointments').select('id, company_id'),
        supabase.from('leads').select('id, company_id'),
        supabase.from('quotes').select('id, company_id'),
        supabase.from('invoices').select('id, company_id, total, status'),
        supabase.from('inventory_items').select('id, company_id'),
        supabase.from('marketing_campaigns').select('id, company_id'),
      ]);

      // Build per-company stats
      const companyStats: CompanyStats[] = companiesData.map(company => {
        const companyProfiles = (profiles.data ?? []).filter(p => p.company_id === company.id);
        const companyCustomers = (customers.data ?? []).filter(c => c.company_id === company.id);
        const companyAppointments = (appointments.data ?? []).filter(a => a.company_id === company.id);
        const companyLeads = (leads.data ?? []).filter(l => l.company_id === company.id);
        const companyQuotes = (quotes.data ?? []).filter(q => q.company_id === company.id);
        const companyInvoices = (invoices.data ?? []).filter(i => i.company_id === company.id);
        const companyInventory = (inventory.data ?? []).filter(i => i.company_id === company.id);
        const companyCampaigns = (campaigns.data ?? []).filter(c => c.company_id === company.id);
        
        const paidInvoices = companyInvoices.filter(i => i.status === 'paid');
        const revenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

        return {
          id: company.id,
          name: company.name,
          users: companyProfiles.length,
          customers: companyCustomers.length,
          appointments: companyAppointments.length,
          leads: companyLeads.length,
          quotes: companyQuotes.length,
          invoices: companyInvoices.length,
          revenue,
          inventory: companyInventory.length,
          campaigns: companyCampaigns.length,
        };
      });

      // Sort by revenue descending
      return companyStats.sort((a, b) => b.revenue - a.revenue);
    },
  });

  const statCards = [
    { 
      title: 'Total Companies', 
      value: stats?.companies ?? 0, 
      icon: Building2, 
      description: 'Active tenants on the platform',
      colorClass: 'text-feature-companies'
    },
    { 
      title: 'Total Users', 
      value: stats?.users ?? 0, 
      icon: Users, 
      description: 'Admins and employees',
      colorClass: 'text-feature-employees'
    },
    { 
      title: 'Customers', 
      value: stats?.customers ?? 0, 
      icon: UserCircle, 
      description: 'Across all companies',
      colorClass: 'text-feature-customers'
    },
    { 
      title: 'Leads', 
      value: stats?.leads ?? 0, 
      icon: Target, 
      description: `${stats?.newLeads ?? 0} new leads`,
      colorClass: 'text-feature-leads'
    },
    { 
      title: 'Appointments', 
      value: stats?.appointments ?? 0, 
      icon: Calendar, 
      description: 'Scheduled across all companies',
      colorClass: 'text-feature-appointments'
    },
    { 
      title: 'AI Agents Active', 
      value: stats?.companies ?? 0, 
      icon: Bot, 
      description: 'Deployed AI agents',
      colorClass: 'text-primary'
    },
    { 
      title: 'Platform Revenue', 
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, 
      icon: DollarSign, 
      description: 'Total collected',
      colorClass: 'text-feature-invoices',
      isString: true
    },
    { 
      title: 'Monthly Revenue', 
      value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, 
      icon: TrendingUp, 
      description: 'This month',
      colorClass: 'text-feature-invoices',
      isString: true
    },
    { 
      title: 'Pending Quotes', 
      value: stats?.pendingQuotes ?? 0, 
      icon: FileText, 
      description: 'Awaiting customer response',
      colorClass: 'text-feature-quotes'
    },
    { 
      title: 'Inventory', 
      value: stats?.inventoryCount ?? 0, 
      icon: Package, 
      description: stats?.lowStockItems ? `${stats.lowStockItems} low stock` : 'Items tracked',
      colorClass: 'text-feature-inventory'
    },
    { 
      title: 'Active Campaigns', 
      value: stats?.activeCampaigns ?? 0, 
      icon: Megaphone, 
      description: 'Marketing campaigns running',
      colorClass: 'text-feature-marketing'
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
      <PageHeader
        icon={LayoutDashboard}
        title="Platform Dashboard"
        description="Welcome to the Aura Intercept admin panel"
        featureColor="overview"
        showAuraBar
      />

      {/* Setup Navigation & Progress */}
      <DashboardSetupNav />

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="relative overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.colorClass.replace('text-', 'bg-')}/15 flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.colorClass}`} />
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
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.description}</p>
            </CardContent>
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
            <CardDescription className="text-muted-foreground">Recent activity across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-sm text-foreground">System Status</span>
                <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-sm text-foreground">New Signups (7 days)</span>
                <span className="text-sm font-medium text-cyan-400">{stats?.recentSignups ?? 0} companies</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-sm text-foreground">Active Integrations</span>
                <span className="text-sm font-medium text-purple-400">{stats?.activeIntegrations ?? 0} configured</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-sm text-foreground">AI Agent Events (7 days)</span>
                <span className="text-sm font-medium text-amber-400">{stats?.recentAgentEvents ?? 0} events</span>
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
            <CardDescription className="text-muted-foreground">Platform performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly Active Companies</span>
                  <span className="font-medium">{stats?.companies ?? 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${Math.min((stats?.companies ?? 0) * 10, 100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Lead Conversion</span>
                  <span className="font-medium">{stats?.leadConversionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${stats?.leadConversionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quote Conversion</span>
                  <span className="font-medium">{stats?.quoteConversionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${stats?.quoteConversionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Appointment Completion</span>
                  <span className="font-medium">{stats?.appointmentCompletionRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${stats?.appointmentCompletionRate ?? 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Company Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Company Breakdown
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Per-company metrics and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBreakdown ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Company</TableHead>
                      <TableHead className="text-center">Users</TableHead>
                      <TableHead className="text-center">Customers</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-center">Appointments</TableHead>
                      <TableHead className="text-center">Quotes</TableHead>
                      <TableHead className="text-center">Invoices</TableHead>
                      <TableHead className="text-center">Revenue</TableHead>
                      <TableHead className="text-center">Inventory</TableHead>
                      <TableHead className="text-center">Campaigns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllCompanies ? companyBreakdown : companyBreakdown?.slice(0, 5))?.map((company) => (
                      <TableRow key={company.id} className="border-border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/dashboard/analytics?company=${company.id}`)}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2 group">
                            {company.name}
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-employees/20 text-feature-employees border-feature-employees/30">
                            {company.users}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-customers/20 text-feature-customers border-feature-customers/30">
                            {company.customers}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-leads/20 text-feature-leads border-feature-leads/30">
                            {company.leads}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-appointments/20 text-feature-appointments border-feature-appointments/30">
                            {company.appointments}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-quotes/20 text-feature-quotes border-feature-quotes/30">
                            {company.quotes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-invoices/20 text-feature-invoices border-feature-invoices/30">
                            {company.invoices}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-400 font-medium">
                            ${company.revenue.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-inventory/20 text-feature-inventory border-feature-inventory/30">
                            {company.inventory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-feature-marketing/20 text-feature-marketing border-feature-marketing/30">
                            {company.campaigns}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {(companyBreakdown?.length ?? 0) > 5 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllCompanies(!showAllCompanies)}
                    className="gap-2"
                  >
                    {showAllCompanies ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show All {companyBreakdown?.length} Companies
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  );
}