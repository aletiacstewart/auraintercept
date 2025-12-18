import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RoleAwareDashboardLayout } from '@/components/dashboard/RoleAwareDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, FileText, Eye, Send, Check, X, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    notes: '',
    tax_rate: 0,
    valid_days: 30,
    line_items: [{ description: '', quantity: 1, unit_price: 0 }],
  });

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

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * (data.tax_rate / 100);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + data.valid_days);

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          company_id: companyId,
          customer_name: data.customer_name,
          customer_email: data.customer_email || null,
          customer_phone: data.customer_phone || null,
          customer_address: data.customer_address || null,
          notes: data.notes || null,
          subtotal,
          tax_rate: data.tax_rate,
          tax_amount: taxAmount,
          total_amount: subtotal + taxAmount,
          valid_until: validUntil.toISOString(),
          status: 'draft',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      const lineItemsToInsert = data.line_items
        .filter(item => item.description && item.unit_price > 0)
        .map(item => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));

      if (lineItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItemsToInsert);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote created successfully');
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create quote'),
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

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: '',
      notes: '',
      tax_rate: 0,
      valid_days: 30,
      line_items: [{ description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, line_items: newItems });
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length === 1) return;
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.customer_name) {
      toast.error('Customer name is required');
      return;
    }
    addMutation.mutate(formData);
  };

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

  const subtotal = formData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const totalQuoteValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total_amount, 0);
  const pendingQuotes = quotes.filter(q => q.status === 'sent').length;

  return (
    <RoleAwareDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-muted-foreground">Create and manage service quotes</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Quote</DialogTitle>
                <DialogDescription>Create a new quote for a customer.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.customer_email} onChange={e => setFormData({ ...formData, customer_email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formData.customer_phone} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Days</Label>
                    <Input type="number" value={formData.valid_days} onChange={e => setFormData({ ...formData, valid_days: parseInt(e.target.value) || 30 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={formData.customer_address} onChange={e => setFormData({ ...formData, customer_address: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.line_items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          className="col-span-5"
                          placeholder="Description"
                          value={item.description}
                          onChange={e => updateLineItem(index, 'description', e.target.value)}
                        />
                        <Input
                          className="col-span-2"
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                        <Input
                          className="col-span-3"
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                        <div className="col-span-1 text-right text-sm">${(item.quantity * item.unit_price).toFixed(2)}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1"
                          onClick={() => removeLineItem(index)}
                          disabled={formData.line_items.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input type="number" step="0.01" value={formData.tax_rate} onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1 text-right">
                  <div className="text-sm">Subtotal: ${subtotal.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Tax ({formData.tax_rate}%): ${taxAmount.toFixed(2)}</div>
                  <div className="text-lg font-bold">Total: ${total.toFixed(2)}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>Create Quote</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingQuotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalQuoteValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>{quote.valid_until ? format(new Date(quote.valid_until), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right font-medium">${quote.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                                <Check className="w-4 h-4 text-green-500" />
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Customer</div>
                    <div className="font-medium">{viewQuote.customer_name}</div>
                    {viewQuote.customer_email && <div>{viewQuote.customer_email}</div>}
                    {viewQuote.customer_phone && <div>{viewQuote.customer_phone}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Status</div>
                    <div>{getStatusBadge(viewQuote.status)}</div>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  {lineItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.description} x{item.quantity}</span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${viewQuote.subtotal.toFixed(2)}</span>
                    </div>
                    {viewQuote.tax_amount && viewQuote.tax_amount > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Tax ({viewQuote.tax_rate}%)</span>
                        <span>${viewQuote.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${viewQuote.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {viewQuote.notes && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Notes</div>
                    <div>{viewQuote.notes}</div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleAwareDashboardLayout>
  );
}
