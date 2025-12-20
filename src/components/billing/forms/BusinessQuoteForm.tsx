import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { FileText, Send, ArrowLeft, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  onSubmit: (data: BusinessQuoteData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function BusinessQuoteForm({ companyId, onSubmit, onCancel, isLoading = false }: BusinessQuoteFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);

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

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || selectedServices.length === 0) return;
    if (!sendEmail && !sendSms) return;
    
    onSubmit({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      selectedServices,
      issueDescription,
      sendEmail,
      sendSms,
    });
  };

  const isValid = customerName.trim() && customerPhone.trim() && selectedServices.length > 0 && (sendEmail || sendSms);

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
            placeholder="Phone Number *"
            className="h-9 text-sm"
            required
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

        <Textarea
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Additional notes or issue description"
          rows={2}
          className="text-sm resize-none"
        />

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
      </div>

      <Button type="submit" className="w-full h-9" disabled={!isValid || isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Create & Send Quote
          </>
        )}
      </Button>
    </form>
  );
}
