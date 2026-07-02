import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PhoneCall, Loader2, Volume2, Phone, PhoneOff, PhoneIncoming, CheckCircle2, XCircle } from 'lucide-react';

interface TestCallDialogProps {
  trigger?: React.ReactNode;
}

type CallStatus = 'idle' | 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';

const STATUS_CONFIG: Record<CallStatus, { label: string; icon: React.ReactNode; color: string }> = {
  idle: { label: 'Ready', icon: <Phone className="w-4 h-4" />, color: 'bg-muted text-muted-foreground' },
  initiated: { label: 'Initiating...', icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'bg-blue-500/10 text-cyan-400 border-blue-500/20' },
  ringing: { label: 'Ringing...', icon: <PhoneIncoming className="w-4 h-4 animate-pulse" />, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  'in-progress': { label: 'Connected', icon: <Phone className="w-4 h-4" />, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  failed: { label: 'Failed', icon: <XCircle className="w-4 h-4" />, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  busy: { label: 'Busy', icon: <PhoneOff className="w-4 h-4" />, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  'no-answer': { label: 'No Answer', icon: <PhoneOff className="w-4 h-4" />, color: 'bg-muted text-muted-foreground' },
};

export function TestCallDialog({ trigger }: TestCallDialogProps) {
  const { companyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');

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

  // Subscribe to real-time updates for the call
  useEffect(() => {
    if (!callSid) return;

    const channel = supabase
      .channel(`call-status-${callSid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_logs',
          filter: `call_sid=eq.${callSid}`,
        },
        (payload) => {
          console.log('Call status update:', payload);
          const newStatus = payload.new.status as CallStatus;
          setCallStatus(newStatus);

          // Show toast for important status changes
          if (newStatus === 'ringing') {
            toast.info('Your phone is ringing!');
          } else if (newStatus === 'in-progress') {
            toast.success('Call connected!');
          } else if (newStatus === 'completed') {
            toast.success('Call completed successfully!');
          } else if (newStatus === 'failed') {
            toast.error('Call failed');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSid]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to allow animation before resetting
      const timeout = setTimeout(() => {
        setCallSid(null);
        setCallStatus('idle');
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

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
      if (data?.error) {
        // Check for telephony trial-account "unverified number" error
        if (data?.details?.code === 21219) {
          throw new Error('TELEPHONY_TRIAL_UNVERIFIED');
        }
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: (data) => {
      setCallSid(data.callSid);
      setCallStatus('initiated');
      toast.success('Test call initiated!', {
        description: 'You should receive a call shortly.',
      });
    },
    onError: (error) => {
      console.error('Call error:', error);
      setCallStatus('failed');
      
      if (error.message === 'TELEPHONY_TRIAL_UNVERIFIED') {
        toast.error('SignalWire Trial Number Not Verified', {
          description: 'Your SignalWire account is in trial mode. Verify this phone number in your SignalWire console before calling it.',
          duration: 10000,
        });
      } else {
        toast.error('Failed to initiate test call', {
          description: error.message,
        });
      }
    },
  });

  const handleCall = () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    callMutation.mutate();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const isCallActive = callSid && !['idle', 'completed', 'failed', 'busy', 'no-answer'].includes(callStatus);
  const statusConfig = STATUS_CONFIG[callStatus];

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
          {/* Call Status Display */}
          {callSid && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Call Status</span>
                <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1.5`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>
              
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${callStatus === 'initiated' ? 'bg-blue-500' : callStatus !== 'idle' ? 'bg-green-500' : 'bg-muted'}`} />
                <div className={`h-0.5 flex-1 ${callStatus === 'ringing' || callStatus === 'in-progress' || callStatus === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
                <div className={`h-2 w-2 rounded-full ${callStatus === 'ringing' ? 'bg-yellow-500 animate-pulse' : callStatus === 'in-progress' || callStatus === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
                <div className={`h-0.5 flex-1 ${callStatus === 'in-progress' || callStatus === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
                <div className={`h-2 w-2 rounded-full ${callStatus === 'in-progress' ? 'bg-green-500 animate-pulse' : callStatus === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
                <div className={`h-0.5 flex-1 ${callStatus === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
                <div className={`h-2 w-2 rounded-full ${callStatus === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Initiated</span>
                <span>Ringing</span>
                <span>Connected</span>
                <span>Done</span>
              </div>
            </div>
          )}

          {/* Preview of the greeting */}
          {!callSid && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Volume2 className="h-4 w-4 text-primary" />
                Current Greeting
              </div>
              <p className="text-sm text-muted-foreground italic">
                "{company?.ai_voice_greeting || 'Hello! Thank you for calling. How can I assist you today?'}"
              </p>
            </div>
          )}

          {!callSid && (
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
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              {callSid ? 'Close' : 'Cancel'}
            </Button>
            {!callSid && (
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
            )}
            {callSid && callStatus === 'completed' && (
              <Button
                className="flex-1"
                onClick={() => {
                  setCallSid(null);
                  setCallStatus('idle');
                }}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Call Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
