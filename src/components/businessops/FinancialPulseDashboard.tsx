import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  Calendar,
  Shield,
  Megaphone,
  CreditCard,
  XCircle
} from 'lucide-react';
import { format, isPast, parseISO, subDays, addDays } from 'date-fns';
import { AuraLiveStream } from '@/components/aura/AuraLiveStream';

interface FinancialPulseDashboardProps {
  companyId: string;
  onNavigate: (section: 'inventory' | 'payments') => void;
  showQuotes?: boolean;
  userRole?: string;
}

export function FinancialPulseDashboard({ companyId, onNavigate, userRole }: FinancialPulseDashboardProps) {
  const navigate = useNavigate();
  
  // Fetch all quotes
  const { data: quotes = [] } = useQuery({
    queryKey: ['all-quotes', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch all invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['all-invoices', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
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

  // Fetch upcoming appointments (next 7 days)
  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['upcoming-appointments', companyId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const sevenDaysFromNow = addDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from('appointments')
        .select('id, customer_name, datetime, service_type, status')
        .eq('company_id', companyId)
        .gte('datetime', now)
        .lte('datetime', sevenDaysFromNow)
        .in('status', ['scheduled', 'confirmed'])
        .order('datetime', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch active warranties count
  const { data: activeWarranties = 0 } = useQuery({
    queryKey: ['active-warranties-count', companyId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from('warranty_records')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('expiration_date', now);
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Fetch active campaigns count
  const { data: campaignStats } = useQuery({
    queryKey: ['campaign-stats', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('id, status')
        .eq('company_id', companyId);
      const campaigns = data || [];
      return {
        active: campaigns.filter(c => c.status === 'active').length,
        total: campaigns.length,
      };
    },
    enabled: !!companyId,
  });

  // Check if Stripe is connected for this company
  const { data: stripeConnected } = useQuery({
    queryKey: ['stripe-connection', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('stripe_customer_id')
        .eq('id', companyId)
        .maybeSingle();
      return !!data?.stripe_customer_id;
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
      {/* Aura Live Activity Stream */}
      <AuraLiveStream companyId={companyId} />

      {/* Summary Stats - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-leads/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/leads')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <UserPlus className="h-5 w-5 text-feature-leads" />
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                30d
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-leads">{newLeads.length}</p>
            <p className="text-xs text-white/70">New Leads</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-quotes/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/quotes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-feature-quotes" />
              <Badge variant="outline" className="bg-feature-quotes/20 text-feature-quotes border-feature-quotes/30">
                {quotes.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-quotes">${pendingQuoteValue.toFixed(0)}</p>
            <p className="text-xs text-white/70">Pending Quotes</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-invoices/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/invoices')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Receipt className="h-5 w-5 text-feature-invoices" />
              <Badge variant="outline" className={`${overdueInvoices.length > 0 ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-feature-invoices/20 text-feature-invoices border-feature-invoices/30'}`}>
                {invoices.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-invoices">${unpaidInvoiceValue.toFixed(0)}</p>
            <p className="text-xs text-white/70">Unpaid Invoices</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-inventory/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/inventory')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Package className="h-5 w-5 text-feature-inventory" />
              {inventoryAlerts.length > 0 && (
                <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-inventory">{inventoryAlerts.length}</p>
            <p className="text-xs text-white/70">Low Stock Alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-appointments/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/appointments')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-feature-appointments" />
              <Badge variant="outline" className="bg-feature-appointments/20 text-feature-appointments border-feature-appointments/30">
                7d
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-appointments">{upcomingAppointments.length}</p>
            <p className="text-xs text-white/70">Upcoming Appts</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-warranties/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/warranties')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-feature-warranties" />
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-warranties">{activeWarranties}</p>
            <p className="text-xs text-white/70">Active Warranties</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-slate-800 border-white/10 hover:border-feature-marketing/40 transition-colors cursor-pointer" 
          onClick={() => navigate('/dashboard/campaigns')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Megaphone className="h-5 w-5 text-feature-marketing" />
              <Badge variant="outline" className="bg-feature-marketing/20 text-feature-marketing border-feature-marketing/30">
                {campaignStats?.total || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-feature-marketing">{campaignStats?.active || 0}</p>
            <p className="text-xs text-white/70">Active Campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-white/10 hover:border-accent/40 transition-colors cursor-pointer" onClick={() => onNavigate('payments')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {stripeConnected ? (
                <CreditCard className="h-5 w-5 text-feature-invoices" />
              ) : (
                <DollarSign className="h-5 w-5 text-amber-400" />
              )}
              {stripeConnected ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <p className={`text-2xl font-bold mt-2 ${stripeConnected ? 'text-green-400' : 'text-amber-400'}`}>
              {stripeConnected ? 'Connected' : 'Setup'}
            </p>
            <p className="text-xs text-white/70">Payment Gateway</p>
          </CardContent>
        </Card>
      </div>


      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quotes */}
        <Card className="bg-slate-800 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
                <FileText className="h-4 w-4 text-feature-quotes" />
                Quotes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No quotes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map(quote => {
                    const isPending = quote.status === 'draft' || quote.status === 'sent';
                    const isAccepted = quote.status === 'accepted';
                    return (
                      <div 
                        key={quote.id} 
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors border border-white/5 cursor-pointer ${isAccepted ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                        onClick={() => navigate(`/dashboard/quotes?id=${quote.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white">{quote.customer_name}</p>
                          <p className="text-xs text-white/60">
                            {format(new Date(quote.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isAccepted ? 'bg-green-500/20 text-green-400 border-green-500/30' : isPending ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-accent/10 text-accent border-accent/30'}`}
                          >
                            {isPending ? 'pending' : quote.status}
                          </Badge>
                          <span className="font-semibold text-sm text-white">${quote.total_amount?.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="bg-slate-800 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
                <Receipt className="h-4 w-4 text-feature-invoices" />
                Invoices
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <Receipt className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No invoices</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map(invoice => {
                    const isPaid = invoice.status === 'paid';
                    const isOverdue = invoice.due_date && isPast(parseISO(invoice.due_date)) && invoice.status !== 'paid';
                    return (
                      <div 
                        key={invoice.id} 
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors border border-white/5 cursor-pointer ${isPaid ? 'bg-green-500/10 hover:bg-green-500/20' : isOverdue ? 'bg-destructive/20 hover:bg-destructive/30' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                        onClick={() => navigate(`/dashboard/invoices?id=${invoice.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white">{invoice.customer_name}</p>
                          <div className="flex items-center gap-1 text-xs text-white/60">
                            <Clock className="h-3 w-3" />
                            {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d') : 'No due date'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isPaid ? 'bg-green-500/20 text-green-400 border-green-500/30' : isOverdue ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}
                          >
                            {isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid'}
                          </Badge>
                          <span className="font-semibold text-sm text-white">${invoice.total?.toFixed(0)}</span>
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

      {inventoryAlerts.length > 0 && (
        <Card className="bg-slate-800 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Inventory Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/inventory')} className="text-accent hover:text-accent hover:bg-accent/10">
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
                <Badge variant="outline" className="bg-slate-700 text-white/70 border-white/10">
                  +{inventoryAlerts.length - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card className="bg-slate-800 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
                <Calendar className="h-4 w-4 text-accent" />
                Upcoming Appointments (7 days)
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/appointments')} className="text-accent hover:text-accent hover:bg-accent/10">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAppointments.map(appt => (
                <div 
                  key={appt.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors border border-white/5 cursor-pointer"
                  onClick={() => navigate(`/dashboard/appointments?id=${appt.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-white">{appt.customer_name}</p>
                    <p className="text-xs text-white/60">{appt.service_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 text-xs">
                      {format(new Date(appt.datetime), 'MMM d, h:mm a')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
