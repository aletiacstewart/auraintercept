import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatToolUi } from '@/hooks/useMultiAgentChat';

type SlotPickerUi = Extract<ChatToolUi, { kind: 'slot_picker' }>;

interface InlineSlotPickerProps {
  ui: SlotPickerUi;
  onConfirm: (slot: { datetime: string; label: string; service_type: string }) => void;
  disabled?: boolean;
}

function formatDateLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function InlineSlotPicker({ ui, onConfirm, disabled }: InlineSlotPickerProps) {
  const firstDate = ui.dates[0]?.date ?? '';
  const [selectedDate, setSelectedDate] = useState<string>(firstDate);

  const selectedDay = useMemo(
    () => ui.dates.find((d) => d.date === selectedDate) ?? ui.dates[0],
    [ui.dates, selectedDate],
  );

  if (!ui.dates.length) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        No open slots in the next {ui.days_scanned ?? 7} day(s). Try a different date or open the full booking form.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur p-4 space-y-3" data-no-translate>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4 text-primary" />
        <span>Pick a time</span>
        <Badge variant="outline" className="ml-auto text-xs">{ui.service_type}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {ui.dates.map((d) => (
          <Button
            key={d.date}
            type="button"
            size="sm"
            variant={d.date === selectedDate ? 'default' : 'outline'}
            onClick={() => setSelectedDate(d.date)}
            disabled={disabled}
            className="h-8"
          >
            {formatDateLabel(d.date)}
            <span className="ml-2 text-xs opacity-70">{d.slots.length}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {selectedDay?.slots.map((s) => {
          const label = `${formatDateLabel(selectedDay.date)} at ${formatTimeLabel(s.datetime)}`;
          return (
            <Button
              key={s.datetime + (s.employee_id ?? '')}
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => onConfirm({ datetime: s.datetime, label, service_type: ui.service_type })}
              className={cn('h-8 gap-1', 'hover:bg-primary hover:text-primary-foreground')}
            >
              <Clock className="h-3 w-3" />
              {formatTimeLabel(s.datetime)}
              {s.employee_name && (
                <span className="ml-1 text-[10px] opacity-70">· {s.employee_name}</span>
              )}
            </Button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">Tap a time to confirm — we'll book it for you.</p>
    </div>
  );
}