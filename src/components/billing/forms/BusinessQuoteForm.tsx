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
import { AIContentButton } from '@/components/ai/AIContentButton';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getAppointmentRules } from '@/lib/industryFormSchemas';
import {
  useCustomerInteractionHistory,
  deriveDiscussedItems,
  buildContextNote,
} from '@/hooks/useCustomerInteractionHistory';
import { ConversationContextPanel } from '@/components/billing/ConversationContextPanel';

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
  /** Link the new quote back to an AI conversation. */
  contextId?: string | null;
  /** Prefill identity + items from the customer's recent AI/voice/SMS history. */
  prefillEmail?: string | null;
  prefillPhone?: string | null;
  prefillName?: string | null;
  prefillAddress?: string | null;
}

export function BusinessQuoteForm({ 
  companyId, 
  onSubmit, 
  onCancel, 
  onSuccess,
  isLoading = false, 
  showBackButton = true,
  mode = 'ai',
  contextId = null,
  prefillEmail = null,
  prefillPhone = null,
  prefillName = null,
  prefillAddress = null,
}: BusinessQuoteFormProps) {
  const queryClient = useQueryClient();
  const { pack } = useIndustryPack();
  const quoteNoun = (pack?.terminology as Record<string, string> | undefined)?.quote || 'Quote';
  const showAddress = getAppointmentRules(pack).address_required !== false;
  const quoteTemplate = (pack?.quote_template as { line_items?: Array<{ description: string; quantity?: number; unit_price?: number }> } | undefined) || {};
  const [customerName, setCustomerName] = useState(prefillName || '');
  const [customerPhone, setCustomerPhone] = useState(prefillPhone || '');
  const [customerEmail, setCustomerEmail] = useState(prefillEmail || '');
  const [customerAddress, setCustomerAddress] = useState(prefillAddress || '');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [validDays, setValidDays] = useState(30);
  const [lineItems, setLineItems] = useState<{description: string; quantity: number; unit_price: number}[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  // Pull AI conversation / call / SMS history for this customer
  const { data: history, isLoading: historyLoading } = useCustomerInteractionHistory({
    companyId,
    email: customerEmail || prefillEmail,
    phone: customerPhone || prefillPhone,
    enabled: mode === 'direct',
  });

  // One-shot prefill from AI context: items + note + identity (only if blank)
  const prefilledFromContextRef = React.useRef(false);
  React.useEffect(() => {
    if (mode !== 'direct') return;
    if (prefilledFromContextRef.current) return;
    if (!history?.length) return;
    const ctx = history.find((h) => h.kind === 'ai_context');
    const payload = ctx?.payload || {};
    const identity = payload.customer_identity || payload;
    if (!customerName && identity?.customer_name) setCustomerName(identity.customer_name);
    if (!customerAddress && payload?.context_data?.address) setCustomerAddress(payload.context_data.address);
    const items = deriveDiscussedItems(history);
    if (items.length > 0) {
      const isEmpty = lineItems.length === 1 && !lineItems[0].description && !lineItems[0].unit_price;
      if (isEmpty) setLineItems(items);
    }
    if (!issueDescription) {
      const note = buildContextNote(history);
      if (note) setIssueDescription(note);
    }
    prefilledFromContextRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, mode]);

  // Pre-fill line items from industry pack template (direct mode only, when blank)
  React.useEffect(() => {
    if (mode !== 'direct') return;
    const tmplItems = quoteTemplate.line_items;
    if (!Array.isArray(tmplItems) || tmplItems.length === 0) return;
    const isEmpty = lineItems.length === 1 && !lineItems[0].description && !lineItems[0].unit_price;
    if (!isEmpty) return;
    setLineItems(tmplItems.map((it) => ({
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack?.id, mode]);

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
          source_context_id: contextId || null,
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
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
        )}
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Create {quoteNoun}</h3>
      </div>

      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name *"
            className="h-9 text-sm w-full min-w-0"
            required
          />
          <Input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone Number"
            className="h-9 text-sm w-full min-w-0"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
          <Input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email Address"
            className="h-9 text-sm w-full min-w-0"
          />
          {showAddress ? (
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Service Address"
              className="h-9 text-sm w-full min-w-0"
            />
          ) : <div />}
        </div>

        {mode === 'ai' && (
          <div>
            <Label className="text-sm font-medium text-foreground">Services *</Label>
            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-background">
              {services.length > 0 ? (
                services.map((service) => (
                  <label key={service.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <span className="text-sm flex-1 text-foreground">{service.name}</span>
                    {service.price && (
                      <span className="text-xs text-foreground/60">${service.price}</span>
                    )}
                  </label>
                ))
              ) : (
                <p className="text-sm text-foreground/60 text-center py-2">No services available</p>
              )}
            </div>
          </div>
        )}

        {mode === 'direct' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
              <div className="space-y-1">
                <Label className="text-xs text-foreground/70">Tax Rate (%)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={taxRate} 
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-foreground/70">Valid Days</Label>
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
                <Label className="text-sm font-medium text-foreground">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="h-7">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto overflow-x-hidden">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-1 items-center min-w-0">
                    <div className="col-span-5 flex items-center gap-1 min-w-0">
                      <Input
                        className="h-8 text-xs flex-1 min-w-0"
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateLineItem(index, 'description', e.target.value)}
                      />
                      <AIContentButton
                        contentType="line_item_description"
                        existingContent={item.description}
                        onGenerate={(content) => updateLineItem(index, 'description', content)}
                        context={{ serviceType: item.description }}
                        size="sm"
                      />
                    </div>
                    <Input
                      className="col-span-2 h-8 text-xs min-w-0"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    <Input
                      className="col-span-3 h-8 text-xs min-w-0"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                    <div className="col-span-1 text-right text-xs text-foreground">${(item.quantity * item.unit_price).toFixed(0)}</div>
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
              <div className="border-t pt-2 mt-2 space-y-1 text-right text-sm text-foreground">
                <div>Subtotal: ${subtotal.toFixed(2)}</div>
                <div className="text-foreground/60 text-xs">Tax ({taxRate}%): ${taxAmount.toFixed(2)}</div>
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
            <Label className="text-sm font-medium text-foreground">Send Quote Via</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                <Mail className="h-4 w-4 text-foreground/60" />
                <span className="text-sm text-foreground">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={sendSms} onCheckedChange={setSendSms} />
                <MessageSquare className="h-4 w-4 text-foreground/60" />
                <span className="text-sm text-foreground">SMS</span>
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
            {mode === 'ai' ? `Create & Send ${quoteNoun}` : `Create ${quoteNoun}`}
          </>
        )}
      </Button>
    </form>
  );
}
