import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Send, ArrowLeft, Mail, MessageSquare, Loader2, Search, User, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';

export interface WarrantyFormData {
  appointmentId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  serviceType: string;
  issueDescription: string;
  warrantyDetails: string;
  sendEmail: boolean;
  sendSms: boolean;
}

interface WarrantyFormProps {
  companyId: string;
  onSubmit?: (data: WarrantyFormData) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  isLoading?: boolean;
  showBackButton?: boolean;
  mode?: 'ai' | 'direct';
}

export function WarrantyForm({ 
  companyId, 
  onSubmit, 
  onCancel, 
  onSuccess,
  isLoading = false,
  showBackButton = true,
  mode = 'ai'
}: WarrantyFormProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [warrantyDetails, setWarrantyDetails] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  
  // Direct mode fields
  const [equipmentType, setEquipmentType] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [coverageType, setCoverageType] = useState('standard');
  const [warrantyStartDate, setWarrantyStartDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(12);

  // Search for completed jobs
  const { data: appointments = [], isLoading: searchingJobs } = useQuery({
    queryKey: ['warranty-job-search', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_phone, customer_email, customer_address, service_type, datetime, status')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`)
        .order('datetime', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!companyId && searchQuery.length >= 2,
  });

  const createWarrantyMutation = useMutation({
    mutationFn: async () => {
      const endDate = addMonths(new Date(warrantyStartDate), warrantyMonths);
      const { error } = await supabase.from('warranty_records').insert({
        company_id: companyId,
        customer_name: customerName,
        customer_email: customerEmail || null,
        equipment_type: equipmentType || null,
        equipment_model: equipmentModel || null,
        serial_number: serialNumber || null,
        coverage_type: coverageType,
        coverage_details: warrantyDetails || null,
        warranty_start_date: warrantyStartDate,
        warranty_end_date: format(endDate, 'yyyy-MM-dd'),
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty record created');
      resetForm();
      onSuccess?.();
    },
    onError: () => toast.error('Failed to create warranty'),
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
      setEquipmentType(apt.service_type || '');
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedAppointmentId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setServiceType('');
    setIssueDescription('');
    setWarrantyDetails('');
    setEquipmentType('');
    setEquipmentModel('');
    setSerialNumber('');
    setCoverageType('standard');
    setWarrantyStartDate('');
    setWarrantyMonths(12);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'direct') {
      if (!customerName.trim() || !warrantyStartDate) {
        toast.error('Customer name and start date are required');
        return;
      }
      createWarrantyMutation.mutate();
    } else {
      if (!customerName.trim() || !issueDescription.trim()) return;
      if (!sendEmail && !sendSms) return;
      
      onSubmit?.({
        appointmentId: selectedAppointmentId,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        serviceType,
        issueDescription,
        warrantyDetails,
        sendEmail,
        sendSms,
      });
    }
  };

  const isValidAI = customerName.trim() && issueDescription.trim() && (sendEmail || sendSms);
  const isValidDirect = customerName.trim() && warrantyStartDate;
  const isPending = isLoading || createWarrantyMutation.isPending;

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
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{mode === 'direct' ? 'Create Warranty Record' : 'Warranty Claim'}</h3>
      </div>

      {/* Job/Customer Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          {mode === 'direct' ? 'Search Customer' : 'Search Completed Job'}
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
                  <span className="text-xs text-green-600">completed</span>
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
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email Address"
            className="h-9 text-sm"
          />
        </div>

        {mode === 'ai' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number"
                className="h-9 text-sm"
              />
              <Input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Service Type"
                className="h-9 text-sm"
              />
            </div>

            <Textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the warranty issue *"
              rows={2}
              className="text-sm resize-none"
              required
            />
          </>
        )}

        {mode === 'direct' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                placeholder="Equipment Type"
                className="h-9 text-sm"
              />
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial Number"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Date *</Label>
                <Input 
                  type="date" 
                  value={warrantyStartDate} 
                  onChange={e => setWarrantyStartDate(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Warranty Period</Label>
                <Select value={String(warrantyMonths)} onValueChange={(v) => setWarrantyMonths(Number(v))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <Textarea
          value={warrantyDetails}
          onChange={(e) => setWarrantyDetails(e.target.value)}
          placeholder={mode === 'direct' ? 'Coverage details' : 'Warranty resolution details'}
          rows={2}
          className="text-sm resize-none"
        />

        {mode === 'ai' && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Send Warranty Info Via</Label>
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
            {mode === 'direct' ? 'Creating...' : 'Processing...'}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {mode === 'direct' ? 'Create Warranty' : 'Submit Warranty Claim'}
          </>
        )}
      </Button>
    </form>
  );
}
