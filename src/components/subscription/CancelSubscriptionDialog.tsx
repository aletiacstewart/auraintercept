import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'missing_feature', label: 'Missing a feature I need' },
  { value: 'switching', label: 'Switching to another tool' },
  { value: 'no_time', label: 'Not enough time to set up' },
  { value: 'other', label: 'Other' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  /** Called after the reason is saved. Should redirect to Stripe portal. */
  onProceed: () => Promise<void> | void;
}

export function CancelSubscriptionDialog({ open, onOpenChange, companyId, onProceed }: Props) {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please choose a reason so we can improve.');
      return;
    }
    setSubmitting(true);
    try {
      if (companyId) {
        const { error } = await supabase
          .from('companies')
          .update({
            cancellation_reason: reason,
            cancellation_feedback: feedback.trim() || null,
          })
          .eq('id', companyId);
        if (error) throw error;
      }
      await onProceed();
      onOpenChange(false);
    } catch (err) {
      console.error('Cancellation feedback save failed:', err);
      toast.error('Could not save feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Before you go</DialogTitle>
          <DialogDescription>
            One quick question so we can keep improving. This won't stop your cancellation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Why are you canceling?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
              {REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={`cancel-${r.value}`} />
                  <Label htmlFor={`cancel-${r.value}`} className="text-sm font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel-feedback" className="text-sm font-medium">
              Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="cancel-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="A missing feature, a bug, pricing feedback…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Nevermind
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}