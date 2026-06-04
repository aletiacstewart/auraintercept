import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormShell } from '@/components/ui/form-shell';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Receipt, Eye, Send, Check, Search, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { InvoiceForm } from '@/components/billing/forms/InvoiceForm';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';
import { IndustryEmptyState } from '@/components/shared/IndustryEmptyState';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryPlaceholders } from '@/lib/industryPlaceholders';

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
  const { pack } = useIndustryPack();
  const invoiceNoun = (pack?.terminology as any)?.invoice || 'Invoice';
  const invoicePlural = `${invoiceNoun}s`;
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
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">{invoicePlural}</h3>
          <p className="text-sm text-foreground/70">Create and manage customer {invoicePlural.toLowerCase()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New {invoiceNoun}
          </Button>
          <FormShell
            id="invoice-create"
            title={`Create ${invoiceNoun}`}
            description={`Create a new ${invoiceNoun.toLowerCase()} for a customer.`}
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {companyId && (
              <InvoiceForm
                companyId={companyId}
                mode="direct"
                showBackButton={false}
                onSuccess={() => setIsAddOpen(false)}
                onCancel={() => setIsAddOpen(false)}
              />
            )}
          </FormShell>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Total</div>
          <div className="text-xl font-bold text-foreground">{invoices.length}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Paid</div>
          <div className="text-xl font-bold" style={{ color: 'hsl(var(--feature-invoices))' }}>${totalPaid.toFixed(0)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Outstanding</div>
          <div className="text-xl font-bold text-foreground">${totalOutstanding.toFixed(0)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: overdueCount > 0 ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Overdue</div>
          <div className="text-xl font-bold text-destructive">{overdueCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={getIndustryPlaceholders(pack).searchInvoices}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-32">
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
      {!isLoading && filteredInvoices.length === 0 ? (
        <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,255,0.1)' }}>
          <CardContent className="p-0">
            <IndustryEmptyState surface="invoices" onAction={() => setIsAddOpen(true)} />
          </CardContent>
        </Card>
      ) : (
      <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,255,0.1)' }}>
        <CardContent className="w-full overflow-x-auto p-0">
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
      )}

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
