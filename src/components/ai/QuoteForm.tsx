import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Send } from 'lucide-react';

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
}

export function QuoteForm({ services, onSubmit }: QuoteFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-full bg-primary/10">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Request a Quote</h3>
          <p className="text-sm text-muted-foreground">Fill out the form below for a free estimate</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="quote-name">Your Name *</Label>
          <Input
            id="quote-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Smith"
            required
          />
        </div>

        <div>
          <Label htmlFor="quote-phone">Phone Number *</Label>
          <Input
            id="quote-phone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
        </div>

        <div>
          <Label htmlFor="quote-email">Email (optional)</Label>
          <Input
            id="quote-email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div>
          <Label htmlFor="quote-address">Service Address</Label>
          <Input
            id="quote-address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="123 Main St, City, State"
          />
        </div>

        <div>
          <Label>Services Needed *</Label>
          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
            {services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`quote-service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <label
                    htmlFor={`quote-service-${service.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="font-medium">{service.name}</span>
                    {service.price && (
                      <span className="text-muted-foreground ml-1">
                        - ${service.price}
                      </span>
                    )}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No services available</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="quote-description">Describe Your Issue</Label>
          <Textarea
            id="quote-description"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Please describe the issue or service you need..."
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!isValid}>
        <Send className="h-4 w-4 mr-2" />
        Request Quote
      </Button>
    </form>
  );
}
