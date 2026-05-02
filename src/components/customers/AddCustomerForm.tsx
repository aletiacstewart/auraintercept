import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Mail, Phone, MapPin, MessageSquare, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { useIndustryFieldLabel } from '@/lib/industryFieldLabels';

interface AddCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCustomerForm({ open, onOpenChange }: AddCustomerFormProps) {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const fieldLabel = useIndustryFieldLabel('customer');
  const customerNoun = fieldLabel('customer_name').label;
  const addressLabel = fieldLabel('service_address').label;
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Opt-in preferences (default to opted IN)
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [callOptIn, setCallOptIn] = useState(true);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setSmsOptIn(true);
    setEmailOptIn(true);
    setCallOptIn(true);
  };

  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      if (!firstName.trim() || !email.trim()) {
        throw new Error('First name and email are required');
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const { data, error } = await supabase
        .from('customer_profiles')
        .insert({
          company_id: companyId,
          name: fullName,
          email: email.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          sms_opt_out: !smsOptIn,
          email_opt_out: !emailOptIn,
          call_opt_out: !callOptIn,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-preferences'] });
      toast.success('Customer added successfully');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add customer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New {customerNoun}
          </DialogTitle>
          <DialogDescription>
            Create a new {customerNoun.toLowerCase()} profile with contact information and communication preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {addressLabel}
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          {/* Communication Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Communication Preferences</Label>
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="smsOptIn"
                  checked={smsOptIn}
                  onCheckedChange={(checked) => setSmsOptIn(checked === true)}
                />
                <label
                  htmlFor="smsOptIn"
                  className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  SMS Notifications
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="emailOptIn"
                  checked={emailOptIn}
                  onCheckedChange={(checked) => setEmailOptIn(checked === true)}
                />
                <label
                  htmlFor="emailOptIn"
                  className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Notifications
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="callOptIn"
                  checked={callOptIn}
                  onCheckedChange={(checked) => setCallOptIn(checked === true)}
                />
                <label
                  htmlFor="callOptIn"
                  className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                >
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  Phone Calls
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
