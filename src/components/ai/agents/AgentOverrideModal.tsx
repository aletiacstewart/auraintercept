import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DecisionModeBadge, DecisionMode } from './DecisionModeBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { AlertTriangle, CheckCircle, XCircle, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AgentOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  agentName: string;
  currentDecision: string;
  decisionMode: DecisionMode;
  confidenceScore: number | null;
  onOverrideComplete?: () => void;
}

type OverrideAction = 'approve' | 'reject' | 'hold';

const overrideOptions: Array<{
  value: OverrideAction;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'approve',
    label: 'Approve as suggested',
    description: 'Confirm the AI decision and execute it',
    icon: CheckCircle
  },
  {
    value: 'reject',
    label: 'Reject and reassign',
    description: 'Cancel this action and handle manually',
    icon: XCircle
  },
  {
    value: 'hold',
    label: 'Put on hold',
    description: 'Defer decision for later review',
    icon: Clock
  }
];

export const AgentOverrideModal: React.FC<AgentOverrideModalProps> = ({
  open,
  onOpenChange,
  eventId,
  agentName,
  currentDecision,
  decisionMode,
  confidenceScore,
  onOverrideComplete
}) => {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<OverrideAction>('approve');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to override decisions');
      return;
    }

    setIsSubmitting(true);
    try {
      const newStatus = selectedAction === 'approve' ? 'processed' 
                       : selectedAction === 'reject' ? 'failed' 
                       : 'pending';

      const { error } = await supabase
        .from('ai_agent_events')
        .update({
          status: newStatus,
          requires_human_review: false,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          override_reason: reason || `Action: ${selectedAction}`,
          decision_mode: selectedAction === 'hold' ? 'review' : 'auto'
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success(
        selectedAction === 'approve' 
          ? 'Decision approved and executed'
          : selectedAction === 'reject'
          ? 'Decision rejected'
          : 'Decision put on hold'
      );
      
      onOverrideComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to override:', error);
      toast.error('Failed to override decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Override AI Decision
          </DialogTitle>
          <DialogDescription>
            Review and override the decision made by {agentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Agent</span>
              <span className="font-medium">{agentName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mode</span>
              <DecisionModeBadge mode={decisionMode} size="sm" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <ConfidenceIndicator score={confidenceScore} showValue size="sm" />
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Current Decision</p>
            <p className="text-sm font-medium">{currentDecision}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Override Action</Label>
            <RadioGroup
              value={selectedAction}
              onValueChange={(value) => setSelectedAction(value as OverrideAction)}
              className="space-y-2"
            >
              {overrideOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason (optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Add context for this override..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentOverrideModal;
