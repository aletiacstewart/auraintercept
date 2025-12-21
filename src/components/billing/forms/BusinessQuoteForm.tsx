import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { FileText, Send, ArrowLeft, Mail, MessageSquare, Loader2, Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
}

export interface BusinessQuoteData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  selectedServices: string[];
  issueDescription: string;
  sendEmail: boolean;
  sendSms: boolean;
}

interface BusinessQuoteFormProps {
  companyId: string;
  onSubmit?: (data: BusinessQuoteData) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  isLoading?: boolean;
  showBackButton?: boolean;
  mode?: 'ai' | 'direct'; // 'ai' sends to AI agent, 'direct' creates quote directly
}

export function BusinessQuoteForm({ 
  companyId, 
  onSubmit, 
  onCancel, 
  onSuccess,
  isLoading = false, 
  showBackButton = true,
  mode = 'ai'
}: BusinessQuoteFormProps) {
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [validDays, setValidDays] = useState(30);
  const [lineItems, setLineItems] = useState<{description: string; quantity: number; unit_price: number}[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  const { data: services = [] } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name, description, price')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');
      return (data || []) as Service[];
    },
    enabled: !!companyId,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      // Use line items if populated, otherwise use selected services
      let itemsToCreate = lineItems.filter(item => item.description && item.unit_price > 0);
      
      // If no manual line items but services selected, create line items from services
      if (itemsToCreate.length === 0 && selectedServices.length > 0) {
        itemsToCreate = selectedServices.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          return {
            description: service?.name || '',
            quantity: 1,
            unit_price: service?.price || 0,
          };
        });
      }

      const subtotal = itemsToCreate.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * (taxRate / 100);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          company_id: companyId,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          notes: issueDescription || null,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: subtotal + taxAmount,
          valid_until: validUntil.toISOString(),
          status: 'draft',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      if (itemsToCreate.length > 0) {
        const lineItemsToInsert = itemsToCreate.map(item => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItemsToInsert);
        if (itemsError) throw itemsError;
      }

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote created successfully');
      resetForm();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create quote'),
  });

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
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
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setSelectedServices([]);
    setIssueDescription('');
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setTaxRate(0);
    setValidDays(30);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'direct') {
      if (!customerName.trim()) {
        toast.error('Customer name is required');
        return;
      }
      createQuoteMutation.mutate();
    } else {
      // AI mode
      if (!customerName.trim() || !customerPhone.trim() || selectedServices.length === 0) return;
      if (!sendEmail && !sendSms) return;
      
      onSubmit?.({
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        selectedServices,
        issueDescription,
        sendEmail,
        sendSms,
      });
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const isValidAI = customerName.trim() && customerPhone.trim() && selectedServices.length > 0 && (sendEmail || sendSms);
  const isValidDirect = customerName.trim();
  const isPending = isLoading || createQuoteMutation.isPending;

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
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Create Quote</h3>
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
            placeholder="Service Address"
            className="h-9 text-sm"
          />
        </div>

        {mode === 'ai' && (
          <div>
            <Label className="text-sm font-medium">Services *</Label>
            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
              {services.length > 0 ? (
                services.map((service) => (
                  <label key={service.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <span className="text-sm flex-1">{service.name}</span>
                    {service.price && (
                      <span className="text-xs text-muted-foreground">${service.price}</span>
                    )}
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No services available</p>
              )}
            </div>
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
                <Label className="text-xs">Valid Days</Label>
                <Input 
                  type="number" 
                  value={validDays} 
                  onChange={e => setValidDays(parseInt(e.target.value) || 30)} 
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
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Additional notes or issue description"
          rows={2}
          className="text-sm resize-none"
        />

        {mode === 'ai' && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Send Quote Via</Label>
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
            {mode === 'ai' ? 'Create & Send Quote' : 'Create Quote'}
          </>
        )}
      </Button>
    </form>
  );
}
