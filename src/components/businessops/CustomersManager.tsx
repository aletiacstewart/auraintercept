import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Star,
  Ban,
  Check,
  ChevronRight,
  Loader2,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { AddCustomerForm } from '@/components/customers/AddCustomerForm';

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

export function CustomersManager() {
  const { companyId, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

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

  const { data: customerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['customer-details', selectedCustomer?.id, selectedCustomer?.email],
    queryFn: async () => {
      if (!selectedCustomer || !companyId) return null;

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, datetime, service_type, status, notes')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('datetime', { ascending: false })
        .limit(10);

      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, created_at, status, total_amount')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, created_at, status, total, invoice_number')
        .eq('company_id', companyId)
        .eq('customer_email', selectedCustomer.email)
        .order('created_at', { ascending: false })
        .limit(10);

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
      <div className="text-center py-12 text-muted-foreground">
        You don't have access to manage customers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <Button onClick={() => setAddCustomerOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{customers?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email Opt-ins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {customers?.filter(c => !c.email_opt_out).length ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMS Opt-ins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {customers?.filter(c => !c.sms_opt_out).length ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
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
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    <div className="flex items-center gap-1">
                      {customer.email_opt_out && (
                        <Badge variant="outline-card" className="text-xs gap-1">
                          <Ban className="h-3 w-3" /> Email
                        </Badge>
                      )}
                      {customer.sms_opt_out && (
                        <Badge variant="outline-card" className="text-xs gap-1">
                          <Ban className="h-3 w-3" /> SMS
                        </Badge>
                      )}
                      {customer.call_opt_out && (
                        <Badge variant="outline-card" className="text-xs gap-1">
                          <Ban className="h-3 w-3" /> Call
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No customers found</p>
              <p className="text-sm">Customers will appear here when they book appointments or request quotes</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
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

              {/* Tabs for history */}
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs defaultValue="appointments" className="w-full">
                  <TabsList className="inline-flex h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1">
                    <TabsTrigger 
                      value="appointments"
                      className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
                    >
                      <Calendar className="h-4 w-4" />
                      Appointments ({customerDetails?.appointments.length || 0})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="quotes"
                      className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      Quotes ({customerDetails?.quotes.length || 0})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="feedback"
                      className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
                    >
                      <Star className="h-4 w-4" />
                      Feedback ({customerDetails?.feedback.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="appointments" className="mt-4">
                    {customerDetails?.appointments.length ? (
                      <div className="space-y-2">
                        {customerDetails.appointments.map((apt) => (
                          <div key={apt.id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{apt.service_type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(apt.datetime), 'PPp')}
                                </p>
                              </div>
                              {getStatusBadge(apt.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">No appointments found</p>
                    )}
                  </TabsContent>

                  <TabsContent value="quotes" className="mt-4">
                    {customerDetails?.quotes.length ? (
                      <div className="space-y-2">
                        {customerDetails.quotes.map((quote) => (
                          <div key={quote.id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">${quote.total_amount.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(quote.created_at), 'PPp')}
                                </p>
                              </div>
                              {getStatusBadge(quote.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">No quotes found</p>
                    )}
                  </TabsContent>

                  <TabsContent value="feedback" className="mt-4">
                    {customerDetails?.feedback.length ? (
                      <div className="space-y-2">
                        {customerDetails.feedback.map((fb) => (
                          <div key={fb.id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {fb.rating && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${i < fb.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
                                      />
                                    ))}
                                  </div>
                                )}
                                {fb.sentiment && (
                                  <Badge variant="outline" className="text-xs">{fb.sentiment}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(fb.created_at), 'PP')}
                              </span>
                            </div>
                            {fb.feedback_note && (
                              <p className="text-sm">{fb.feedback_note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">No feedback found</p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Customer Form */}
      <AddCustomerForm open={addCustomerOpen} onOpenChange={setAddCustomerOpen} />
    </div>
  );
}
