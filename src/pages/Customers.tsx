import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AddCustomerForm } from '@/components/customers/AddCustomerForm';
import { InlineFormProvider, InlineFormHost } from '@/components/ui/inline-form-tabs';
import { IntakeSummary } from '@/components/forms/IntakeSummary';
import { IndustryEmptyState } from '@/components/shared/IndustryEmptyState';
import { IntakeDataSearch } from '@/components/search/IntakeDataSearch';

import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Star,
  MessageSquare,
  Ban,
  Check,
  ChevronRight,
  Loader2,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';
import { PageContainer } from '@/components/ui/page-container';

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  sms_opt_out: boolean | null;
  email_opt_out: boolean | null;
  call_opt_out: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CustomerAppointment {
  id: string;
  datetime: string;
  service_type: string;
  status: string;
  notes: string | null;
  intake_data?: Record<string, unknown> | null;
}

interface CustomerQuote {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
}

interface CustomerInvoice {
  id: string;
  created_at: string;
  status: string;
  total: number;
  invoice_number: string | null;
}

interface CustomerFeedback {
  id: string;
  created_at: string;
  rating: number | null;
  feedback_note: string | null;
  sentiment: string | null;
  service_type: string | null;
}

export default function Customers() {
  const { companyId, userRole } = useAuth();
  const { pack } = useIndustryPack();
  const header = getPageHeader('customers', pack);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  // Fetch customer profiles for the company
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomerProfile[];
    },
    enabled: !!companyId,
  });

  // Fetch customer details when selected
  const { data: customerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['customer-details', selectedCustomer?.id, selectedCustomer?.email],
    queryFn: async () => {
      if (!selectedCustomer || !companyId) return null;

      // Fetch appointments by customer email
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, datetime, service_type, status, notes, intake_data')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('datetime', { ascending: false })
        .limit(10);

      // Fetch quotes by customer email
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, created_at, status, total_amount')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch invoices by customer email
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, created_at, status, total, invoice_number')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch feedback by customer email
      const { data: feedback } = await supabase
        .from('customer_feedback')
        .select('id, created_at, rating, feedback_note, sentiment, service_type')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        appointments: (appointments || []) as CustomerAppointment[],
        quotes: (quotes || []) as CustomerQuote[],
        invoices: (invoices || []) as CustomerInvoice[],
        feedback: (feedback || []) as CustomerFeedback[],
      };
    },
    enabled: !!selectedCustomer && !!companyId,
  });

  // Filter customers based on search
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerClick = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      pending: 'outline',
      paid: 'secondary',
      draft: 'outline',
      sent: 'default',
      accepted: 'secondary',
      declined: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (!userRole || (userRole !== 'platform_admin' && userRole !== 'company_admin')) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-white/70">You don't have access to this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <InlineFormProvider>
        <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={Users}
          title={header.title}
          description={header.description}
          featureColor="customers"
          showAuraBar
          badge={
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {customers?.length || 0} total
            </Badge>
          }
        />

        {/* Search and Add Button */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <IntakeDataSearch scope="appointments" className="w-full max-w-sm" />
          <Button onClick={() => setAddCustomerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
            <CardDescription className="text-muted-foreground">
              Click on a customer to view their complete history and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCustomers && filteredCustomers.length > 0 ? (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerClick(customer)}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-600/50 bg-slate-700/50 hover:bg-slate-600/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Communication preferences */}
                      <div className="flex items-center gap-1">
                        {customer.email_opt_out ? (
                          <Badge variant="outline" className="text-xs gap-1 text-white/70 border-white/30">
                            <Ban className="h-3 w-3" /> Email
                          </Badge>
                        ) : null}
                        {customer.sms_opt_out ? (
                          <Badge variant="outline" className="text-xs gap-1 text-white/70 border-white/30">
                            <Ban className="h-3 w-3" /> SMS
                          </Badge>
                        ) : null}
                        {customer.call_opt_out ? (
                          <Badge variant="outline" className="text-xs gap-1 text-white/70 border-white/30">
                            <Ban className="h-3 w-3" /> Call
                          </Badge>
                        ) : null}
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <IndustryEmptyState surface="customers" />
            )}
          </CardContent>
        </Card>

        </div>
        <InlineFormHost className="mt-4" />
        {/* Add Customer Form — renders as inline tab when provider is present, falls back to dialog otherwise */}
        <AddCustomerForm open={addCustomerOpen} onOpenChange={setAddCustomerOpen} />
        </InlineFormProvider>
      </PageContainer>
      {/* Customer Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {selectedCustomer?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Customer profile and interaction history
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-white/70 uppercase tracking-wide">Contact Information</h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer?.email}</span>
                    {selectedCustomer?.email_opt_out ? (
                      <Badge variant="destructive" className="text-xs">Opted Out</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1"><Check className="h-3 w-3" /> Active</Badge>
                    )}
                  </div>
                  {selectedCustomer?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                      {selectedCustomer.sms_opt_out ? (
                        <Badge variant="destructive" className="text-xs">SMS Opted Out</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1"><Check className="h-3 w-3" /> SMS Active</Badge>
                      )}
                      {selectedCustomer.call_opt_out ? (
                        <Badge variant="destructive" className="text-xs">Call Opted Out</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1"><Check className="h-3 w-3" /> Call Active</Badge>
                      )}
                    </div>
                  )}
                  {selectedCustomer?.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Tabs for different data types */}
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="inline-flex h-auto p-2 bg-muted/30 rounded-2xl border border-border gap-1 flex-wrap">
                  <TabsTrigger value="appointments" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                    <Calendar className="h-3 w-3" />
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger value="quotes" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                    <FileText className="h-3 w-3" />
                    Quotes
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                    <FileText className="h-3 w-3" />
                    Invoices
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                    <Star className="h-3 w-3" />
                    Feedback
                  </TabsTrigger>
                </TabsList>

                {detailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <TabsContent value="appointments" className="space-y-3 mt-4">
                      {customerDetails?.appointments.length ? (
                        customerDetails.appointments.map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{apt.service_type}</p>
                              <p className="text-sm text-white/70">
                                {format(new Date(apt.datetime), 'PPP p')}
                              </p>
                              {apt.notes && (
                                <p className="text-sm text-white/70 mt-1">{apt.notes}</p>
                              )}
                              {apt.intake_data && Object.keys(apt.intake_data).length > 0 && (
                                <div className="mt-2">
                                  <IntakeSummary
                                    intakeData={apt.intake_data}
                                    serviceType={apt.service_type}
                                    variant="compact"
                                  />
                                </div>
                              )}
                            </div>
                            {getStatusBadge(apt.status)}
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-white/70">No appointments found</p>
                      )}
                    </TabsContent>

                    <TabsContent value="quotes" className="space-y-3 mt-4">
                      {customerDetails?.quotes.length ? (
                        customerDetails.quotes.map((quote) => (
                          <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">${quote.total_amount.toFixed(2)}</p>
                              <p className="text-sm text-white/70">
                                {format(new Date(quote.created_at), 'PPP')}
                              </p>
                            </div>
                            {getStatusBadge(quote.status)}
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-white/70">No quotes found</p>
                      )}
                    </TabsContent>

                    <TabsContent value="invoices" className="space-y-3 mt-4">
                      {customerDetails?.invoices.length ? (
                        customerDetails.invoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">
                                {invoice.invoice_number || 'Invoice'} - ${invoice.total.toFixed(2)}
                              </p>
                              <p className="text-sm text-white/70">
                                {format(new Date(invoice.created_at), 'PPP')}
                              </p>
                            </div>
                            {getStatusBadge(invoice.status)}
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-white/70">No invoices found</p>
                      )}
                    </TabsContent>

                    <TabsContent value="feedback" className="space-y-3 mt-4">
                      {customerDetails?.feedback.length ? (
                        customerDetails.feedback.map((fb) => (
                          <div key={fb.id} className="p-3 rounded-lg border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {fb.rating && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < fb.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-white/50'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                                {fb.sentiment && (
                                  <Badge variant={fb.sentiment === 'positive' ? 'secondary' : fb.sentiment === 'negative' ? 'destructive' : 'outline'}>
                                    {fb.sentiment}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-white/70">
                                {format(new Date(fb.created_at), 'PPP')}
                              </span>
                            </div>
                            {fb.service_type && (
                              <p className="text-sm text-white/70">Service: {fb.service_type}</p>
                            )}
                            {fb.feedback_note && (
                              <div className="flex items-start gap-2 mt-2">
                                <MessageSquare className="h-4 w-4 text-white/70 mt-0.5" />
                                <p className="text-sm">{fb.feedback_note}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-white/70">No feedback found</p>
                      )}
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <AddCustomerForm open={addCustomerOpen} onOpenChange={setAddCustomerOpen} />
    </DashboardLayout>
  );
}
