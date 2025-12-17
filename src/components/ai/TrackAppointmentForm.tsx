import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Track My Appointment</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder="Your Name"
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          className="h-8 text-xs"
        />

        <Input
          type="tel"
          placeholder="Phone Number"
          value={formData.customerPhone}
          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          className="h-8 text-xs"
        />

        <Input
          type="email"
          placeholder="Email (optional)"
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          className="h-8 text-xs"
        />

        <p className="text-[10px] text-muted-foreground">
          Provide your name or phone to look up your appointment.
        </p>

        <Button 
          type="submit" 
          className="w-full h-8 text-xs"
          disabled={!formData.customerName.trim() && !formData.customerPhone.trim()}
        >
          Find My Appointment
        </Button>
      </form>
    </div>
  );
}
