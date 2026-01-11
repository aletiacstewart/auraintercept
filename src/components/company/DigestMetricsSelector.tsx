import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarDays, Bell, TrendingDown } from 'lucide-react';

interface DigestMetricsSelectorProps {
  includeAppointments: boolean;
  includeReminders: boolean;
  includeSubscriptions: boolean;
  onChangeAppointments: (checked: boolean) => void;
  onChangeReminders: (checked: boolean) => void;
  onChangeSubscriptions: (checked: boolean) => void;
  disabled?: boolean;
}

export function DigestMetricsSelector({
  includeAppointments,
  includeReminders,
  includeSubscriptions,
  onChangeAppointments,
  onChangeReminders,
  onChangeSubscriptions,
  disabled = false,
}: DigestMetricsSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-card-foreground">Include in Report</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-card-foreground/20 bg-card">
          <Checkbox
            id="include-appointments"
            checked={includeAppointments}
            onCheckedChange={(checked) => onChangeAppointments(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-card-foreground/60" />
            <Label htmlFor="include-appointments" className="text-sm font-normal cursor-pointer text-card-foreground">
              Appointments
            </Label>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-card-foreground/20 bg-card">
          <Checkbox
            id="include-reminders"
            checked={includeReminders}
            onCheckedChange={(checked) => onChangeReminders(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-card-foreground/60" />
            <Label htmlFor="include-reminders" className="text-sm font-normal cursor-pointer text-card-foreground">
              Reminders
            </Label>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-card-foreground/20 bg-card">
          <Checkbox
            id="include-subscriptions"
            checked={includeSubscriptions}
            onCheckedChange={(checked) => onChangeSubscriptions(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-card-foreground/60" />
            <Label htmlFor="include-subscriptions" className="text-sm font-normal cursor-pointer text-card-foreground">
              Subscriptions
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
