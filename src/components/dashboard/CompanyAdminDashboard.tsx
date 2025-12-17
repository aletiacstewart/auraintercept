import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Bot, MessageSquare, Plus, Settings, Puzzle, FileText, Receipt, Package, DollarSign, AlertTriangle } from 'lucide-react';
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

      const [employees, appointments, quotes, invoices, inventory, monthlyRevenue] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('quotes').select('id, total_amount, status').eq('company_id', companyId).in('status', ['draft', 'sent']),
        supabase.from('invoices').select('id, total, status').eq('company_id', companyId),
        supabase.from('inventory_items').select('id, quantity, min_quantity').eq('company_id', companyId).eq('is_active', true),
        supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('paid_at', monthStart).lte('paid_at', monthEnd),
      ]);

      // Calculate totals
      const openQuotes = quotes.data ?? [];
      const openQuotesTotal = openQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      
      const allInvoices = invoices.data ?? [];
      const outstandingInvoices = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      
      const revenue = (monthlyRevenue.data ?? []).reduce((sum, i) => sum + (i.total || 0), 0);

      // Calculate low stock items
      const lowStockCount = (inventory.data ?? []).filter(item => item.quantity < item.min_quantity).length;

      return {
        employees: employees.count ?? 0,
        appointments: appointments.count ?? 0,
        openQuotes: openQuotes.length,
        openQuotesTotal,
        outstandingInvoices: outstandingInvoices.length,
        outstandingTotal,
        monthlyRevenue: revenue,
        lowStockAlerts: lowStockCount,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = companyLoading || statsLoading;

  const quickActions = [
    { label: 'Add Employee', icon: Plus, href: '/dashboard/employees', color: 'bg-primary' },
    { label: 'Create Quote', icon: FileText, href: '/dashboard/quotes', color: 'bg-secondary' },
    { label: 'Create Invoice', icon: Receipt, href: '/dashboard/invoices', color: 'bg-accent' },
    { label: 'View Inventory', icon: Package, href: '/dashboard/inventory', color: 'bg-muted-foreground' },
    { label: 'Configure AI', icon: Bot, href: '/dashboard/agent', color: 'bg-primary' },
    { label: 'Integrations', icon: Puzzle, href: '/dashboard/integrations', color: 'bg-secondary' },
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
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.employees ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Team members</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
            <Calendar className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.appointments ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Quotes</CardTitle>
            <FileText className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.openQuotes ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              ${(stats?.openQuotesTotal ?? 0).toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <Receipt className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.outstandingInvoices ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              ${(stats?.outstandingTotal ?? 0).toLocaleString()} unpaid
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Month)</CardTitle>
            <DollarSign className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                ${(stats?.monthlyRevenue ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className={`text-3xl font-bold ${(stats?.lowStockAlerts ?? 0) > 0 ? 'text-yellow-600' : ''}`}>
                {stats?.lowStockAlerts ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Items need reorder</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Agent</CardTitle>
            <Bot className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to assist</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
            <MessageSquare className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                onClick={() => navigate(action.href)}
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-medium text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />
    </div>
  );
}