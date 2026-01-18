import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommunicationPreferences {
  smsOptIn: boolean;
  emailOptIn: boolean;
  callOptIn: boolean;
}

interface CommunicationPreferencesCheckboxesProps {
  preferences: CommunicationPreferences;
  onChange: (preferences: CommunicationPreferences) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CommunicationPreferencesCheckboxes({
  preferences,
  onChange,
  compact = false,
  disabled = false,
  className,
}: CommunicationPreferencesCheckboxesProps) {
  const handleChange = (field: keyof CommunicationPreferences, value: boolean) => {
    onChange({
      ...preferences,
      [field]: value,
    });
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-xs font-medium text-muted-foreground">Send Reminders Via</Label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={preferences.smsOptIn}
              onCheckedChange={(checked) => handleChange('smsOptIn', !!checked)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            <span className="text-xs flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              SMS
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={preferences.emailOptIn}
              onCheckedChange={(checked) => handleChange('emailOptIn', !!checked)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            <span className="text-xs flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              Email
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={preferences.callOptIn}
              onCheckedChange={(checked) => handleChange('callOptIn', !!checked)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            <span className="text-xs flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              AI Voice Call
            </span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">Appointment Reminder Preferences</Label>
      <p className="text-xs text-muted-foreground">
        Choose how you'd like to receive appointment reminders and updates.
      </p>
      <div className="space-y-2">
        <label className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
          preferences.smsOptIn ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <Checkbox
            checked={preferences.smsOptIn}
            onCheckedChange={(checked) => handleChange('smsOptIn', !!checked)}
            disabled={disabled}
          />
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm font-medium">SMS/Text Messages</span>
            <p className="text-xs text-muted-foreground">Receive text message reminders and updates</p>
          </div>
        </label>

        <label className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
          preferences.emailOptIn ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <Checkbox
            checked={preferences.emailOptIn}
            onCheckedChange={(checked) => handleChange('emailOptIn', !!checked)}
            disabled={disabled}
          />
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm font-medium">Email</span>
            <p className="text-xs text-muted-foreground">Receive email confirmations and reminders</p>
          </div>
        </label>

        <label className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
          preferences.callOptIn ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <Checkbox
            checked={preferences.callOptIn}
            onCheckedChange={(checked) => handleChange('callOptIn', !!checked)}
            disabled={disabled}
          />
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm font-medium">AI Voice Call</span>
            <p className="text-xs text-muted-foreground">Receive automated AI voice call reminders</p>
          </div>
        </label>
      </div>
      <p className="text-[10px] text-muted-foreground">
        You can update these preferences at any time. Message and data rates may apply.
      </p>
    </div>
  );
}
