import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Auto-populate line items when jobs are selected
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
        appointmentId: selectedJobs.length > 0 ? selectedJobs[0].id : null,
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

      {/* Selected Jobs Display */}
      {selectedJobs.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Selected Jobs ({selectedJobs.length})</Label>
          <div className="flex flex-wrap gap-1">
            {selectedJobs.map(job => (
              <div 
                key={job.id} 
                className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
              >
                <span>{format(new Date(job.datetime), 'MMM d')} - {job.service_type}</span>
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
        <Label className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
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
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => handleToggleJob(apt)}
                  className={`w-full text-left p-2 hover:bg-muted/50 border-b last:border-b-0 text-sm ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{apt.customer_name}</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{apt.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 ml-6">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(apt.datetime), 'MMM d, yyyy')} - {apt.service_type}
                  </div>
                </button>
              );
            })}
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
                    <Plus className="w-3 h-3 mr-1" /> Manual
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-1 items-center">
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
            {mode === 'direct' ? 'Create Invoice' : 'Generate Invoice'}
          </>
        )}
      </Button>
    </form>
  );
}
