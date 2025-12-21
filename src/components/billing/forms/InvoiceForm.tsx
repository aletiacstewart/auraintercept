import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Receipt, Send, ArrowLeft, Mail, MessageSquare, Loader2, Search, User, Calendar, Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface InvoiceFormData {
  appointmentId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  serviceType: string;
  amount: string;
  notes: string;
  sendEmail: boolean;
  sendSms: boolean;
}

interface InvoiceFormProps {
  companyId: string;
  onSubmit?: (data: InvoiceFormData) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  isLoading?: boolean;
  showBackButton?: boolean;
  mode?: 'ai' | 'direct';
}

export function InvoiceForm({ 
  companyId, 
  onSubmit, 
  onCancel, 
  onSuccess,
  isLoading = false,
  showBackButton = true,
  mode = 'ai'
}: InvoiceFormProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [dueDays, setDueDays] = useState(30);
  const [lineItems, setLineItems] = useState<{description: string; quantity: number; unit_price: number}[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  // Get existing invoice count for generating invoice number
  const { data: invoiceCount = 0 } = useQuery({
    queryKey: ['invoice-count', companyId],
    queryFn: async () => {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      return count || 0;
    },
    enabled: !!companyId && mode === 'direct',
  });

  // Search for jobs/appointments
  const { data: appointments = [], isLoading: searchingJobs } = useQuery({
    queryKey: ['job-search', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_phone, customer_email, customer_address, service_type, datetime, status')
        .eq('company_id', companyId)
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`)
        .order('datetime', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!companyId && searchQuery.length >= 2,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const itemsToCreate = lineItems.filter(item => item.description && item.unit_price > 0);
      const subtotal = itemsToCreate.length > 0 
        ? itemsToCreate.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
        : parseFloat(amount) || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);

      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          invoice_number: invoiceNumber,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          notes: notes || null,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total: subtotal + taxAmount,
          due_date: dueDate.toISOString(),
          status: 'draft',
          appointment_id: selectedAppointmentId,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (itemsToCreate.length > 0) {
        const lineItemsToInsert = itemsToCreate.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsToInsert);
        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      resetForm();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const handleSelectAppointment = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setSelectedAppointmentId(apt.id);
      setCustomerName(apt.customer_name || '');
      setCustomerPhone(apt.customer_phone || '');
      setCustomerEmail(apt.customer_email || '');
      setCustomerAddress(apt.customer_address || '');
      setServiceType(apt.service_type || '');
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedAppointmentId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setServiceType('');
    setAmount('');
    setNotes('');
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setTaxRate(0);
    setDueDays(30);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'direct') {
      if (!customerName.trim()) {
        toast.error('Customer name is required');
        return;
      }
      createInvoiceMutation.mutate();
    } else {
      if (!customerName.trim() || !amount.trim()) return;
      if (!sendEmail && !sendSms) return;
      
      onSubmit?.({
        appointmentId: selectedAppointmentId,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        serviceType,
        amount,
        notes,
        sendEmail,
        sendSms,
      });
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const isValidAI = customerName.trim() && amount.trim() && (sendEmail || sendSms);
  const isValidDirect = customerName.trim();
  const isPending = isLoading || createInvoiceMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3">
      <div className="flex items-center gap-2 mb-3">
        {showBackButton && onCancel && (
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
        <Receipt className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{mode === 'direct' ? 'Create Invoice' : 'Generate Invoice'}</h3>
      </div>

      {/* Job/Customer Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Job or Customer
        </Label>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="h-9 text-sm"
        />
        {searchQuery.length >= 2 && appointments.length > 0 && (
          <div className="border rounded-lg max-h-40 overflow-y-auto">
            {appointments.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => handleSelectAppointment(apt.id)}
                className="w-full text-left p-2 hover:bg-muted/50 border-b last:border-b-0 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{apt.customer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{apt.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(apt.datetime), 'MMM d, yyyy')} - {apt.service_type}
                </div>
              </button>
            ))}
          </div>
        )}
        {searchingJobs && <p className="text-xs text-muted-foreground">Searching...</p>}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name *"
            className="h-9 text-sm"
            required
          />
          <Input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone Number"
            className="h-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email Address"
            className="h-9 text-sm"
          />
          <Input
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Billing Address"
            className="h-9 text-sm"
          />
        </div>

        {mode === 'ai' && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Service Type"
              className="h-9 text-sm"
            />
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount ($) *"
              className="h-9 text-sm"
              required
            />
          </div>
        )}

        {mode === 'direct' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={taxRate} 
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Due in (days)</Label>
                <Input 
                  type="number" 
                  value={dueDays} 
                  onChange={e => setDueDays(parseInt(e.target.value) || 30)} 
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="h-7">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-1 items-center">
                    <Input
                      className="col-span-5 h-8 text-xs"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateLineItem(index, 'description', e.target.value)}
                    />
                    <Input
                      className="col-span-2 h-8 text-xs"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    <Input
                      className="col-span-3 h-8 text-xs"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                    <div className="col-span-1 text-right text-xs">${(item.quantity * item.unit_price).toFixed(0)}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-6 w-6"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2 space-y-1 text-right text-sm">
                <div>Subtotal: ${subtotal.toFixed(2)}</div>
                <div className="text-muted-foreground text-xs">Tax ({taxRate}%): ${taxAmount.toFixed(2)}</div>
                <div className="font-bold">Total: ${total.toFixed(2)}</div>
              </div>
            </div>
          </>
        )}

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Invoice notes"
          rows={2}
          className="text-sm resize-none"
        />

        {mode === 'ai' && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Send Invoice Via</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={sendSms} onCheckedChange={setSendSms} />
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">SMS</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full h-9" 
        disabled={(mode === 'ai' ? !isValidAI : !isValidDirect) || isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {mode === 'ai' ? 'Generate & Send Invoice' : 'Create Invoice'}
          </>
        )}
      </Button>
    </form>
  );
}
