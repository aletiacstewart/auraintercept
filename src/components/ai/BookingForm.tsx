import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Clock, User, Phone, MapPin, Loader2, Send, FileText, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
}

interface BookingFormProps {
  services: Service[];
  onSubmit: (booking: BookingData) => void;
  isLoading?: boolean;
}

export interface BookingData {
  selectedServices: string[];
  date: Date;
  time: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
}

// Generate time slots from 8 AM to 6 PM
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = i % 2 === 0 ? '00' : '30';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute}`,
    label: `${displayHour}:${minute} ${period}`
  };
});

export const BookingForm: React.FC<BookingFormProps> = ({ 
  services, 
  onSubmit, 
  isLoading = false 
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !customerName || !customerPhone || !customerAddress || selectedServices.length === 0) {
      return;
    }
    
    onSubmit({
      selectedServices,
      date,
      time,
      customerName,
      customerPhone,
      customerAddress,
      notes: notes.trim() || undefined,
    });
  };

  const isValid = date && time && customerName && customerPhone && customerAddress && selectedServices.length > 0;

  const selectedServiceNames = services
    .filter(s => selectedServices.includes(s.id))
    .map(s => s.name);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Request an Appointment
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your preferred date and time. Our team will review and confirm your appointment.
        </p>
      </div>

      {/* Approval Notice */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Note:</strong> This is a request, not a confirmed booking. Our team will review your request and contact you to confirm availability or suggest alternative times.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Services Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Services *</Label>
            <ScrollArea className="h-[180px] border rounded-lg p-3">
              <div className="space-y-2">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No services available
                  </p>
                ) : (
                  services.map((service) => (
                    <label
                      key={service.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedServices.includes(service.id) 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{service.name}</span>
                          {service.price && (
                            <span className="text-xs text-muted-foreground">${service.price}</span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
            {selectedServices.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedServiceNames.join(', ')}
              </p>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Time *</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time">
                    {time ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {TIME_SLOTS.find(t => t.value === time)?.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select time</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Contact Information</Label>
            
            {/* Name */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Your Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-10"
                  type="tel"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Service Address *"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Additional Notes (Optional)
            </Label>
            <Textarea
              placeholder="Any special instructions, equipment details, or notes for our team..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Request Appointment
              </>
            )}
          </Button>
      </form>
    </div>
  );
};
