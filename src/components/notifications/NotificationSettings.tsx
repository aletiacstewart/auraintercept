import { Bell, Mail, MessageSquare, Phone, Calendar, Briefcase, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

export function NotificationSettings() {
  const { preferences, isLoading, isSaving, updatePreferences } = useNotificationPreferences();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load notification preferences
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive alerts for important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-base">Browser Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get instant alerts in your browser
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSupported ? (
                <Switch
                  checked={preferences.browser_push_enabled === true && isSubscribed}
                  disabled={pushLoading || isSaving}
                  onCheckedChange={async (checked) => {
                    if (checked && !isSubscribed) {
                      await subscribe();
                    } else if (!checked && isSubscribed) {
                      await unsubscribe();
                    }
                    updatePreferences({ browser_push_enabled: checked });
                  }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">Not supported</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Email Alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <Label className="text-base">Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.email_alerts_enabled === true}
              disabled={isSaving}
              onCheckedChange={(checked) => updatePreferences({ email_alerts_enabled: checked })}
            />
          </div>

          <Separator />

          {/* SMS Alerts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label className="text-base">SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get text messages for urgent notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.sms_alerts_enabled === true}
                disabled={isSaving}
                onCheckedChange={(checked) => updatePreferences({ sms_alerts_enabled: checked })}
              />
            </div>
            
            {preferences.sms_alerts_enabled && (
              <div className="ml-13 pl-13">
                <Label htmlFor="sms-phone" className="text-sm">Phone Number for SMS</Label>
                <Input
                  id="sms-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={preferences.sms_phone_number || ''}
                  onChange={(e) => updatePreferences({ sms_phone_number: e.target.value })}
                  className="mt-1 max-w-xs"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Event Types
          </CardTitle>
          <CardDescription>
            Select which events should trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventToggle
            icon={Calendar}
            iconColor="text-feature-appointments"
            label="New Bookings"
            description="When a customer books an appointment"
            checked={preferences.notify_new_bookings === true}
            disabled={isSaving}
            onCheckedChange={(checked) => updatePreferences({ notify_new_bookings: checked })}
          />

          <Separator />

          <EventToggle
            icon={Phone}
            iconColor="text-destructive"
            label="Missed Calls"
            description="When a call goes unanswered"
            checked={preferences.notify_missed_calls === true}
            disabled={isSaving}
            onCheckedChange={(checked) => updatePreferences({ notify_missed_calls: checked })}
          />

          <Separator />

          <EventToggle
            icon={MessageSquare}
            iconColor="text-feature-integrations"
            label="New SMS Messages"
            description="When a customer sends an SMS"
            checked={preferences.notify_new_sms === true}
            disabled={isSaving}
            onCheckedChange={(checked) => updatePreferences({ notify_new_sms: checked })}
          />

          <Separator />

          <EventToggle
            icon={Mail}
            iconColor="text-feature-marketing"
            label="New Emails"
            description="When a customer sends an email"
            checked={preferences.notify_new_email === true}
            disabled={isSaving}
            onCheckedChange={(checked) => updatePreferences({ notify_new_email: checked })}
          />

          <Separator />

          <EventToggle
            icon={Briefcase}
            iconColor="text-feature-fieldops"
            label="Job Updates"
            description="When a job status changes"
            checked={preferences.notify_job_updates === true}
            disabled={isSaving}
            onCheckedChange={(checked) => updatePreferences({ notify_job_updates: checked })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface EventToggleProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function EventToggle({ 
  icon: Icon, 
  iconColor, 
  label, 
  description, 
  checked, 
  disabled, 
  onCheckedChange 
}: EventToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", iconColor)} />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
