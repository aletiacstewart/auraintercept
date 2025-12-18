import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RoleAwareDashboardLayout } from '@/components/dashboard/RoleAwareDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Receipt, Eye, Send, Check, Search, Trash2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  status: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function Invoices() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    notes: '',
    tax_rate: 0,
    due_days: 30,
    line_items: [{ description: '', quantity: 1, unit_price: 0 }],
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!companyId,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['invoice_line_items', viewInvoice?.id],
    queryFn: async () => {
      if (!viewInvoice?.id) return [];
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', viewInvoice.id);
      if (error) throw error;
      return data as InvoiceLineItem[];
    },
    enabled: !!viewInvoice?.id,
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  };

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * (data.tax_rate / 100);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + data.due_days);

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          invoice_number: generateInvoiceNumber(),
          customer_name: data.customer_name,
          customer_email: data.customer_email || null,
          customer_phone: data.customer_phone || null,
          customer_address: data.customer_address || null,
          notes: data.notes || null,
          subtotal,
          tax_rate: data.tax_rate,
          tax_amount: taxAmount,
          total: subtotal + taxAmount,
          due_date: dueDate.toISOString(),
          status: 'draft',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const lineItemsToInsert = data.line_items
        .filter(item => item.description && item.unit_price > 0)
        .map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));

      if (lineItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsToInsert);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, payment_method }: { id: string; status: string; payment_method?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
        if (payment_method) updateData.payment_method = payment_method;
      }
      const { error } = await supabase.from('invoices').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('invoice_line_items').delete().eq('invoice_id', id);
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: '',
      notes: '',
      tax_rate: 0,
      due_days: 30,
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
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'outline',
    };
    const colors: Record<string, string> = {
      paid: 'bg-green-500/20 text-green-600 border-green-500/30',
    };
    return <Badge variant={variants[status] || 'secondary'} className={colors[status]}>{status}</Badge>;
  };

  const subtotal = formData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && i.due_date && new Date(i.due_date) < new Date())).length;

  return (
    <RoleAwareDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Create and manage customer invoices</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>Create a new invoice for a customer.</DialogDescription>
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
                    <Label>Due in (days)</Label>
                    <Input type="number" value={formData.due_days} onChange={e => setFormData({ ...formData, due_days: parseInt(e.target.value) || 30 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Billing Address</Label>
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
                          <Trash2 className="w-4 h-4" />
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
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>Create Invoice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className={overdueCount > 0 ? 'border-destructive' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or invoice #..."
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
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer_name}</div>
                          {invoice.customer_email && <div className="text-sm text-muted-foreground">{invoice.customer_email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right font-medium">${invoice.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewInvoice(invoice)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}>
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {invoice.status === 'sent' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid', payment_method: 'manual' })}>
                              <DollarSign className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          {invoice.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(invoice.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Invoice Dialog */}
        <Dialog open={!!viewInvoice} onOpenChange={open => !open && setViewInvoice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice {viewInvoice?.invoice_number}</DialogTitle>
            </DialogHeader>
            {viewInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Customer</div>
                    <div className="font-medium">{viewInvoice.customer_name}</div>
                    {viewInvoice.customer_email && <div>{viewInvoice.customer_email}</div>}
                    {viewInvoice.customer_phone && <div>{viewInvoice.customer_phone}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Status</div>
                    <div>{getStatusBadge(viewInvoice.status)}</div>
                    {viewInvoice.paid_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Paid: {format(new Date(viewInvoice.paid_at), 'MMM d, yyyy')}
                      </div>
                    )}
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
                      <span>${viewInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {viewInvoice.tax_amount && viewInvoice.tax_amount > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Tax ({viewInvoice.tax_rate}%)</span>
                        <span>${viewInvoice.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${viewInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {viewInvoice.notes && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Notes</div>
                    <div>{viewInvoice.notes}</div>
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
