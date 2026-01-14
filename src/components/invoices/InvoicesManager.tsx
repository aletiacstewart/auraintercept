import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Receipt, Eye, Send, Check, Search, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { InvoiceForm } from '@/components/billing/forms/InvoiceForm';

interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

interface InvoicesManagerProps {
  onClose?: () => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({ onClose }) => {
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
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
    };
    const colors: Record<string, string> = {
      paid: 'bg-green-500/20 text-green-600 border-green-500/30',
    };
    return <Badge variant={variants[status] || 'secondary'} className={colors[status]}>{status}</Badge>;
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Invoices</h3>
          <p className="text-sm text-foreground/70">Create and manage customer invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-background/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-foreground/70">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-foreground/70">Paid</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-green-600">${totalPaid.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-foreground/70">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">${totalOutstanding.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className={`bg-background/50 ${overdueCount > 0 ? 'border-destructive' : ''}`}>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-foreground/70">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-destructive">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card className="bg-background/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground text-xs">Invoice #</TableHead>
                <TableHead className="text-foreground text-xs">Customer</TableHead>
                <TableHead className="text-foreground text-xs">Status</TableHead>
                <TableHead className="text-right text-foreground text-xs">Total</TableHead>
                <TableHead className="text-right text-foreground text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-foreground/60 text-sm">Loading...</TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-foreground/60">
                    <Receipt className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">No invoices found</span>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.slice(0, 5).map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="py-2 font-mono text-sm">{invoice.invoice_number || '-'}</TableCell>
                    <TableCell className="py-2">
                      <div className="text-sm font-medium">{invoice.customer_name}</div>
                    </TableCell>
                    <TableCell className="py-2">{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right py-2 font-medium text-sm">${invoice.total.toFixed(0)}</TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInvoice(invoice)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {invoice.status === 'sent' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' })}>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(invoice.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
                  <label className="text-sm text-foreground/70">Invoice #</label>
                  <p className="font-mono">{viewInvoice.invoice_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground/70">Status</label>
                  <div>{getStatusBadge(viewInvoice.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-foreground/70">Customer</label>
                  <p className="font-medium">{viewInvoice.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground/70">Email</label>
                  <p>{viewInvoice.customer_email || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-1 text-right">
                <div className="text-sm">Subtotal: ${viewInvoice.subtotal.toFixed(2)}</div>
                <div className="text-sm text-foreground/70">Tax: ${(viewInvoice.tax_amount || 0).toFixed(2)}</div>
                <div className="text-lg font-bold">Total: ${viewInvoice.total.toFixed(2)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
