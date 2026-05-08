import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FileText, Eye, Send, Check, X, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { BusinessQuoteForm } from '@/components/billing/forms/BusinessQuoteForm';
import { IndustryEmptyState } from '@/components/shared/IndustryEmptyState';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryPlaceholders } from '@/lib/industryPlaceholders';

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

interface QuotesManagerProps {
  onClose?: () => void;
}

export const QuotesManager: React.FC<QuotesManagerProps> = ({ onClose }) => {
  const { pack } = useIndustryPack();
  const quoteNoun = (pack?.terminology as any)?.quote || 'Quote';
  const quotePlural = `${quoteNoun}s`;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{quotePlural}</h3>
          <p className="text-sm text-foreground/70">Create and manage {quotePlural.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New {quoteNoun}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create {quoteNoun}</DialogTitle>
                <DialogDescription>Create a new {quoteNoun.toLowerCase()} for a customer.</DialogDescription>
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Total</div>
          <div className="text-xl font-bold text-foreground">{quotes.length}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Pending</div>
          <div className="text-xl font-bold text-foreground">{pendingQuotes}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Accepted</div>
          <div className="text-xl font-bold" style={{ color: 'hsl(var(--feature-invoices))' }}>${totalQuoteValue.toFixed(0)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '0.5rem' }} className="p-3">
          <div className="text-xs font-medium text-foreground/60 mb-1">Conversion</div>
          <div className="text-xl font-bold text-foreground">
            {quotes.length > 0 ? ((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={getIndustryPlaceholders(pack).searchQuotes}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Table */}
      <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,255,0.1)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground text-xs">Customer</TableHead>
                <TableHead className="text-foreground text-xs">Date</TableHead>
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
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <IndustryEmptyState surface="quotes" onAction={() => setIsAddOpen(true)} />
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.slice(0, 5).map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className="py-2">
                      <div className="text-sm font-medium">{quote.customer_name}</div>
                    </TableCell>
                    <TableCell className="py-2 text-sm">{format(new Date(quote.created_at), 'MMM d')}</TableCell>
                    <TableCell className="py-2">{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right py-2 font-medium text-sm">${quote.total_amount.toFixed(0)}</TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewQuote(quote)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {quote.status === 'draft' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'sent' })}>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {quote.status === 'sent' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'accepted' })}>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(quote.id)}>
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
                  <label className="text-sm text-foreground/70">Customer</label>
                  <p className="font-medium">{viewQuote.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm text-foreground/70">Status</label>
                  <div>{getStatusBadge(viewQuote.status)}</div>
                </div>
              </div>

              {lineItems.length > 0 && (
                <div>
                  <label className="text-sm text-foreground/70">Line Items</label>
                  <div className="mt-2 border rounded-lg">
                    {lineItems.map(item => (
                      <div key={item.id} className="flex justify-between p-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{item.description}</span>
                          <span className="text-foreground/70 ml-2">x{item.quantity}</span>
                        </div>
                        <span>${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-1 text-right">
                <div className="text-sm">Subtotal: ${viewQuote.subtotal.toFixed(2)}</div>
                <div className="text-sm text-foreground/70">Tax: ${(viewQuote.tax_amount || 0).toFixed(2)}</div>
                <div className="text-lg font-bold">Total: ${viewQuote.total_amount.toFixed(2)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
