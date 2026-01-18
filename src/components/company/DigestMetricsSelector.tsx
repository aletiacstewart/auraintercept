import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarDays, Bell, Mail, MessageSquare } from 'lucide-react';

interface DigestMetricsSelectorProps {
  includeAppointments: boolean;
  includeReminders: boolean;
  includeEmails: boolean;
  includeSms: boolean;
  onChangeAppointments: (checked: boolean) => void;
  onChangeReminders: (checked: boolean) => void;
  onChangeEmails: (checked: boolean) => void;
  onChangeSms: (checked: boolean) => void;
  disabled?: boolean;
}

export function DigestMetricsSelector({
  includeAppointments,
  includeReminders,
  includeEmails,
  includeSms,
  onChangeAppointments,
  onChangeReminders,
  onChangeEmails,
  onChangeSms,
  disabled = false,
}: DigestMetricsSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-card-foreground">Include in Report</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-card-foreground/20 bg-card">
          <Checkbox
            id="include-appointments"
            checked={includeAppointments}
            onCheckedChange={(checked) => onChangeAppointments(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-card-foreground/60" />
            <div>
              <Label htmlFor="include-appointments" className="text-sm font-normal cursor-pointer text-card-foreground">
                Appointments
              </Label>
              <p className="text-xs text-muted-foreground">Scheduled, canceled, completed</p>
            </div>
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
            <div>
              <Label htmlFor="include-reminders" className="text-sm font-normal cursor-pointer text-card-foreground">
                Reminders
              </Label>
              <p className="text-xs text-muted-foreground">Sent via SMS & email</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-card-foreground/20 bg-card">
          <Checkbox
            id="include-emails"
            checked={includeEmails}
            onCheckedChange={(checked) => onChangeEmails(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-card-foreground/60" />
            <div>
              <Label htmlFor="include-emails" className="text-sm font-normal cursor-pointer text-card-foreground">
                Emails
              </Label>
              <p className="text-xs text-muted-foreground">Sent, bounced, subscribed, unsubscribed</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-card-foreground/20 bg-card">
          <Checkbox
            id="include-sms"
            checked={includeSms}
            onCheckedChange={(checked) => onChangeSms(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-card-foreground/60" />
            <div>
              <Label htmlFor="include-sms" className="text-sm font-normal cursor-pointer text-card-foreground">
                SMS
              </Label>
              <p className="text-xs text-muted-foreground">Sent, bounced, subscribed, unsubscribed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
