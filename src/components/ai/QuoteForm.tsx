import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Send, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
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
  company?: Company | null;
  onSubmit: (data: QuoteData) => void;
  onCancel?: () => void;
  onSelectDifferentCompany?: () => void;
}

export function QuoteForm({ services, company, onSubmit, onCancel, onSelectDifferentCompany }: QuoteFormProps) {
  const [companyConfirmed, setCompanyConfirmed] = useState(false);
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

  // Show company confirmation step first
  if (!companyConfirmed && company) {
    return (
      <div className="p-4 space-y-4">
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
        <h3 className="font-semibold text-sm text-foreground">Request a Quote</h3>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Confirm Company
            </CardTitle>
            <CardDescription className="text-xs">
              You are requesting a quote from:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${company.primary_color || '#0EA5E9'}, ${company.primary_color || '#0EA5E9'}80)`
                }}
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  company.name.charAt(0)
                )}
              </div>
              <div>
                <p className="font-semibold">{company.name}</p>
                <p className="text-xs text-muted-foreground">{services.length} services available</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setCompanyConfirmed(true)}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Continue with {company.name}
              </Button>
              
              {onSelectDifferentCompany && (
                <Button 
                  variant="outline" 
                  onClick={onSelectDifferentCompany}
                  className="w-full text-xs"
                >
                  Select a Different Company
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h3 className="font-semibold text-sm text-foreground">Request a Quote</h3>
        {company && (
          <span className="text-xs text-muted-foreground ml-auto">from {company.name}</span>
        )}
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
          <Label className="text-xs text-muted-foreground">Services Needed *</Label>
          <div className="mt-1 space-y-1 max-h-24 overflow-y-auto border rounded p-1.5 bg-background">
            {services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`quote-service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <label htmlFor={`quote-service-${service.id}`} className="text-xs cursor-pointer flex-1 text-foreground">
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