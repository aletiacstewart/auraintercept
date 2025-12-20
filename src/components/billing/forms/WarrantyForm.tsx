import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Send, ArrowLeft, Mail, MessageSquare, Loader2, Search, User, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  onSubmit: (data: WarrantyFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function WarrantyForm({ companyId, onSubmit, onCancel, isLoading = false }: WarrantyFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !issueDescription.trim()) return;
    if (!sendEmail && !sendSms) return;
    
    onSubmit({
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
  };

  const isValid = customerName.trim() && issueDescription.trim() && (sendEmail || sendSms);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3">
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
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Warranty Claim</h3>
      </div>

      {/* Job/Customer Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Completed Job
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

        <Textarea
          value={warrantyDetails}
          onChange={(e) => setWarrantyDetails(e.target.value)}
          placeholder="Warranty resolution details"
          rows={2}
          className="text-sm resize-none"
        />

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
      </div>

      <Button type="submit" className="w-full h-9" disabled={!isValid || isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Submit Warranty Claim
          </>
        )}
      </Button>
    </form>
  );
}
