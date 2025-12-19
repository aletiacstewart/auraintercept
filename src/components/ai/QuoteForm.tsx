import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Send, ArrowLeft } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
}

export interface QuoteData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  selectedServices: string[];
  issueDescription: string;
}

interface QuoteFormProps {
  services: Service[];
  onSubmit: (data: QuoteData) => void;
  onCancel?: () => void;
}

export function QuoteForm({ services, onSubmit, onCancel }: QuoteFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState('');

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
    
    onSubmit({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      selectedServices,
      issueDescription,
    });
  };

  const isValid = customerName.trim() && customerPhone.trim() && selectedServices.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-2">
      <div className="flex items-center gap-2 mb-2">
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
        <DollarSign className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Request a Quote</h3>
      </div>

      <div className="space-y-2">
        <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Your Name *"
          className="h-8 text-xs"
          required
        />

        <Input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Phone Number *"
          className="h-8 text-xs"
          required
        />

        <Input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Email (optional)"
          className="h-8 text-xs"
        />

        <Input
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          placeholder="Service Address"
          className="h-8 text-xs"
        />

        <div>
          <Label className="text-xs">Services Needed *</Label>
          <div className="mt-1 space-y-1 max-h-24 overflow-y-auto border rounded p-1.5">
            {services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`quote-service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <label htmlFor={`quote-service-${service.id}`} className="text-xs cursor-pointer flex-1">
                    {service.name}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No services available</p>
            )}
          </div>
        </div>

        <Textarea
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Describe your issue (optional)"
          rows={2}
          className="text-xs resize-none"
        />
      </div>

      <Button type="submit" className="w-full h-8 text-xs" disabled={!isValid}>
        <Send className="h-3 w-3 mr-1" />
        Request Quote
      </Button>
    </form>
  );
}
