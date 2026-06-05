import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import type { ChatToolUi } from '@/hooks/useMultiAgentChat';

type FormUi = Extract<ChatToolUi, { kind: 'booking_form_link' }>;

interface InlineBookingFormCardProps {
  ui: FormUi;
  onOpen: () => void;
  disabled?: boolean;
}

export function InlineBookingFormCard({ ui, onOpen, disabled }: InlineBookingFormCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card/80 backdrop-blur p-4 space-y-3"
      data-no-translate
    >
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <p className="text-sm text-foreground">{ui.reason}</p>
      </div>
      <Button type="button" onClick={onOpen} disabled={disabled} className="w-full gap-2">
        Open booking form
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}