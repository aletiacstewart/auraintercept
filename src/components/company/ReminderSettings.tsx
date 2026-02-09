import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Clock, MessageSquare, Phone, Plus, Trash2, AlertTriangle, PhoneCall, Loader2, Lock, Sparkles, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';

interface ReminderSetting {
  id: string;
  company_id: string;
  reminder_type: string;
  is_enabled: boolean;
  hours_before: number;
  sms_template: string;
  call_enabled: boolean;
  call_template: string | null;
  email_enabled: boolean;
  email_template: string | null;
}

const DEFAULT_TEMPLATE = 'Hi {customer_name}, this is a reminder for your {service_type} appointment at {company_name} on {date} at {time}.';
const DEFAULT_CALL_TEMPLATE = 'Hello {customer_name}, this is a friendly reminder from {company_name} about your upcoming {service_type} appointment on {date} at {time}. We look forward to seeing you. Press 1 to confirm your appointment or press 2 if you need to reschedule.';
const DEFAULT_EMAIL_TEMPLATE = `Dear {customer_name},

This is a friendly reminder about your upcoming {service_type} appointment at {company_name}.

Date: {date}
Time: {time}

If you need to reschedule or cancel, please contact us as soon as possible.

We look forward to seeing you!

Best regards,
{company_name}`;

const PRESET_REMINDERS = [
  { type: '48h', hours: 48, label: '48 hours before' },
  { type: '24h', hours: 24, label: '24 hours before' },
  { type: '2h', hours: 2, label: '2 hours before' },
  { type: '1h', hours: 1, label: '1 hour before' },
];

export function ReminderSettings() {
  const { companyId } = useAuth();
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHours, setNewHours] = useState('');
  const hasSmsReminders = hasFeature('sms_reminders');
  const hasVoiceReminders = hasFeature('voice_reminders');
  const hasEmailReminders = hasFeature('email_reminders');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['reminder-settings', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('company_id', companyId)
        .order('hours_before', { ascending: false });
      if (error) throw error;
      return data as ReminderSetting[];
    },
    enabled: !!companyId,
  });

  // Check if ElevenLabs is configured
  const { data: integrations } = useQuery({
    queryKey: ['tenant-integrations', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_voice_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const hasVoiceSupport = !!(integrations?.elevenlabs_api_key && integrations?.signalwire_project_id && integrations?.signalwire_api_token && integrations?.signalwire_phone_number);

  const upsertMutation = useMutation({
    mutationFn: async (setting: Partial<ReminderSetting> & { company_id: string; reminder_type: string; hours_before: number }) => {
      const { error } = await supabase
        .from('reminder_settings')
        .upsert(setting, { onConflict: 'company_id,reminder_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
      toast.success('Reminder settings updated');
      triggerSetupProgressRefresh();
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminder_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
      toast.success('Reminder deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete reminder: ' + error.message);
    },
  });

  const handleToggleEnabled = (setting: ReminderSetting) => {
    if (!hasSmsReminders && !setting.is_enabled) {
      toast.error('SMS reminders require Enterprise subscription', {
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/dashboard/subscription'),
        },
      });
      return;
    }
    upsertMutation.mutate({
      ...setting,
      is_enabled: !setting.is_enabled,
    });
  };

  const handleToggleCall = (setting: ReminderSetting) => {
    if (!hasVoiceReminders) {
      toast.error('Voice reminders require Enterprise subscription', {
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/dashboard/subscription'),
        },
      });
      return;
    }
    if (!setting.call_enabled && !hasVoiceSupport) {
      toast.error('Please configure ElevenLabs and Twilio integrations first');
      return;
    }
    upsertMutation.mutate({
      ...setting,
      call_enabled: !setting.call_enabled,
      call_template: !setting.call_enabled && !setting.call_template ? DEFAULT_CALL_TEMPLATE : setting.call_template,
    });
  };

  const handleToggleEmail = (setting: ReminderSetting) => {
    if (!hasEmailReminders) {
      toast.error('Email reminders require a subscription upgrade', {
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/dashboard/subscription'),
        },
      });
      return;
    }
    upsertMutation.mutate({
      ...setting,
      email_enabled: !setting.email_enabled,
      email_template: !setting.email_enabled && !setting.email_template ? DEFAULT_EMAIL_TEMPLATE : setting.email_template,
    });
  };

  const handleUpdateTemplate = (setting: ReminderSetting, template: string) => {
    upsertMutation.mutate({
      ...setting,
      sms_template: template,
    });
  };

  const handleUpdateCallTemplate = (setting: ReminderSetting, template: string) => {
    upsertMutation.mutate({
      ...setting,
      call_template: template,
    });
  };

  const handleUpdateEmailTemplate = (setting: ReminderSetting, template: string) => {
    upsertMutation.mutate({
      ...setting,
      email_template: template,
    });
  };

  const handleAddPreset = (preset: typeof PRESET_REMINDERS[0]) => {
    if (!companyId) return;
    upsertMutation.mutate({
      company_id: companyId,
      reminder_type: preset.type,
      hours_before: preset.hours,
      is_enabled: true,
      sms_template: DEFAULT_TEMPLATE,
      call_enabled: false,
      email_enabled: false,
    });
  };

  const handleAddCustom = () => {
    if (!companyId || !newHours) return;
    const hours = parseInt(newHours);
    if (isNaN(hours) || hours < 1) {
      toast.error('Please enter a valid number of hours');
      return;
    }
    upsertMutation.mutate({
      company_id: companyId,
      reminder_type: `${hours}h`,
      hours_before: hours,
      is_enabled: true,
      sms_template: DEFAULT_TEMPLATE,
      call_enabled: false,
      email_enabled: false,
    });
    setNewHours('');
    setIsAddDialogOpen(false);
  };

  const existingTypes = new Set(settings?.map(s => s.reminder_type) || []);
  const availablePresets = PRESET_REMINDERS.filter(p => !existingTypes.has(p.type));

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Reminder Settings
            </CardTitle>
            <CardDescription>
              Configure automated appointment reminders
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {availablePresets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Quick Add</Label>
                    <div className="flex flex-wrap gap-2">
                      {availablePresets.map(preset => (
                        <Button
                          key={preset.type}
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            handleAddPreset(preset);
                            setIsAddDialogOpen(false);
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Custom Timing</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Hours before"
                      value={newHours}
                      onChange={(e) => setNewHours(e.target.value)}
                    />
                    <Button onClick={handleAddCustom}>Add</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSmsReminders && (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <Lock className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm flex items-center justify-between">
              <span>SMS & Voice reminders require Enterprise subscription.</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/subscription')} className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {hasVoiceReminders && !hasVoiceSupport && (
          <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              Voice call reminders require{' '}
              <Link to="/integrations" className="text-secondary underline hover:no-underline">
                Twilio and ElevenLabs integrations
              </Link>{' '}
              to be configured.
            </AlertDescription>
          </Alert>
        )}
        {settings?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reminder settings configured</p>
            <p className="text-sm">Add reminders to notify customers before appointments</p>
          </div>
        ) : (
          settings?.map((setting) => (
            <ReminderCard
              key={setting.id}
              setting={setting}
              hasVoiceSupport={hasVoiceSupport}
              hasSmsReminders={hasSmsReminders}
              hasVoiceReminders={hasVoiceReminders}
              hasEmailReminders={hasEmailReminders}
              companyId={companyId}
              onToggleEnabled={() => handleToggleEnabled(setting)}
              onToggleCall={() => handleToggleCall(setting)}
              onToggleEmail={() => handleToggleEmail(setting)}
              onUpdateTemplate={(template) => handleUpdateTemplate(setting, template)}
              onUpdateCallTemplate={(template) => handleUpdateCallTemplate(setting, template)}
              onUpdateEmailTemplate={(template) => handleUpdateEmailTemplate(setting, template)}
              onDelete={() => deleteMutation.mutate(setting.id)}
            />
          ))
        )}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-medium mb-2 text-card-foreground">Template Variables</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-card-foreground">
            <code className="text-primary">{'{customer_name}'}</code>
            <span>Customer's name</span>
            <code className="text-primary">{'{service_type}'}</code>
            <span>Service booked</span>
            <code className="text-primary">{'{company_name}'}</code>
            <span>Your company name</span>
            <code className="text-primary">{'{date}'}</code>
            <span>Appointment date</span>
            <code className="text-primary">{'{time}'}</code>
            <span>Appointment time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReminderCardProps {
  setting: ReminderSetting;
  hasVoiceSupport: boolean;
  hasSmsReminders: boolean;
  hasVoiceReminders: boolean;
  hasEmailReminders: boolean;
  companyId: string | null;
  onToggleEnabled: () => void;
  onToggleCall: () => void;
  onToggleEmail: () => void;
  onUpdateTemplate: (template: string) => void;
  onUpdateCallTemplate: (template: string) => void;
  onUpdateEmailTemplate: (template: string) => void;
  onDelete: () => void;
}

function ReminderCard({ setting, hasVoiceSupport, hasSmsReminders, hasVoiceReminders, hasEmailReminders, companyId, onToggleEnabled, onToggleCall, onToggleEmail, onUpdateTemplate, onUpdateCallTemplate, onUpdateEmailTemplate, onDelete }: ReminderCardProps) {
  const [template, setTemplate] = useState(setting.sms_template);
  const [callTemplate, setCallTemplate] = useState(setting.call_template || '');
  const [emailTemplate, setEmailTemplate] = useState(setting.email_template || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCall, setIsEditingCall] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isTestCallDialogOpen, setIsTestCallDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestingCall, setIsTestingCall] = useState(false);

  useEffect(() => {
    setTemplate(setting.sms_template);
    setCallTemplate(setting.call_template || '');
    setEmailTemplate(setting.email_template || '');
  }, [setting.sms_template, setting.call_template, setting.email_template]);

  const handleSave = () => {
    onUpdateTemplate(template);
    setIsEditing(false);
  };

  const handleSaveEmail = () => {
    onUpdateEmailTemplate(emailTemplate);
    setIsEditingEmail(false);
  };

  const handleSaveCall = () => {
    onUpdateCallTemplate(callTemplate);
    setIsEditingCall(false);
  };

  const handleTestCall = async () => {
    if (!testPhoneNumber || !companyId) {
      toast.error('Please enter a phone number');
      return;
    }

    // Basic phone validation
    const cleanNumber = testPhoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsTestingCall(true);

    try {
      // Apply template variables with sample data
      const sampleScript = (setting.call_template || setting.sms_template)
        .replace(/{customer_name}/g, 'Test Customer')
        .replace(/{service_type}/g, 'Sample Service')
        .replace(/{company_name}/g, 'Your Company')
        .replace(/{date}/g, 'Tomorrow')
        .replace(/{time}/g, '2:00 PM');

      const { data, error } = await supabase.functions.invoke('test-voice-reminder', {
        body: {
          phoneNumber: testPhoneNumber.startsWith('+') ? testPhoneNumber : `+1${cleanNumber}`,
          callScript: sampleScript,
          companyId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Test call initiated! You should receive a call shortly.');
        setIsTestCallDialogOpen(false);
        setTestPhoneNumber('');
      } else {
        throw new Error(data?.error || 'Failed to initiate test call');
      }
    } catch (error: any) {
      console.error('Test call error:', error);
      toast.error(error.message || 'Failed to initiate test call');
    } finally {
      setIsTestingCall(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <h4 className="font-medium">{setting.hours_before} hours before</h4>
            <p className="text-sm text-muted-foreground">
              Reminder type: {setting.reminder_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {hasSmsReminders ? (
              <Switch
                checked={setting.is_enabled}
                onCheckedChange={onToggleEnabled}
              />
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span className="text-xs">Basic</span>
              </div>
            )}
            <span className="text-sm">{setting.is_enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>SMS</span>
          <span className="text-primary">Always</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>Email</span>
          {hasEmailReminders ? (
            <Switch
              checked={setting.email_enabled}
              onCheckedChange={onToggleEmail}
            />
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span className="text-xs">Pro</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span>Voice Call</span>
          {hasVoiceReminders ? (
            <Switch
              checked={setting.call_enabled}
              onCheckedChange={onToggleCall}
              disabled={!hasVoiceSupport && !setting.call_enabled}
            />
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span className="text-xs">Pro</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">SMS Template</Label>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => {
                setTemplate(setting.sms_template);
                setIsEditing(false);
              }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div
            className="bg-primary/10 rounded p-2 text-sm cursor-pointer hover:bg-primary/20 transition-colors text-foreground"
            onClick={() => setIsEditing(true)}
          >
            {setting.sms_template}
          </div>
        )}
      </div>

      {setting.email_enabled && (
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            Email Template
          </Label>
          {isEditingEmail ? (
            <div className="space-y-2">
              <Textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={6}
                placeholder="Enter the email content..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEmail}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEmailTemplate(setting.email_template || '');
                  setIsEditingEmail(false);
                }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              className="bg-primary/10 rounded p-2 text-sm cursor-pointer hover:bg-primary/20 transition-colors whitespace-pre-wrap text-foreground"
              onClick={() => setIsEditingEmail(true)}
            >
              {setting.email_template || 'Click to add an email template...'}
            </div>
          )}
        </div>
      )}

      {setting.call_enabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              Voice Call Script
            </Label>
            <Dialog open={isTestCallDialogOpen} onOpenChange={setIsTestCallDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!hasVoiceSupport}>
                  <PhoneCall className="h-3.5 w-3.5 mr-1" />
                  Test Call
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Test Voice Reminder</DialogTitle>
                  <DialogDescription>
                    Enter your phone number to receive a test call with the current voice script.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Preview Script</Label>
                    <div className="bg-primary/10 rounded p-3 text-sm text-foreground">
                      {(setting.call_template || setting.sms_template)
                        .replace(/{customer_name}/g, 'Test Customer')
                        .replace(/{service_type}/g, 'Sample Service')
                        .replace(/{company_name}/g, 'Your Company')
                        .replace(/{date}/g, 'Tomorrow')
                        .replace(/{time}/g, '2:00 PM')}
                    </div>
                  </div>
                  <Button 
                    onClick={handleTestCall} 
                    disabled={isTestingCall || !testPhoneNumber}
                    className="w-full"
                  >
                    {isTestingCall ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Initiating Call...
                      </>
                    ) : (
                      <>
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Send Test Call
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {isEditingCall ? (
            <div className="space-y-2">
              <Textarea
                value={callTemplate}
                onChange={(e) => setCallTemplate(e.target.value)}
                rows={4}
                placeholder="Enter the script for the voice call..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveCall}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setCallTemplate(setting.call_template || '');
                  setIsEditingCall(false);
                }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              className="bg-primary/10 rounded p-2 text-sm cursor-pointer hover:bg-primary/20 transition-colors text-foreground"
              onClick={() => setIsEditingCall(true)}
            >
              {setting.call_template || 'Click to add a voice call script...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
