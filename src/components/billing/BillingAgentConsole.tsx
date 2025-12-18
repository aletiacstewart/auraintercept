import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Send, 
  Receipt, 
  DollarSign, 
  FileText, 
  Bell,
  BarChart3,
  RefreshCw,
  Bot,
  User,
  Loader2,
  X,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BILLING_AGENTS = [
  { id: 'invoice', name: 'Invoice Agent', color: 'bg-blue-500' },
  { id: 'quoting', name: 'Quoting Agent', color: 'bg-green-500' },
  { id: 'followup', name: 'Follow-up Agent', color: 'bg-orange-500' },
  { id: 'insights', name: 'Insights Agent', color: 'bg-purple-500' },
  { id: 'forecast', name: 'Forecast Agent', color: 'bg-cyan-500' },
];

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'create_invoice', label: 'Create Invoice', icon: Receipt, message: '' },
  { id: 'send_reminder', label: 'Send Reminder', icon: Bell, message: '' },
  { id: 'overdue_followup', label: 'Overdue Follow-up', icon: AlertCircle, message: 'Show me all overdue invoices that need follow-up and help me send payment reminders.', variant: 'destructive' },
  { id: 'create_quote', label: 'Create Quote', icon: FileText, message: '' },
  { id: 'revenue_report', label: 'Revenue Report', icon: BarChart3, message: '' },
  { id: 'process_refund', label: 'Process Refund', icon: RefreshCw, message: '' },
];

interface Invoice {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_email: string | null;
  total: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface BillingAgentConsoleProps {
  companyId?: string;
  className?: string;
}

type ViewMode = 'chat' | 'invoice_form' | 'quote_form' | 'reports' | 'send_reminder' | 'process_refund';

const defaultInvoiceForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  notes: '',
  tax_rate: 0,
  due_days: 30,
  line_items: [{ description: '', quantity: 1, unit_price: 0 }],
};

const defaultQuoteForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  notes: '',
  tax_rate: 0,
  valid_days: 30,
  line_items: [{ description: '', quantity: 1, unit_price: 0 }],
};

export function BillingAgentConsole({ companyId, className }: BillingAgentConsoleProps) {
  const queryClient = useQueryClient();
  const { user, companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = companyId || authCompanyId;
  
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form data state
  const [invoiceFormData, setInvoiceFormData] = useState(defaultInvoiceForm);
  const [quoteFormData, setQuoteFormData] = useState(defaultQuoteForm);

  const { messages, isLoading, currentAgent, sendMessage, clearMessages } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
    onAgentChange: (agent) => {
      console.log('[Billing] Agent changed to:', agent);
    },
  });

  // Fetch pending and overdue invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing-invoices', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, customer_email, total, status, due_date, created_at')
        .eq('company_id', effectiveCompanyId)
        .in('status', ['pending', 'overdue', 'paid'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }

      return (data || []) as Invoice[];
    },
    enabled: !!effectiveCompanyId,
    refetchInterval: 60000,
  });

  // For reports
  const { data: allInvoices = [] } = useQuery({
    queryKey: ['all-invoices', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId && viewMode === 'reports',
  });

  // Invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: typeof invoiceFormData) => {
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * (data.tax_rate / 100);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + data.due_days);

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: effectiveCompanyId,
          invoice_number: invoiceNumber,
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
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      toast.success('Invoice created successfully');
      setViewMode('chat');
      setInvoiceFormData(defaultInvoiceForm);
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  // Quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: typeof quoteFormData) => {
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * (data.tax_rate / 100);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + data.valid_days);

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          company_id: effectiveCompanyId,
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
      setViewMode('chat');
      setQuoteFormData(defaultQuoteForm);
    },
    onError: () => toast.error('Failed to create quote'),
  });

  // Filter invoices based on view mode
  const getFilteredInvoices = () => {
    if (viewMode === 'send_reminder') {
      return invoices.filter(inv => ['pending', 'overdue'].includes(inv.status));
    }
    if (viewMode === 'process_refund') {
      return invoices.filter(inv => inv.status === 'paid');
    }
    return invoices;
  };

  const filteredInvoices = getFilteredInvoices();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && viewMode === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, viewMode]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    if (action.id === 'create_invoice') {
      setInvoiceFormData(defaultInvoiceForm);
      setViewMode('invoice_form');
      return;
    }
    if (action.id === 'create_quote') {
      setQuoteFormData(defaultQuoteForm);
      setViewMode('quote_form');
      return;
    }
    if (action.id === 'revenue_report') {
      setViewMode('reports');
      return;
    }
    if (action.id === 'send_reminder') {
      setViewMode('send_reminder');
      return;
    }
    if (action.id === 'process_refund') {
      setViewMode('process_refund');
      return;
    }
    if (action.message) {
      await sendMessage(action.message);
    }
  }, [sendMessage]);

  const handleSelectInvoiceForReminder = useCallback(async (invoice: Invoice) => {
    if (processingInvoiceId) return;
    
    setProcessingInvoiceId(invoice.id);
    
    try {
      const message = `Send a payment reminder for invoice ${invoice.invoice_number || invoice.id} to ${invoice.customer_name}${invoice.customer_email ? ` (${invoice.customer_email})` : ''}. The invoice total is $${invoice.total.toLocaleString()} and is currently ${invoice.status}.`;
      
      setViewMode('chat');
      await sendMessage(message);
      toast.success('Preparing payment reminder', { description: `For ${invoice.customer_name}` });
    } catch (error) {
      console.error('Reminder error:', error);
      toast.error('Failed to prepare reminder', { description: 'Please try again' });
    } finally {
      setProcessingInvoiceId(null);
    }
  }, [processingInvoiceId, sendMessage]);

  const handleSelectInvoiceForRefund = useCallback(async (invoice: Invoice) => {
    if (processingInvoiceId) return;
    
    setProcessingInvoiceId(invoice.id);
    
    try {
      const message = `I need to process a refund for invoice ${invoice.invoice_number || invoice.id} for ${invoice.customer_name}. The original amount was $${invoice.total.toLocaleString()}.`;
      
      setViewMode('chat');
      await sendMessage(message);
      toast.success('Processing refund request', { description: `For ${invoice.customer_name}` });
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund', { description: 'Please try again' });
    } finally {
      setProcessingInvoiceId(null);
    }
  }, [processingInvoiceId, sendMessage]);

  const getAgentBadge = (agentType?: string) => {
    const agent = BILLING_AGENTS.find(a => a.id === agentType);
    if (!agent) return null;
    return (
      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', agent.color, 'text-white')}>
        {agent.name}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  // Line item helpers for Invoice
  const addInvoiceLineItem = () => {
    setInvoiceFormData({
      ...invoiceFormData,
      line_items: [...invoiceFormData.line_items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const updateInvoiceLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...invoiceFormData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceFormData({ ...invoiceFormData, line_items: newItems });
  };

  const removeInvoiceLineItem = (index: number) => {
    if (invoiceFormData.line_items.length === 1) return;
    setInvoiceFormData({
      ...invoiceFormData,
      line_items: invoiceFormData.line_items.filter((_, i) => i !== index),
    });
  };

  // Line item helpers for Quote
  const addQuoteLineItem = () => {
    setQuoteFormData({
      ...quoteFormData,
      line_items: [...quoteFormData.line_items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const updateQuoteLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...quoteFormData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteFormData({ ...quoteFormData, line_items: newItems });
  };

  const removeQuoteLineItem = (index: number) => {
    if (quoteFormData.line_items.length === 1) return;
    setQuoteFormData({
      ...quoteFormData,
      line_items: quoteFormData.line_items.filter((_, i) => i !== index),
    });
  };

  const invoiceSubtotal = invoiceFormData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const invoiceTaxAmount = invoiceSubtotal * (invoiceFormData.tax_rate / 100);
  const invoiceTotal = invoiceSubtotal + invoiceTaxAmount;

  const quoteSubtotal = quoteFormData.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const quoteTaxAmount = quoteSubtotal * (quoteFormData.tax_rate / 100);
  const quoteTotal = quoteSubtotal + quoteTaxAmount;

  // Reports calculations
  const totalPaid = allInvoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + i.total, 0);
  const totalOutstanding = allInvoices.filter((i: any) => ['sent', 'pending', 'overdue'].includes(i.status)).reduce((sum: number, i: any) => sum + i.total, 0);
  const overdueCount = allInvoices.filter((i: any) => i.status === 'overdue' || (i.status === 'sent' && i.due_date && new Date(i.due_date) < new Date())).length;

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={index}
        className={cn(
          'flex gap-2 animate-fade-in',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-3 py-2',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-muted rounded-bl-md'
          )}
        >
          {!isUser && msg.agent && (
            <div className="mb-1">
              {getAgentBadge(msg.agent)}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          {msg.timestamp && (
            <p className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {isUser && (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  };

  const renderInvoiceSelector = () => {
    const title = viewMode === 'send_reminder' ? 'Select Invoice for Reminder' : 'Select Invoice for Refund';
    const onSelect = viewMode === 'send_reminder' ? handleSelectInvoiceForReminder : handleSelectInvoiceForRefund;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMode('chat')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => onSelect(invoice)}
                  disabled={processingInvoiceId === invoice.id}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    'hover:bg-accent hover:border-accent-foreground/20',
                    processingInvoiceId === invoice.id && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{invoice.customer_name}</span>
                        <Badge className={cn('text-[10px]', getStatusColor(invoice.status))}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                      </p>
                      {invoice.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">${invoice.total.toLocaleString()}</p>
                      {processingInvoiceId === invoice.id && (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto mt-1" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const renderInvoiceForm = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMode('chat')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium text-sm">Create Invoice</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Customer Name *</Label>
              <Input className="h-8 text-sm" value={invoiceFormData.customer_name} onChange={e => setInvoiceFormData({ ...invoiceFormData, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input className="h-8 text-sm" type="email" value={invoiceFormData.customer_email} onChange={e => setInvoiceFormData({ ...invoiceFormData, customer_email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 text-sm" value={invoiceFormData.customer_phone} onChange={e => setInvoiceFormData({ ...invoiceFormData, customer_phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due in (days)</Label>
              <Input className="h-8 text-sm" type="number" value={invoiceFormData.due_days} onChange={e => setInvoiceFormData({ ...invoiceFormData, due_days: parseInt(e.target.value) || 30 })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Billing Address</Label>
            <Textarea className="text-sm min-h-[60px]" value={invoiceFormData.customer_address} onChange={e => setInvoiceFormData({ ...invoiceFormData, customer_address: e.target.value })} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Line Items</Label>
              <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={addInvoiceLineItem}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {invoiceFormData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-1 items-center">
                  <Input
                    className="col-span-5 h-7 text-xs"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateInvoiceLineItem(index, 'description', e.target.value)}
                  />
                  <Input
                    className="col-span-2 h-7 text-xs"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateInvoiceLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    className="col-span-3 h-7 text-xs"
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={e => updateInvoiceLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                  <div className="col-span-1 text-right text-[10px]">${(item.quantity * item.unit_price).toFixed(0)}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-6 w-6"
                    onClick={() => removeInvoiceLineItem(index)}
                    disabled={invoiceFormData.line_items.length === 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input className="h-8 text-sm" type="number" step="0.01" value={invoiceFormData.tax_rate} onChange={e => setInvoiceFormData({ ...invoiceFormData, tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input className="h-8 text-sm" value={invoiceFormData.notes} onChange={e => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })} />
            </div>
          </div>

          <div className="border-t pt-3 space-y-1 text-right">
            <div className="text-xs">Subtotal: ${invoiceSubtotal.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Tax ({invoiceFormData.tax_rate}%): ${invoiceTaxAmount.toFixed(2)}</div>
            <div className="text-sm font-bold">Total: ${invoiceTotal.toFixed(2)}</div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewMode('chat')}>Cancel</Button>
        <Button size="sm" className="flex-1" onClick={() => {
          if (!invoiceFormData.customer_name) {
            toast.error('Customer name is required');
            return;
          }
          createInvoiceMutation.mutate(invoiceFormData);
        }} disabled={createInvoiceMutation.isPending}>
          {createInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Create
        </Button>
      </div>
    </div>
  );

  const renderQuoteForm = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMode('chat')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium text-sm">Create Quote</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Customer Name *</Label>
              <Input className="h-8 text-sm" value={quoteFormData.customer_name} onChange={e => setQuoteFormData({ ...quoteFormData, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input className="h-8 text-sm" type="email" value={quoteFormData.customer_email} onChange={e => setQuoteFormData({ ...quoteFormData, customer_email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 text-sm" value={quoteFormData.customer_phone} onChange={e => setQuoteFormData({ ...quoteFormData, customer_phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valid Days</Label>
              <Input className="h-8 text-sm" type="number" value={quoteFormData.valid_days} onChange={e => setQuoteFormData({ ...quoteFormData, valid_days: parseInt(e.target.value) || 30 })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Address</Label>
            <Textarea className="text-sm min-h-[60px]" value={quoteFormData.customer_address} onChange={e => setQuoteFormData({ ...quoteFormData, customer_address: e.target.value })} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Line Items</Label>
              <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={addQuoteLineItem}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {quoteFormData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-1 items-center">
                  <Input
                    className="col-span-5 h-7 text-xs"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateQuoteLineItem(index, 'description', e.target.value)}
                  />
                  <Input
                    className="col-span-2 h-7 text-xs"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateQuoteLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    className="col-span-3 h-7 text-xs"
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={e => updateQuoteLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                  <div className="col-span-1 text-right text-[10px]">${(item.quantity * item.unit_price).toFixed(0)}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-6 w-6"
                    onClick={() => removeQuoteLineItem(index)}
                    disabled={quoteFormData.line_items.length === 1}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input className="h-8 text-sm" type="number" step="0.01" value={quoteFormData.tax_rate} onChange={e => setQuoteFormData({ ...quoteFormData, tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input className="h-8 text-sm" value={quoteFormData.notes} onChange={e => setQuoteFormData({ ...quoteFormData, notes: e.target.value })} />
            </div>
          </div>

          <div className="border-t pt-3 space-y-1 text-right">
            <div className="text-xs">Subtotal: ${quoteSubtotal.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Tax ({quoteFormData.tax_rate}%): ${quoteTaxAmount.toFixed(2)}</div>
            <div className="text-sm font-bold">Total: ${quoteTotal.toFixed(2)}</div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewMode('chat')}>Cancel</Button>
        <Button size="sm" className="flex-1" onClick={() => {
          if (!quoteFormData.customer_name) {
            toast.error('Customer name is required');
            return;
          }
          createQuoteMutation.mutate(quoteFormData);
        }} disabled={createQuoteMutation.isPending}>
          {createQuoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Create
        </Button>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMode('chat')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium text-sm">Revenue Report</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">{allInvoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">${totalOutstanding.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className={overdueCount > 0 ? 'border-destructive' : ''}>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-destructive">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={() => setViewMode('chat')}>
          Back to Chat
        </Button>
      </div>
    </div>
  );

  const renderChatView = () => (
    <>
      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Hello! I'm your Billing AI Assistant. I can help you:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Create and manage invoices</li>
                <li>• Send payment reminders</li>
                <li>• Generate revenue reports</li>
                <li>• Forecast payments and cash flow</li>
                <li>• Process refunds</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="border-t p-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about invoices, payments, or reports..."
            className="flex-1 h-9 text-sm"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'invoice_form':
        return renderInvoiceForm();
      case 'quote_form':
        return renderQuoteForm();
      case 'reports':
        return renderReports();
      case 'send_reminder':
      case 'process_refund':
        return renderInvoiceSelector();
      default:
        return renderChatView();
    }
  };

  return (
    <Card className={cn('flex flex-col h-[600px]', className)}>
      <CardHeader className="pb-2 border-b shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Billing AI Console
          </CardTitle>
          {viewMode === 'chat' && currentAgent && (
            <Badge variant="outline" className="text-xs">
              {BILLING_AGENTS.find(a => a.id === currentAgent)?.name || currentAgent}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
