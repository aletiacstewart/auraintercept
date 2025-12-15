import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { PhoneCall, Loader2, Volume2 } from 'lucide-react';

interface TestCallDialogProps {
  trigger?: React.ReactNode;
}

export function TestCallDialog({ trigger }: TestCallDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Get the current greeting message
  const { data: company } = useQuery({
    queryKey: ['company-greeting', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name, ai_voice_greeting')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId && open,
  });

  const callMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const { data, error } = await supabase.functions.invoke('outbound-call', {
        body: {
          companyId,
          customerPhone: phoneNumber,
          customerName: 'Test User',
          purpose: 'custom',
          customMessage: company?.ai_voice_greeting || 'Hello! Thank you for calling. How can I assist you today?',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Test call initiated!', {
        description: 'You should receive a call shortly.',
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error('Call error:', error);
      toast.error('Failed to initiate test call', {
        description: error.message,
      });
    },
  });

  const handleCall = () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    callMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <PhoneCall className="w-4 h-4 mr-2" />
            Test Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" />
            Test AI Greeting
          </DialogTitle>
          <DialogDescription>
            Receive a test call to hear how the AI will greet callers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Preview of the greeting */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Volume2 className="h-4 w-4 text-primary" />
              Current Greeting
            </div>
            <p className="text-sm text-muted-foreground italic">
              "{company?.ai_voice_greeting || 'Hello! Thank you for calling. How can I assist you today?'}"
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testPhone">Your Phone Number</Label>
            <Input
              id="testPhone"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use E.164 format (e.g., +1234567890). You'll receive a call with the AI greeting.
            </p>
          </div>

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
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Call Me
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
