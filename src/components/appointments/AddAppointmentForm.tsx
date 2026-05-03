import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, User, Phone, Mail, MapPin, Loader2, Send, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { DynamicIntakeFields } from '@/components/forms/DynamicIntakeFields';
import { resolveFormSchema, validateIntake } from '@/lib/industryFormSchemas';
import { getIndustryFieldLabel } from '@/lib/industryFieldLabels';
import { hasFieldTechnicians } from '@/lib/industryCapabilities';
import { getNavLabels } from '@/lib/industryNavLabels';

interface AddAppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TechnicianOption {
  id: string;
  full_name: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  duration_minutes: number;
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

export const AddAppointmentForm: React.FC<AddAppointmentFormProps> = ({ 
  onSuccess,
  onCancel 
}) => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const { pack } = useIndustryPack();
  
  const [selectedService, setSelectedService] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [assignedTechnician, setAssignedTechnician] = useState<string>('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [callOptIn, setCallOptIn] = useState(true);
  const [intakeData, setIntakeData] = useState<Record<string, unknown>>({});

  // Fetch services
  const { data: services = [] } = useQuery<ServiceOption[]>({
    queryKey: ['services', companyId],
    queryFn: async (): Promise<ServiceOption[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration_minutes')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as ServiceOption[];
    },
    enabled: !!companyId,
  });

  // Fall back to industry-pack job templates when the company has not
  // configured custom services yet, so the dropdown is industry-relevant
  // out of the box (e.g. "Buyer Showing" for real estate, "No Cooling –
  // Emergency" for HVAC) instead of empty or generic.
  const packServices: ServiceOption[] = React.useMemo(() => {
    if (services.length > 0) return [];
    const templates = (pack.job_templates || []) as Array<{
      id?: string;
      label?: string;
      duration_minutes?: number;
    }>;
    return templates
      .filter(t => t && t.label)
      .map(t => ({
        id: `pack:${t.id || t.label}`,
        name: t.label as string,
        duration_minutes: t.duration_minutes ?? 60,
      }));
  }, [services, pack.job_templates]);

  const effectiveServices = services.length > 0 ? services : packServices;
  const serviceField   = getIndustryFieldLabel('appointment', 'service_type', pack);
  const addressField   = getIndustryFieldLabel('appointment', 'service_address', pack);
  const customerField  = getIndustryFieldLabel('appointment', 'customer_name', pack);
  const serviceLabel = `${serviceField.label} *`;

  // When the chosen service maps to an industry job template that defines a
  // form_id, render those questions inline (e.g. MLS# for real estate
  // showings, system age for HVAC service calls).
  const intakeSchema = React.useMemo(
    () => resolveFormSchema(pack, selectedService),
    [pack, selectedService],
  );

  // Fetch technicians  
  const { data: technicians = [] } = useQuery<TechnicianOption[]>({
    queryKey: ['technicians-list', companyId],
    queryFn: async (): Promise<TechnicianOption[]> => {
      if (!companyId) return [];
      // Fetch with explicit typing to avoid deep instantiation
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?company_id=eq.${companyId}&role=eq.employee&select=id,full_name`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch technicians');
      return response.json();
    },
    enabled: !!companyId,
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!companyId || !date || !time) throw new Error('Missing required fields');

      // Combine date and time
      const [hours, minutes] = time.split(':').map(Number);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          customer_address: customerAddress || null,
          service_type: selectedService,
          datetime: appointmentDate.toISOString(),
          duration_minutes: duration,
          notes: notes || null,
          employee_id: assignedTechnician || null,
          status: 'pending',
          sms_opt_out: !smsOptIn,
          email_opt_out: !emailOptIn,
          call_opt_out: !callOptIn,
          intake_data: intakeData as never,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Appointment created successfully!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to create appointment: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !customerName || !selectedService) {
      toast.error('Please fill in all required fields');
      return;
    }
    const intakeErrors = validateIntake(intakeSchema, intakeData);
    if (intakeErrors.length > 0) {
      toast.error(`Please fill in: ${intakeErrors.join(', ')}`);
      return;
    }
    createAppointment.mutate();
  };

  const isValid = date && time && customerName && selectedService;

  return (
    <Card className="border-0 bg-background shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Add New Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/50 rounded-b-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="text-foreground/70">{serviceLabel}</Label>
            <Select
              value={selectedService}
              onValueChange={(v) => {
                setSelectedService(v);
                setIntakeData({}); // reset intake when switching services
              }}
            >
              <SelectTrigger className="bg-white text-slate-900 border-border">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {effectiveServices.map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Industry-specific intake questions (no-op when not configured) */}
          <DynamicIntakeFields
            schema={intakeSchema}
            value={intakeData}
            onChange={setIntakeData}
            title={
              pack.terminology?.job
                ? `${pack.terminology.job} Details`
                : 'Job Details'
            }
          />

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white text-slate-900 border-border",
                      !date && "text-slate-400"
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

            <div className="space-y-2">
              <Label className="text-foreground/70">Time *</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="bg-white text-slate-900 border-border">
                  <SelectValue placeholder="Select time" />
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

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Duration (minutes)</Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="bg-white text-slate-900 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <Label className="text-foreground/70">Customer Information</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={`${customerField.label} *`}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10 bg-white text-slate-900 border-border placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-10 bg-white text-slate-900 border-border placeholder:text-slate-400"
                  type="tel"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="pl-10 bg-white text-slate-900 border-border placeholder:text-slate-400"
                  type="email"
                />
              </div>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={addressField.label}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="pl-10 bg-white text-slate-900 border-border placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Assign Technician — only shown for verticals that dispatch field staff */}
          {hasFieldTechnicians(pack) && (
            <div className="space-y-2">
              <Label className="text-foreground/70">Assign {getNavLabels(pack!).teamMemberNoun} (optional)</Label>
              <Select value={assignedTechnician} onValueChange={(val) => setAssignedTechnician(val === 'unassigned' ? '' : val)}>
                <SelectTrigger className="bg-white text-slate-900 border-border">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-white text-slate-900 border-border placeholder:text-slate-400"
            />
          </div>

          {/* Communication Preferences */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Send Reminders Via</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sms-opt"
                  checked={smsOptIn}
                  onCheckedChange={(checked) => setSmsOptIn(!!checked)}
                />
                <Label htmlFor="sms-opt" className="text-sm cursor-pointer text-foreground/70">SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="email-opt"
                  checked={emailOptIn}
                  onCheckedChange={(checked) => setEmailOptIn(!!checked)}
                />
                <Label htmlFor="email-opt" className="text-sm cursor-pointer text-foreground/70">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="call-opt"
                  checked={callOptIn}
                  onCheckedChange={(checked) => setCallOptIn(!!checked)}
                />
                <Label htmlFor="call-opt" className="text-sm cursor-pointer text-foreground/70">Call</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={!isValid || createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Appointment
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
