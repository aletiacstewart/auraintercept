import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

export interface TrackingData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

interface TrackAppointmentFormProps {
  onSubmit: (data: TrackingData) => void;
}

export function TrackAppointmentForm({ onSubmit }: TrackAppointmentFormProps) {
  const [formData, setFormData] = useState<TrackingData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() && !formData.customerPhone.trim() && !formData.customerEmail.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Track My Appointment</h3>
          <p className="text-sm text-muted-foreground">Enter your details to find your appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Your Name</Label>
          <Input
            id="customerName"
            placeholder="John Smith"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email (optional)</Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="john@example.com"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Please provide at least your name or phone number to look up your appointment.
        </p>

        <Button 
          type="submit" 
          className="w-full"
          disabled={!formData.customerName.trim() && !formData.customerPhone.trim()}
        >
          Find My Appointment
        </Button>
      </form>
    </div>
  );
}
