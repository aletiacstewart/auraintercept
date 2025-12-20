import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Search, ArrowLeft, User, Calendar, FileText, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  total: number;
  status: string;
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
}

interface BillingLookupFormProps {
  companyId: string;
  onCancel?: () => void;
  onSelectInvoice?: (invoice: Invoice) => void;
}

export function BillingLookupForm({ companyId, onCancel, onSelectInvoice }: BillingLookupFormProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['customer-invoices', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, customer_email, customer_phone, subtotal, total, status, due_date, created_at, paid_at')
        .eq('company_id', companyId)
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,invoice_number.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []) as Invoice[];
    },
    enabled: !!companyId && searchQuery.length >= 2,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sent</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 mb-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Billing & Invoices</h3>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Search className="h-4 w-4" />
            Find Your Invoice
          </Label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, or invoice #..."
            className="h-9 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your name, phone number, email, or invoice number to find your billing information.
          </p>
        </div>

        {/* Results */}
        <div className="border rounded-lg max-h-80 overflow-y-auto">
          {searchQuery.length < 2 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Enter at least 2 characters to search
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : invoices.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No invoices found
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => onSelectInvoice?.(invoice)}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{invoice.customer_name}</span>
                        {invoice.invoice_number && (
                          <span className="text-xs text-muted-foreground">#{invoice.invoice_number}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                        {invoice.due_date && (
                          <>
                            <span>•</span>
                            <span>Due: {format(new Date(invoice.due_date), 'MMM d')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(invoice.status)}
                      <div className="font-semibold text-primary">${invoice.total.toFixed(2)}</div>
                    </div>
                  </div>
                  {invoice.status !== 'paid' && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <ExternalLink className="h-3 w-3" />
                      Click to view payment options
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
