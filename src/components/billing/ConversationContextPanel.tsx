import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, MessageSquare, Sparkles } from 'lucide-react';
import type { CustomerInteractionEvent } from '@/hooks/useCustomerInteractionHistory';

interface Props {
  history: CustomerInteractionEvent[] | undefined;
  isLoading?: boolean;
  defaultOpen?: boolean;
}

const ICONS: Record<string, any> = {
  call: Phone,
  sms: MessageSquare,
  ai_context: Sparkles,
  agent_action: Sparkles,
};

export function ConversationContextPanel({ history, isLoading, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Loading conversation context…
      </div>
    );
  }
  if (!history?.length) return null;

  return (
    <div className="rounded-md border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-foreground"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Conversation context ({history.length})
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {history.slice(0, 12).map((ev, i) => {
            const Icon = ICONS[ev.kind] || Sparkles;
            return (
              <li key={i} className="flex gap-2">
                <Icon className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="truncate text-foreground">
                    <span className="font-medium">{ev.agent || ev.kind}</span>
                    <span className="ml-1 text-muted-foreground">
                      · {new Date(ev.occurred_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="truncate">{ev.summary || ''}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}