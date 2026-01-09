import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Receipt, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { format, isPast, parseISO, subDays } from 'date-fns';

interface FinancialPulseDashboardProps {
  companyId: string;
  onNavigate: (section: 'inventory' | 'payments') => void;
  showQuotes?: boolean;
  userRole?: string;
}

export function FinancialPulseDashboard({ companyId, onNavigate, userRole }: FinancialPulseDashboardProps) {
  const isPlatformAdmin = userRole === 'platform_admin';
  // Fetch pending quotes for display only
  const { data: quotes = [] } = useQuery({
    queryKey: ['pending-quotes', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['draft', 'sent'])
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch unpaid invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['unpaid-invoices', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['draft', 'sent', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch low stock inventory
  const { data: inventoryAlerts = [] } = useQuery({
    queryKey: ['inventory-alerts', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      // Filter for low stock items
      return (data || []).filter(item => item.quantity <= item.min_quantity);
    },
    enabled: !!companyId,
  });

  // Fetch new leads (customers created in last 30 days)
  const { data: newLeads = [] } = useQuery({
    queryKey: ['new-leads', companyId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('customer_profiles')
        .select('id, name, email, phone, created_at')
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Calculate totals
  const pendingQuoteValue = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const unpaidInvoiceValue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const overdueInvoices = invoices.filter(i => 
    i.status === 'overdue' || (i.due_date && isPast(parseISO(i.due_date)) && i.status !== 'paid')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-accent/20">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Business Ops Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time business operations overview</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <UserPlus className="h-5 w-5 text-green-500" />
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                30d
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{newLeads.length}</p>
            <p className="text-xs text-muted-foreground">New Leads</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-accent" />
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                {quotes.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">${pendingQuoteValue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Pending Quotes</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Receipt className="h-5 w-5 text-accent" />
              <Badge variant="outline" className={`${overdueInvoices.length > 0 ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-accent/10 text-accent border-accent/30'}`}>
                {invoices.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">${unpaidInvoiceValue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Unpaid Invoices</p>
          </CardContent>
        </Card>

        {isPlatformAdmin && (
          <Card className={`glass-panel transition-colors cursor-pointer ${inventoryAlerts.length > 0 ? 'border-destructive/40 hover:border-destructive/60' : 'border-accent/20 hover:border-accent/40'}`} onClick={() => onNavigate('inventory')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-accent" />
                {inventoryAlerts.length > 0 && (
                  <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{inventoryAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Low Stock Alerts</p>
            </CardContent>
          </Card>
        )}

        <Card className="glass-panel border-accent/20 hover:border-accent/40 transition-colors cursor-pointer" onClick={() => onNavigate('payments')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-accent" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">Active</p>
            <p className="text-xs text-muted-foreground">Payment Gateway</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Quotes - display only */}
        <Card className="glass-panel border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Pending Quotes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No pending quotes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map(quote => (
                    <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{quote.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(quote.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                          {quote.status}
                        </Badge>
                        <span className="font-semibold text-sm">${quote.total_amount?.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Unpaid Invoices */}
        <Card className="glass-panel border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-accent" />
                Unpaid Invoices
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Receipt className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">All invoices paid</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map(invoice => {
                    const isOverdue = invoice.due_date && isPast(parseISO(invoice.due_date)) && invoice.status !== 'paid';
                    return (
                      <div key={invoice.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isOverdue ? 'bg-destructive/10 hover:bg-destructive/20' : 'bg-background/50 hover:bg-background/80'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{invoice.customer_name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d') : 'No due date'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isOverdue ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-accent/10 text-accent border-accent/30'}`}
                          >
                            {isOverdue ? 'Overdue' : invoice.status}
                          </Badge>
                          <span className="font-semibold text-sm">${invoice.total?.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alerts - Platform Admin Only */}
      {isPlatformAdmin && inventoryAlerts.length > 0 && (
        <Card className="glass-panel border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Inventory Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('inventory')} className="text-accent hover:text-accent hover:bg-accent/10">
                Manage <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inventoryAlerts.slice(0, 6).map(item => (
                <Badge key={item.id} variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                  {item.name}: {item.quantity} left
                </Badge>
              ))}
              {inventoryAlerts.length > 6 && (
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  +{inventoryAlerts.length - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
