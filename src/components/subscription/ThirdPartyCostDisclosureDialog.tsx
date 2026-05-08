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
import { AlertTriangle, ExternalLink, DollarSign, Zap, Mail, Phone, CreditCard, Search, Share2, Shield } from 'lucide-react';

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
    id: 'a2p10dlc',
    icon: <Shield className="h-4 w-4 text-amber-500" />,
    name: 'A2P 10DLC Registration',
    purpose: 'SMS Compliance — required by carriers to send business SMS',
    estimatedCost: 'Customer pass-through · $4.50 brand fee + variable campaign fees (3 mo upfront) · $250/mo T-Mobile inactive-campaign fee',
    required: true,
    learnMoreUrl: 'https://signalwire.com/resources/guides/a2p-10dlc-overview',
  },
  {
    id: 'signalwire',
    icon: <Phone className="h-4 w-4 text-cyan-400" />,
    name: 'SignalWire',
    purpose: 'SMS & Voice Calls (Talk to Aura + Message Aura)',
    estimatedCost: 'Bundled · base: 1 number + included voice/SMS minutes per tier',
    required: true,
    learnMoreUrl: 'https://signalwire.com/pricing',
  },
  {
    id: 'elevenlabs',
    icon: <Zap className="h-4 w-4 text-purple-500" />,
    name: 'ElevenLabs',
    purpose: 'AI Voice Synthesis (Voice Conversations)',
    estimatedCost: 'Bundled · base: ~10k chars/mo (≈10 min TTS) per tier',
    required: true,
    learnMoreUrl: 'https://elevenlabs.io/pricing',
  },
  {
    id: 'resend',
    icon: <Mail className="h-4 w-4 text-green-500" />,
    name: 'Resend',
    purpose: 'Transactional Email Notifications',
    estimatedCost: 'Bundled · 3,000 emails/mo per tier · overage $0.90 per 1,000',
    required: true,
    learnMoreUrl: 'https://resend.com/pricing',
  },
  {
    id: 'stripe',
    icon: <CreditCard className="h-4 w-4 text-cyan-400" />,
    name: 'Stripe',
    purpose: 'Invoice Payments (Elite tier)',
    estimatedCost: '2.9% + $0.30 per transaction',
    required: false,
    learnMoreUrl: 'https://stripe.com/pricing',
  },
  {
    id: 'tavily',
    icon: <Search className="h-4 w-4 text-amber-500" />,
    name: 'Tavily AI Research',
    purpose: 'AI Web Research for Enhanced Content',
    estimatedCost: 'Bundled · 1,000 credits/mo per tier · overage $0.008 per credit',
    required: false,
    learnMoreUrl: 'https://tavily.com/#pricing',
  },
  {
    id: 'social',
    icon: <Share2 className="h-4 w-4 text-pink-500" />,
    name: 'Social Media APIs',
    purpose: 'Social Posting (Pro+ tiers)',
    estimatedCost: 'Free with your own API credentials',
    required: false,
  },
];

interface Props {
  open: boolean;
  tierName: string;
  tierId?: string;
  onConfirm: (wantsConcierge: boolean) => void;
  onCancel: () => void;
}

export function ThirdPartyCostDisclosureDialog({ open, tierName, tierId, onConfirm, onCancel }: Props) {
  const isProOrElite = tierId === 'performance' || tierId === 'command' || /pro|elite/i.test(tierName);
  const conciergeFee = isProOrElite ? 697 : 397; // legacy
  // Use new pricing
  const conciergePriceLabel = isProOrElite ? '$697' : '$397';
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [wantsConcierge, setWantsConcierge] = useState(false);

  const requiredItems = COST_ITEMS.filter(i => i.required);
  const allRequiredAcknowledged = requiredItems.every(i => acknowledged[i.id]);


  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Included Services & Plan Limits — {tierName}
          </DialogTitle>
          <DialogDescription>
            SMS, voice, email, and AI research are <strong>bundled in your {tierName} plan</strong> at
            the base limits listed below — no separate vendor bills. If usage exceeds these base limits,
            the overage is invoiced at the end of the month in addition to your plan fee. 3rd-party
            vendor pricing may change at any time and could affect overage rates.
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

        {/* Concierge Onboarding Add-On */}
        <div className={`rounded-lg border-2 p-3 transition-all cursor-pointer ${
          wantsConcierge
            ? 'border-primary bg-primary/10'
            : 'border-border/50 bg-muted/20 hover:border-primary/40'
        }`}
          onClick={() => setWantsConcierge(v => !v)}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="ack-concierge"
              checked={wantsConcierge}
              onCheckedChange={(v) => setWantsConcierge(v === true)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label htmlFor="ack-concierge" className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
                <Zap className="h-4 w-4 text-primary" />
                Concierge Onboarding — Optional Add-On
                <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">{conciergePriceLabel} flat fee</Badge>
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                We configure all 3rd-party integrations (SignalWire, ElevenLabs, Resend, A2P 10DLC) for you. Includes onboarding call + AI knowledge base setup.
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                ✦ You can also purchase Concierge Onboarding later from your dashboard if you decide you need it.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1.5">
          <p>
            <strong>Plan limits apply.</strong> Each item above lists the base allowance bundled in your plan.
            Usage above those limits is metered and billed at the end of the month in addition to your plan fee.
          </p>
          <p className="italic text-[10px] opacity-80">
            3rd-party vendor pricing is set by each provider (SignalWire, ElevenLabs, Resend, Tavily) and may change at any time, which could affect overage rates.
          </p>
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
              onClick={() => onConfirm(wantsConcierge)}
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
