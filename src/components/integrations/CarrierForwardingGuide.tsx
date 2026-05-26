import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy as CopyIcon, ChevronDown, PhoneForwarded } from 'lucide-react';
import { CARRIERS, FORWARDING_RULES, fillTokens } from '@/lib/carrierForwarding';

interface Props {
  /** Aura number to forward TO (pre-fills the codes). */
  auraNumber?: string;
  /** Default carrier name to select. */
  defaultCarrier?: string;
  /** Wrap in a Card with header. Defaults to true. */
  withCard?: boolean;
}

/**
 * Shared carrier call-forwarding reference. Used in the public onboarding
 * intake AND in the 3rd-party integrations area of company / admin dashboards.
 */
export function CarrierForwardingGuide({
  auraNumber: initialAura = '',
  defaultCarrier = '',
  withCard = true,
}: Props) {
  const [carrier, setCarrier] = useState(defaultCarrier);
  const [auraNumber, setAuraNumber] = useState(initialAura);
  const [showAll, setShowAll] = useState(false);

  const selected = CARRIERS.find((c) => c.name === carrier);

  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', { description: text });
  };

  const body = (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pick the carrier of the business line you want forwarded. The codes below tell that phone to forward calls
        (immediate, after-hours / no-answer, busy, or unreachable) to your Aura number.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Your mobile carrier</Label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">— Select carrier —</option>
            {CARRIERS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} · {c.type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Aura number to forward TO</Label>
          <Input
            value={auraNumber}
            onChange={(e) => setAuraNumber(e.target.value)}
            placeholder="+15551234567"
          />
        </div>
      </div>

      {selected ? (
        <CarrierCard carrier={selected} num={auraNumber} onCopy={onCopy} />
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Select your carrier above to see the exact codes for that network.
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition ${showAll ? 'rotate-180' : ''}`} />
        {showAll ? 'Hide' : 'Show'} reference for all carriers
      </button>

      {showAll && (
        <div className="space-y-3 pt-2 border-t border-border">
          {CARRIERS.filter((c) => c.name !== selected?.name).map((c) => (
            <CarrierCard key={c.name} carrier={c} num={auraNumber} onCopy={onCopy} compact />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Tip: most phones answer star codes with a short confirmation tone. If nothing happens, your carrier may require
        the conditional-forwarding add-on to be enabled (free) — call the carrier and request "Call Forwarding No
        Answer activation".
      </p>
    </div>
  );

  if (!withCard) return body;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PhoneForwarded className="w-4 h-4 text-primary" />
          Carrier Call-Forwarding Cheat Sheet
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function CarrierCard({
  carrier,
  num,
  onCopy,
  compact = false,
}: {
  carrier: typeof CARRIERS[number];
  num: string;
  onCopy: (text: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background">
      <div className="px-3 py-2 border-b border-border">
        <div className="text-sm font-semibold text-foreground">{carrier.name}</div>
        <div className="text-[10px] text-muted-foreground">{carrier.type}</div>
      </div>
      <div className="divide-y divide-border">
        {FORWARDING_RULES.map((rule) => {
          const onText = fillTokens(carrier[rule.on] as string, num);
          const offText = rule.short === 'Cancel All' ? '' : fillTokens(carrier[rule.off] as string, num);
          return (
            <div key={rule.short} className="px-3 py-2 grid grid-cols-1 sm:grid-cols-[120px,1fr] gap-2 text-xs">
              <div>
                <div className="font-semibold text-foreground">{rule.short}</div>
                {!compact && <div className="text-[10px] text-muted-foreground mt-0.5">{rule.when}</div>}
              </div>
              <div className="space-y-1">
                <CodeRow label="Turn ON" value={onText} onCopy={onCopy} />
                {offText && offText !== onText && (
                  <CodeRow label="Turn OFF" value={offText} onCopy={onCopy} />
                )}
              </div>
            </div>
          );
        })}
        <div className="px-3 py-2 text-xs">
          <div className="font-semibold text-foreground mb-1">Verify current forwarding</div>
          <CodeRow label="Check" value={fillTokens(carrier.verify, num)} onCopy={onCopy} />
        </div>
        <div className="px-3 py-2 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Notes: </span>
          {carrier.notes}
        </div>
      </div>
    </div>
  );
}

function CodeRow({ label, value, onCopy }: { label: string; value: string; onCopy: (text: string) => void }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-muted-foreground w-14 shrink-0 mt-1">{label}</span>
      <code className="flex-1 text-[11px] bg-muted/60 rounded px-2 py-1 font-mono text-foreground break-all">
        {value}
      </code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="text-muted-foreground hover:text-foreground mt-1"
        title="Copy"
      >
        <CopyIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}