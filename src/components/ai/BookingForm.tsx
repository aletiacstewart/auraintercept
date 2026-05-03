import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, User, Phone, MapPin, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CommunicationPreferencesCheckboxes, CommunicationPreferences } from '@/components/customer/CommunicationPreferencesCheckboxes';
import { useIndustryPack, usePublicIndustryPack } from '@/hooks/useIndustryPack';
import { resolveFormSchema, validateIntake } from '@/lib/industryFormSchemas';
import { DynamicIntakeFields } from '@/components/forms/DynamicIntakeFields';

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
  /** Company id used to resolve the industry pack for dynamic intake fields. */
  companyId?: string | null;
  /** When true, fetch the pack via the unauthenticated public RPC. */
  isPublic?: boolean;
}

export interface BookingData {
  selectedServices: string[];
  date: Date;
  time: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  smsOptIn: boolean;
  emailOptIn: boolean;
  callOptIn: boolean;
  intakeData?: Record<string, unknown>;
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
  isLoading = false,
  companyId,
  isPublic = false,
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [communicationPrefs, setCommunicationPrefs] = useState<CommunicationPreferences>({
    smsOptIn: true,
    emailOptIn: true,
    callOptIn: true,
  });
  const [intakeData, setIntakeData] = useState<Record<string, unknown>>({});

  // Resolve the industry pack (auth or public) — hooks must run unconditionally.
  const authPack = useIndustryPack(isPublic ? null : companyId ?? undefined);
  const publicPack = usePublicIndustryPack(isPublic ? companyId ?? null : null);
  const pack = isPublic ? publicPack.pack : authPack.pack;

  // Industry-aware terminology for headings, notice, and CTA copy.
  const term = (pack?.terminology ?? {}) as Record<string, string>;
  const apptNoun = term.appointment || 'Appointment';
  const apptNounLower = apptNoun.toLowerCase();
  const apptArticle = /^[aeiou]/i.test(apptNounLower) ? 'an' : 'a';
  const apptPlural = apptNoun.endsWith('s') ? apptNoun : `${apptNoun}s`;

  // Build the intake schema from the FIRST selected service (single-service intake).
  const primaryServiceName = selectedServices.length > 0
    ? services.find((s) => s.id === selectedServices[0])?.name ?? ''
    : '';
  const intakeSchema = resolveFormSchema(pack, primaryServiceName);

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
    const missing = validateIntake(intakeSchema, intakeData);
    if (missing.length > 0) {
      // Block submission silently; required indicators surface via DynamicIntakeFields.
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
      smsOptIn: communicationPrefs.smsOptIn,
      emailOptIn: communicationPrefs.emailOptIn,
      callOptIn: communicationPrefs.callOptIn,
      intakeData: intakeSchema ? intakeData : undefined,
    });
  };

  const intakeMissing = intakeSchema ? validateIntake(intakeSchema, intakeData).length > 0 : false;
  const isValid = date && time && customerName && customerPhone && customerAddress && selectedServices.length > 0 && !intakeMissing;

  const selectedServiceNames = services
    .filter(s => selectedServices.includes(s.id))
    .map(s => s.name);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Request {apptArticle} {apptNoun}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
          {/* Services Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Select Services *</Label>
            <div className="border rounded-lg p-2 max-h-[120px] overflow-y-auto">
              <div className="space-y-1">
                {services.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">
                    No services available
                  </p>
                ) : (
                  services.map((service) => (
                    <label
                      key={service.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                        selectedServices.includes(service.id) 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="font-medium text-xs">{service.name}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {service.duration_minutes}m
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-8",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {date ? format(date, "MMM d") : "Select"}
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

            <div className="space-y-1">
              <Label className="text-xs font-medium">Time *</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select">
                    {time ? TIME_SLOTS.find(t => t.value === time)?.label : "Select"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value} className="text-xs">
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Info - Compact */}
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Your Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-8 h-8 text-xs"
                required
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Phone Number *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="pl-8 h-8 text-xs"
                type="tel"
                required
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Service Address *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="pl-8 h-8 text-xs"
                required
              />
            </div>
          </div>

          {/* Notes - Smaller */}
          <div className="space-y-1">
            <Textarea
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-xs"
            />
          </div>

          {/* Industry-specific intake fields (renders null if no schema) */}
          {intakeSchema && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Label className="text-xs font-semibold text-primary">
                {intakeSchema.title || 'Service Details'}
              </Label>
              <DynamicIntakeFields
                schema={intakeSchema}
                value={intakeData}
                onChange={setIntakeData}
              />
            </div>
          )}

          {/* Communication Preferences */}
          <CommunicationPreferencesCheckboxes
            preferences={communicationPrefs}
            onChange={setCommunicationPrefs}
            compact
          />

          {/* Pending Notice */}
          <div className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-xs text-cyan-200/70">
            <span className="mt-0.5 shrink-0 text-cyan-400">ℹ️</span>
            <span>All {apptPlural.toLowerCase()} are <strong className="text-cyan-300">pending until approved</strong> by the company. Once confirmed, you'll receive a notification via Email, SMS, and/or Call. Thank you!</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit" 
            className="w-full h-9 text-sm" 
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Request {apptNoun}
              </>
            )}
          </Button>
      </form>
    </div>
  );
};
