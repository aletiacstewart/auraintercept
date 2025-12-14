import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Phone, Loader2 } from 'lucide-react';

interface OutboundCallDialogProps {
  trigger?: React.ReactNode;
  defaultPhone?: string;
  defaultName?: string;
  appointmentDetails?: {
    service: string;
    datetime: string;
    employeeName?: string;
  };
}

export function OutboundCallDialog({
  trigger,
  defaultPhone = '',
  defaultName = '',
  appointmentDetails,
}: OutboundCallDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  const [customerName, setCustomerName] = useState(defaultName);
  const [purpose, setPurpose] = useState<'reminder' | 'followup' | 'custom'>(
    appointmentDetails ? 'reminder' : 'custom'
  );
  const [customMessage, setCustomMessage] = useState('');

  const callMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const { data, error } = await supabase.functions.invoke('outbound-call', {
        body: {
          companyId,
          customerPhone,
          customerName,
          purpose,
          appointmentDetails,
          customMessage: purpose === 'custom' ? customMessage : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Call initiated successfully!', {
        description: `Call SID: ${data.callSid}`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Call error:', error);
      toast.error('Failed to initiate call', {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    if (!defaultPhone) setCustomerPhone('');
    if (!defaultName) setCustomerName('');
    setCustomMessage('');
  };

  const handleCall = () => {
    if (!customerPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!customerName) {
      toast.error('Please enter the customer name');
      return;
    }
    if (purpose === 'custom' && !customMessage) {
      toast.error('Please enter a custom message');
      return;
    }
    callMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            Make Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Outbound Call
          </DialogTitle>
          <DialogDescription>
            Initiate an AI-powered call to a customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              placeholder="John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input
              id="customerPhone"
              placeholder="+1234567890"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use E.164 format (e.g., +1234567890)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Call Purpose</Label>
            <Select value={purpose} onValueChange={(v: any) => setPurpose(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder">Appointment Reminder</SelectItem>
                <SelectItem value="followup">Follow-up Call</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {purpose === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customMessage">Message</Label>
              <Textarea
                id="customMessage"
                placeholder="Enter the message the AI will speak..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {purpose === 'reminder' && appointmentDetails && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Appointment Details:</p>
              <p className="text-muted-foreground">
                {appointmentDetails.service} on{' '}
                {new Date(appointmentDetails.datetime).toLocaleString()}
                {appointmentDetails.employeeName && ` with ${appointmentDetails.employeeName}`}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCall}
              disabled={callMutation.isPending}
            >
              {callMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
