import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormShell } from '@/components/ui/form-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Loader2, Globe } from 'lucide-react';
import { format, addDays, setHours, setMinutes } from 'date-fns';

interface SchedulePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledFor: Date, timezone: string) => void;
  isScheduling?: boolean;
  platforms?: string[];
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
];

// Quick schedule options
const QUICK_OPTIONS = [
  { label: 'In 1 hour', getValue: () => new Date(Date.now() + 60 * 60 * 1000) },
  { label: 'Tomorrow 9 AM', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 9), 0) },
  { label: 'Tomorrow 12 PM', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 12), 0) },
  { label: 'Tomorrow 5 PM', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 17), 0) },
];

export function SchedulePostDialog({
  open,
  onOpenChange,
  onSchedule,
  isScheduling = false,
  platforms = [],
}: SchedulePostDialogProps) {
  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/New_York');

  const handleSchedule = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);
    onSchedule(scheduledDate, timezone);
  };

  const handleQuickOption = (getValue: () => Date) => {
    const quickDate = getValue();
    setDate(format(quickDate, 'yyyy-MM-dd'));
    setTime(format(quickDate, 'HH:mm'));
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <FormShell
      id="schedule-post"
      title={<span className="text-card-foreground flex items-center gap-2"><Calendar className="h-5 w-5 text-feature-marketing" />Schedule Post</span>}
      description={`Choose when you want this post to be published.${platforms.length > 0 ? ` Platforms: ${platforms.join(', ')}` : ''}`}
      open={open}
      onOpenChange={onOpenChange}
      className="bg-card border-card-foreground/20 max-w-md"
    >

        <div className="space-y-4 py-4">
          {/* Quick Options */}
          <div className="space-y-2">
            <Label className="text-card-foreground/70 text-sm">Quick Schedule</Label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickOption(option.getValue)}
                  className="text-xs border-card-foreground/20 text-card-foreground/70 hover:text-card-foreground hover:bg-card-foreground/10"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-card-foreground/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-card-foreground/40">or choose custom</span>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-card-foreground/70 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </Label>
            <Input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="bg-muted/30 border-card-foreground/20 text-card-foreground"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="text-card-foreground/70 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Time
            </Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-muted/30 border-card-foreground/20 text-card-foreground"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-card-foreground/70 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-muted/30 border-card-foreground/20 text-card-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-card-foreground/70"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={isScheduling}
            className="bg-feature-marketing text-white hover:bg-feature-marketing/90"
          >
            {isScheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-1.5" />
                Schedule Post
              </>
            )}
          </Button>
        </div>
    </FormShell>
  );
}
