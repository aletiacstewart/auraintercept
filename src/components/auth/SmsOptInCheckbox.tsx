import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';

interface SmsOptInCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  phone?: string;
  id?: string;
  recipientLabel?: string; // e.g. "your business" or "you"
  compact?: boolean;
}

/**
 * TCPA / A2P 10DLC compliant opt-in checkbox for SMS sent BY Aura Intercept
 * (the platform itself) — product updates, billing alerts, onboarding tips.
 * Default state must be UNCHECKED. Capture timestamp + IP server-side.
 */
export function SmsOptInCheckbox({
  checked,
  onCheckedChange,
  phone,
  id = 'aura-sms-opt-in',
  recipientLabel = 'me',
  compact = false,
}: SmsOptInCheckboxProps) {
  const phoneText = phone ? ` at ${phone}` : '';
  const disabled = !phone || phone.trim().length < 7;

  return (
    <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <Label
        htmlFor={id}
        className={`${compact ? 'text-[11px]' : 'text-xs'} font-normal text-muted-foreground leading-relaxed cursor-pointer flex-1`}
      >
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <MessageSquare className="w-3 h-3 text-primary" />
          SMS from Aura Intercept (optional)
        </span>
        <span className="block mt-1">
          Yes, send {recipientLabel} SMS messages from <span className="font-medium text-foreground">Aura Intercept</span>
          {phoneText} — product updates, billing alerts, and onboarding tips. Msg &amp; data rates may apply.
          Msg frequency varies. Reply <span className="font-medium">STOP</span> to opt out, <span className="font-medium">HELP</span> for help.
          Consent is not required to purchase.
        </span>
        {disabled && (
          <span className="block mt-1 text-[10px] text-muted-foreground/70 italic">
            Enter a phone number above to enable this option.
          </span>
        )}
      </Label>
    </div>
  );
}