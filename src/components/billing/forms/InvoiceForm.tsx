import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Send, ArrowLeft, Mail, MessageSquare, Loader2, Search, User, Calendar, Plus, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { toast } from 'sonner';
import { AIContentButton } from '@/components/ai/AIContentButton';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getAppointmentRules } from '@/lib/industryFormSchemas';

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

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  appointmentId?: string | null;
}

let lineItemIdCounter = 0;
const generateLineItemId = () => `line-item-${++lineItemIdCounter}`;

interface SelectedJob {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  service_type: string;
  datetime: string;
  status: string;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
  flat_fee: number | null;
  hourly_rate: number | null;
  duration_minutes: number | null;
}

const EMPTY_APPOINTMENTS: SelectedJob[] = [];
const EMPTY_SERVICES: Service[] = [];

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
  const { pack } = useIndustryPack();
  const invoiceNoun = (pack?.terminology as Record<string, string> | undefined)?.invoice || 'Invoice';
  const showAddress = getAppointmentRules(pack).address_required !== false;
  const invoiceTemplate = (pack?.invoice_template as { line_items?: Array<{ description: string; quantity?: number; unit_price?: number }> } | undefined) || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<SelectedJob[]>([]);
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
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateLineItemId(), description: '', quantity: 1, unit_price: 0, appointmentId: null }
  ]);
  const prevSelectedJobsRef = useRef<string[]>([]);

  // Pre-fill line items from industry pack invoice_template (direct mode, when blank)
  useEffect(() => {
    if (mode !== 'direct') return;
    const tmplItems = invoiceTemplate.line_items;
    if (!Array.isArray(tmplItems) || tmplItems.length === 0) return;
    const isEmpty = lineItems.length === 1 && !lineItems[0].description && !lineItems[0].unit_price;
    if (!isEmpty) return;
    setLineItems(tmplItems.map((it) => ({
      id: generateLineItemId(),
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
      appointmentId: null,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack?.id, mode]);

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

  // Search for completed jobs/appointments
  const { data: appointmentsData, isLoading: searchingJobs } = useQuery({
    queryKey: ['job-search', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_phone, customer_email, customer_address, service_type, datetime, status')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`)
        .order('datetime', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!companyId && searchQuery.length >= 2,
  });

  const appointments = (appointmentsData ?? EMPTY_APPOINTMENTS) as SelectedJob[];

  // Fetch services for price lookup and manual add
  const { data: servicesData } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name, price, flat_fee, hourly_rate, duration_minutes')
        .eq('company_id', companyId)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!companyId,
  });

  const services = (servicesData ?? EMPTY_SERVICES) as Service[];

  // Auto-populate line items and customer info when jobs are selected
  useEffect(() => {
    const currentJobIds = [...selectedJobs].map(j => j.id).sort().join(',');
    const prevJobIds = [...prevSelectedJobsRef.current].sort().join(',');
    // Only run if selected jobs actually changed
    if (currentJobIds === prevJobIds) {
      return;
    }
    prevSelectedJobsRef.current = selectedJobs.map(j => j.id);

    if (selectedJobs.length === 0) {
      return;
    }

    // Use first job's customer info
    const firstJob = selectedJobs[0];
    setCustomerName(firstJob.customer_name || '');
    setCustomerPhone(firstJob.customer_phone || '');
    setCustomerEmail(firstJob.customer_email || '');
    setCustomerAddress(firstJob.customer_address || '');

    // Create line items from all selected jobs
    const jobLineItems: LineItem[] = selectedJobs.map(job => {
      const matchingService = services.find(s => 
        s.name.toLowerCase() === job.service_type?.toLowerCase()
      );
      const price = matchingService 
        ? (matchingService.price || matchingService.flat_fee || matchingService.hourly_rate || 0)
        : 0;
      
      return {
        id: `job-${job.id}`,
        description: job.service_type || 'Service',
        quantity: 1,
        unit_price: price,
        appointmentId: job.id,
      };
    });

    setLineItems(prev => {
      // Keep any manually added items (those without appointmentId)
      const manualItems = prev.filter(item => !item.appointmentId && item.description);
      return [...jobLineItems, ...manualItems];
    });

    // Also update the service type and amount for ai mode
    if (selectedJobs.length === 1) {
      const job = selectedJobs[0];
      setServiceType(job.service_type || '');
      const matchingService = services.find(s => 
        s.name.toLowerCase() === job.service_type?.toLowerCase()
      );
      const price = matchingService 
        ? (matchingService.price || matchingService.flat_fee || matchingService.hourly_rate || 0)
        : 0;
      setAmount(price > 0 ? price.toString() : '');
    } else if (selectedJobs.length > 1) {
      // Multiple jobs - show combined info
      setServiceType(selectedJobs.map(j => j.service_type).join(', '));
      const totalAmount = selectedJobs.reduce((sum, job) => {
        const matchingService = services.find(s => 
          s.name.toLowerCase() === job.service_type?.toLowerCase()
        );
        return sum + (matchingService 
          ? (matchingService.price || matchingService.flat_fee || matchingService.hourly_rate || 0)
          : 0);
      }, 0);
      setAmount(totalAmount > 0 ? totalAmount.toString() : '');
    }
  }, [selectedJobs, services]);

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

      // Use first selected job's appointment_id or null
      const primaryAppointmentId = selectedJobs.length > 0 ? selectedJobs[0].id : null;

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
          appointment_id: primaryAppointmentId,
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

  const handleToggleJob = (apt: SelectedJob) => {
    const isSelected = selectedJobs.some(j => j.id === apt.id);
    if (isSelected) {
      setSelectedJobs(selectedJobs.filter(j => j.id !== apt.id));
    } else {
      // Check if new job's customer matches existing selection
      if (selectedJobs.length > 0) {
        const firstCustomer = selectedJobs[0].customer_name?.toLowerCase();
        if (apt.customer_name?.toLowerCase() !== firstCustomer) {
          toast.error('All jobs must be for the same customer');
          return;
        }
      }
      setSelectedJobs([...selectedJobs, apt]);
    }
  };

  const handleRemoveJob = (jobId: string) => {
    setSelectedJobs(selectedJobs.filter(j => j.id !== jobId));
    setLineItems(lineItems.filter(item => item.appointmentId !== jobId));
  };

  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, { id: generateLineItemId(), description: '', quantity: 1, unit_price: 0, appointmentId: null }]);
  }, []);

  const addServiceLineItem = useCallback((serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const price = service.price || service.flat_fee || service.hourly_rate || 0;
      setLineItems(prev => [...prev, { 
        id: generateLineItemId(),
        description: service.name, 
        quantity: 1, 
        unit_price: price,
        appointmentId: null 
      }]);
    }
  }, [services]);

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    const itemToRemove = lineItems[index];
    // If removing a job-linked item, also remove from selectedJobs
    if (itemToRemove.appointmentId) {
      setSelectedJobs(selectedJobs.filter(j => j.id !== itemToRemove.appointmentId));
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedJobs([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setServiceType('');
    setAmount('');
    setNotes('');
    setLineItems([{ id: generateLineItemId(), description: '', quantity: 1, unit_price: 0, appointmentId: null }]);
    prevSelectedJobsRef.current = [];
    setTaxRate(0);
    setDueDays(30);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculatedTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    if (mode === 'direct') {
      if (!customerName.trim()) {
        toast.error('Customer name is required');
        return;
      }
      createInvoiceMutation.mutate();
    } else {
      if (!customerName.trim()) {
        toast.error('Customer name is required');
        return;
      }
      if (calculatedTotal <= 0) {
        toast.error('Please add at least one line item with a price');
        return;
      }
      if (!sendEmail && !sendSms) {
        toast.error('Please select at least one delivery method');
        return;
      }
      
      // Combine line items into service description and amount
      const serviceDescriptions = lineItems
        .filter(item => item.description)
        .map(item => item.description)
        .join(', ');
      
      onSubmit?.({
        appointmentId: selectedJobs.length > 0 ? selectedJobs[0].id : null,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        serviceType: serviceDescriptions || serviceType,
        amount: calculatedTotal.toFixed(2),
        notes,
        sendEmail,
        sendSms,
      });
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const hasValidLineItems = lineItems.some(item => item.description && item.unit_price > 0);
  const isValidAI = customerName.trim() && hasValidLineItems && (sendEmail || sendSms);
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
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
        )}
        <Receipt className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{mode === 'direct' ? `Create ${invoiceNoun}` : `Generate ${invoiceNoun}`}</h3>
      </div>

      {/* Selected Jobs Display */}
      {selectedJobs.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-foreground/70">Selected Jobs ({selectedJobs.length})</Label>
          <div className="flex flex-wrap gap-1">
            {selectedJobs.map(job => (
              <div 
                key={job.id} 
                className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                <span>{format(parseUTCDateTime(job.datetime), 'MMM d')} - {job.service_type}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveJob(job.id)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job/Customer Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Search className="h-4 w-4 text-foreground" />
          Search Completed Jobs
        </Label>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="h-9 text-sm"
        />
        {searchQuery.length >= 2 && appointments.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {appointments.map((apt) => {
              const isSelected = selectedJobs.some(j => j.id === apt.id);
              const handlePick = () => handleToggleJob(apt);
              return (
                <div
                  key={apt.id}
                  role="button"
                  tabIndex={0}
                  onClick={handlePick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePick();
                    }
                  }}
                  className={`w-full text-left p-2 hover:bg-muted/50 border-b last:border-b-0 text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border bg-background ${
                          isSelected ? 'border-primary text-primary' : 'border-input text-muted-foreground'
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{apt.customer_name}</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{apt.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 ml-6">
                    <Calendar className="h-3 w-3" />
                    {format(parseUTCDateTime(apt.datetime), 'MMM d, yyyy')} - {apt.service_type}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {searchingJobs && <p className="text-xs text-muted-foreground">Searching...</p>}
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
              placeholder="Billing Address"
              className="h-9 text-sm w-full min-w-0"
            />
          ) : <div />}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-foreground">Services / Line Items</Label>
            <div className="flex gap-1">
              {services.length > 0 && (
                <Select onValueChange={addServiceLineItem}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue placeholder="Add Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} - ${s.price || s.flat_fee || s.hourly_rate || 0}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="h-7">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-muted/20">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-5 flex items-center gap-1">
                  <Input
                    className="h-8 text-xs flex-1"
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
                <div className="col-span-1 text-right text-xs font-medium text-foreground">${(item.quantity * item.unit_price).toFixed(0)}</div>
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
            <div className="font-bold text-foreground">Total: ${subtotal.toFixed(2)}</div>
          </div>
        </div>

        {mode === 'direct' && (
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
              <Label className="text-xs text-foreground/70">Due in (days)</Label>
              <Input 
                type="number" 
                value={dueDays} 
                onChange={e => setDueDays(parseInt(e.target.value) || 30)} 
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {mode === 'direct' && taxRate > 0 && (
          <div className="text-right text-sm text-foreground/70">
            <div>Subtotal: ${subtotal.toFixed(2)}</div>
            <div>Tax ({taxRate}%): ${taxAmount.toFixed(2)}</div>
            <div className="font-bold text-foreground">Total: ${total.toFixed(2)}</div>
          </div>
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
            <Label className="text-sm font-medium text-foreground">Send {invoiceNoun} Via</Label>
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
        disabled={isPending || (mode === 'ai' ? !isValidAI : !isValidDirect)}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === 'direct' ? 'Creating...' : 'Generating...'}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {mode === 'direct' ? `Create ${invoiceNoun}` : `Generate ${invoiceNoun}`}
          </>
        )}
      </Button>
    </form>
  );
}
