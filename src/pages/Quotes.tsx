import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FileText, Eye, Send, Check, X, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { BusinessQuoteForm } from '@/components/billing/forms/BusinessQuoteForm';

interface Quote {
  id: string;
  company_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  status: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total_amount: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
}

interface QuoteLineItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function Quotes() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');


  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!companyId,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['quote_line_items', viewQuote?.id],
    queryFn: async () => {
      if (!viewQuote?.id) return [];
      const { data, error } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', viewQuote.id);
      if (error) throw error;
      return data as QuoteLineItem[];
    },
    enabled: !!viewQuote?.id,
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('quotes').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('quote_line_items').delete().eq('quote_id', id);
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote deleted');
    },
    onError: () => toast.error('Failed to delete quote'),
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      sent: 'default',
      accepted: 'default',
      declined: 'destructive',
      expired: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const totalQuoteValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total_amount, 0);
  const pendingQuotes = quotes.filter(q => q.status === 'sent').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-white/70">Create and manage service quotes</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Quote</DialogTitle>
                <DialogDescription>Create a new quote for a customer.</DialogDescription>
              </DialogHeader>
              {companyId && (
                <BusinessQuoteForm
                  companyId={companyId}
                  mode="direct"
                  showBackButton={false}
                  onSuccess={() => setIsAddOpen(false)}
                  onCancel={() => setIsAddOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Accepted Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalQuoteValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.length > 0 ? ((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100).toFixed(0) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quotes Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Valid Until</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Total</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-white/60">Loading...</TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-white/60">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No quotes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map(quote => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.customer_name}</div>
                          {quote.customer_email && <div className="text-sm text-muted-foreground">{quote.customer_email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(quote.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {quote.valid_until ? format(new Date(quote.valid_until), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right font-medium">${quote.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewQuote(quote)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {quote.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'sent' })}>
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {quote.status === 'sent' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'accepted' })}>
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'declined' })}>
                                <X className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(quote.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Quote Dialog */}
        <Dialog open={!!viewQuote} onOpenChange={open => !open && setViewQuote(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Quote Details</DialogTitle>
            </DialogHeader>
            {viewQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Customer</label>
                    <p className="font-medium">{viewQuote.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Status</label>
                    <div>{getStatusBadge(viewQuote.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Email</label>
                    <p>{viewQuote.customer_email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Phone</label>
                    <p>{viewQuote.customer_phone || '-'}</p>
                  </div>
                </div>

                {lineItems.length > 0 && (
                  <div>
                    <label className="text-sm text-white/70">Line Items</label>
                    <div className="mt-2 border rounded-lg">
                      {lineItems.map(item => (
                        <div key={item.id} className="flex justify-between p-2 border-b last:border-b-0">
                          <div>
                            <span className="font-medium">{item.description}</span>
                            <span className="text-white/70 ml-2">x{item.quantity}</span>
                          </div>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-1 text-right">
                  <div className="text-sm">Subtotal: ${viewQuote.subtotal.toFixed(2)}</div>
                  <div className="text-sm text-white/70">Tax ({viewQuote.tax_rate || 0}%): ${(viewQuote.tax_amount || 0).toFixed(2)}</div>
                  <div className="text-lg font-bold">Total: ${viewQuote.total_amount.toFixed(2)}</div>
                </div>

                {viewQuote.notes && (
                  <div>
                    <label className="text-sm text-white/70">Notes</label>
                    <p className="text-sm">{viewQuote.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
