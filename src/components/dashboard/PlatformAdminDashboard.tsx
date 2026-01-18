import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Building2, Users, Calendar, Bot, TrendingUp, Activity, DollarSign, FileText, Megaphone, Package, Shield, Target, UserCircle, ChevronDown, ChevronUp, ExternalLink, Smartphone, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const weekAgo = subDays(now, 7).toISOString();

      const [companies, profiles, appointments, allQuotes, invoices, campaigns, customers, leads, inventory, warranties, recentCompanies, integrations, agentEvents] = await Promise.all([
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
        supabase.from('companies').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('tenant_integrations').select('id, twilio_account_sid, elevenlabs_api_key, resend_api_key'),
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
        i.twilio_account_sid || i.elevenlabs_api_key || i.resend_api_key
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
        warranties: warranties.count ?? 0,
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
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
      <PageHeader
        icon={LayoutDashboard}
        title="Platform Dashboard"
        description="Welcome to the Aura Intercept admin panel"
      />

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
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white">New Signups (7 days)</span>
                <span className="text-sm font-medium text-cyan-400">{stats?.recentSignups ?? 0} companies</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white">Active Integrations</span>
                <span className="text-sm font-medium text-purple-400">{stats?.activeIntegrations ?? 0} configured</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white">AI Agent Events (7 days)</span>
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


      {/* Company Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Company Breakdown
          </CardTitle>
          <CardDescription className="text-white/70">
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
                    <TableRow className="border-slate-600">
                      <TableHead className="text-white/70">Company</TableHead>
                      <TableHead className="text-white/70 text-center">Users</TableHead>
                      <TableHead className="text-white/70 text-center">Customers</TableHead>
                      <TableHead className="text-white/70 text-center">Leads</TableHead>
                      <TableHead className="text-white/70 text-center">Appointments</TableHead>
                      <TableHead className="text-white/70 text-center">Quotes</TableHead>
                      <TableHead className="text-white/70 text-center">Invoices</TableHead>
                      <TableHead className="text-white/70 text-center">Revenue</TableHead>
                      <TableHead className="text-white/70 text-center">Inventory</TableHead>
                      <TableHead className="text-white/70 text-center">Campaigns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllCompanies ? companyBreakdown : companyBreakdown?.slice(0, 5))?.map((company) => (
                      <TableRow key={company.id} className="border-slate-700 hover:bg-slate-700/30 cursor-pointer" onClick={() => navigate(`/dashboard/analytics?company=${company.id}`)}>
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2 group">
                            {company.name}
                            <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-primary transition-colors" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30">
                            {company.users}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            {company.customers}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            {company.leads}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                            {company.appointments}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            {company.quotes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {company.invoices}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-400 font-medium">
                            ${company.revenue.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {company.inventory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
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