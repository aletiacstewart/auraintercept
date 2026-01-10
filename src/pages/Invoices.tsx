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
import { Plus, Receipt, Eye, Send, Check, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { InvoiceForm } from '@/components/billing/forms/InvoiceForm';

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

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && i.due_date && new Date(i.due_date) < new Date())).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-white/70">Create and manage customer invoices</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>Create a new invoice for a customer.</DialogDescription>
              </DialogHeader>
              {companyId && (
                <InvoiceForm
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
              <CardTitle className="text-sm font-medium text-white">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className={overdueCount > 0 ? 'border-destructive' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Overdue</CardTitle>
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
                  <TableHead className="text-white">Invoice #</TableHead>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Due Date</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Total</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-white/60">Loading...</TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-white/60">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer_name}</div>
                          {invoice.customer_email && <div className="text-sm text-muted-foreground">{invoice.customer_email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right font-medium">${invoice.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewInvoice(invoice)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}>
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {invoice.status === 'sent' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' })}>
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(invoice.id)}>
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

        {/* View Invoice Dialog */}
        <Dialog open={!!viewInvoice} onOpenChange={open => !open && setViewInvoice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            {viewInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Invoice #</label>
                    <p className="font-mono">{viewInvoice.invoice_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div>{getStatusBadge(viewInvoice.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Customer</label>
                    <p className="font-medium">{viewInvoice.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p>{viewInvoice.customer_email || '-'}</p>
                  </div>
                </div>

                {lineItems.length > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">Line Items</label>
                    <div className="mt-2 border rounded-lg">
                      {lineItems.map(item => (
                        <div key={item.id} className="flex justify-between p-2 border-b last:border-b-0">
                          <div>
                            <span className="font-medium">{item.description}</span>
                            <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                          </div>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-1 text-right">
                  <div className="text-sm">Subtotal: ${viewInvoice.subtotal.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Tax ({viewInvoice.tax_rate || 0}%): ${(viewInvoice.tax_amount || 0).toFixed(2)}</div>
                  <div className="text-lg font-bold">Total: ${viewInvoice.total.toFixed(2)}</div>
                </div>

                {viewInvoice.paid_at && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Paid on {format(new Date(viewInvoice.paid_at), 'MMM d, yyyy')}
                      {viewInvoice.payment_method && ` via ${viewInvoice.payment_method}`}
                    </p>
                  </div>
                )}

                {viewInvoice.notes && (
                  <div>
                    <label className="text-sm text-muted-foreground">Notes</label>
                    <p className="text-sm">{viewInvoice.notes}</p>
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
