import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, DollarSign, Zap, Mail, Phone, CreditCard, Search, Share2 } from 'lucide-react';

interface CostItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  purpose: string;
  estimatedCost: string;
  required: boolean;
  learnMoreUrl?: string;
}

const COST_ITEMS: CostItem[] = [
  {
    id: 'signalwire',
    icon: <Phone className="h-4 w-4 text-blue-500" />,
    name: 'SignalWire',
    purpose: 'SMS & Voice Calls (Talk to Aura + Message Aura)',
    estimatedCost: '~$2/number + $20–80/mo usage',
    required: true,
    learnMoreUrl: 'https://signalwire.com/pricing',
  },
  {
    id: 'elevenlabs',
    icon: <Zap className="h-4 w-4 text-purple-500" />,
    name: 'ElevenLabs',
    purpose: 'AI Voice Synthesis (Voice Conversations)',
    estimatedCost: '$0–99+/month based on usage',
    required: true,
    learnMoreUrl: 'https://elevenlabs.io/pricing',
  },
  {
    id: 'resend',
    icon: <Mail className="h-4 w-4 text-green-500" />,
    name: 'Resend',
    purpose: 'Transactional Email Notifications',
    estimatedCost: '$0–20+/month based on volume',
    required: true,
    learnMoreUrl: 'https://resend.com/pricing',
  },
  {
    id: 'stripe',
    icon: <CreditCard className="h-4 w-4 text-indigo-500" />,
    name: 'Stripe',
    purpose: 'Invoice Payments (Logistics+ tiers)',
    estimatedCost: '2.9% + $0.30 per transaction',
    required: false,
    learnMoreUrl: 'https://stripe.com/pricing',
  },
  {
    id: 'tavily',
    icon: <Search className="h-4 w-4 text-amber-500" />,
    name: 'Tavily AI Research',
    purpose: 'AI Web Research for Enhanced Content',
    estimatedCost: 'Free (1,000 searches/mo) or paid plans',
    required: false,
    learnMoreUrl: 'https://tavily.com/#pricing',
  },
  {
    id: 'social',
    icon: <Share2 className="h-4 w-4 text-pink-500" />,
    name: 'Social Media APIs',
    purpose: 'Automatic Social Posting (Growth+ tiers)',
    estimatedCost: 'Free with your own API credentials',
    required: false,
  },
];

interface Props {
  open: boolean;
  tierName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ThirdPartyCostDisclosureDialog({ open, tierName, onConfirm, onCancel }: Props) {
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const requiredItems = COST_ITEMS.filter(i => i.required);
  const allRequiredAcknowledged = requiredItems.every(i => acknowledged[i.id]);

  const totalMin = 22;  // ~$2 + $0 + $0
  const totalMax = 201; // ~$80 + $99 + $20 + $2

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            3rd-Party Service Costs — {tierName}
          </DialogTitle>
          <DialogDescription>
            Aura Intercept requires external services to power SMS, voice, and email. These are billed
            directly by each provider and are <strong>separate from your Aura subscription</strong>.
            Please review and acknowledge each before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {COST_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-3 transition-colors ${
                acknowledged[item.id]
                  ? 'border-primary/40 bg-primary/5'
                  : item.required
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`ack-${item.id}`}
                  checked={!!acknowledged[item.id]}
                  onCheckedChange={(v) =>
                    setAcknowledged((prev) => ({ ...prev, [item.id]: v === true }))
                  }
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`ack-${item.id}`}
                    className="flex items-center gap-2 cursor-pointer font-semibold text-sm"
                  >
                    {item.icon}
                    {item.name}
                    {item.required ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
                    )}
                    {item.learnMoreUrl && (
                      <a
                        href={item.learnMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-muted-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.purpose}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-medium text-foreground">{item.estimatedCost}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <strong>Estimated combined 3rd-party cost:</strong> ~${totalMin}–${totalMax}/month depending on usage.
          This is in addition to your Aura subscription fee. Factor these into your total monthly ROI calculation.
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!allRequiredAcknowledged && (
            <p className="text-xs text-muted-foreground text-center">
              Please acknowledge all <strong>Required</strong> items to continue.
            </p>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!allRequiredAcknowledged}
              className="flex-1"
            >
              I Understand — Proceed to Checkout
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
