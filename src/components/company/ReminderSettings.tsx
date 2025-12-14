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
import { Bell, Clock, MessageSquare, Phone, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReminderSetting {
  id: string;
  company_id: string;
  reminder_type: string;
  is_enabled: boolean;
  hours_before: number;
  sms_template: string;
  call_enabled: boolean;
  call_template: string | null;
}

const DEFAULT_TEMPLATE = 'Hi {customer_name}, this is a reminder for your {service_type} appointment at {company_name} on {date} at {time}.';

const PRESET_REMINDERS = [
  { type: '48h', hours: 48, label: '48 hours before' },
  { type: '24h', hours: 24, label: '24 hours before' },
  { type: '2h', hours: 2, label: '2 hours before' },
  { type: '1h', hours: 1, label: '1 hour before' },
];

export function ReminderSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHours, setNewHours] = useState('');

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
    upsertMutation.mutate({
      ...setting,
      is_enabled: !setting.is_enabled,
    });
  };

  const handleToggleCall = (setting: ReminderSetting) => {
    upsertMutation.mutate({
      ...setting,
      call_enabled: !setting.call_enabled,
    });
  };

  const handleUpdateTemplate = (setting: ReminderSetting, template: string) => {
    upsertMutation.mutate({
      ...setting,
      sms_template: template,
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
              onToggleEnabled={() => handleToggleEnabled(setting)}
              onToggleCall={() => handleToggleCall(setting)}
              onUpdateTemplate={(template) => handleUpdateTemplate(setting, template)}
              onDelete={() => deleteMutation.mutate(setting.id)}
            />
          ))
        )}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Template Variables</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <code>{'{customer_name}'}</code>
            <span>Customer's name</span>
            <code>{'{service_type}'}</code>
            <span>Service booked</span>
            <code>{'{company_name}'}</code>
            <span>Your company name</span>
            <code>{'{date}'}</code>
            <span>Appointment date</span>
            <code>{'{time}'}</code>
            <span>Appointment time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReminderCardProps {
  setting: ReminderSetting;
  onToggleEnabled: () => void;
  onToggleCall: () => void;
  onUpdateTemplate: (template: string) => void;
  onDelete: () => void;
}

function ReminderCard({ setting, onToggleEnabled, onToggleCall, onUpdateTemplate, onDelete }: ReminderCardProps) {
  const [template, setTemplate] = useState(setting.sms_template);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTemplate(setting.sms_template);
  }, [setting.sms_template]);

  const handleSave = () => {
    onUpdateTemplate(template);
    setIsEditing(false);
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
            <Switch
              checked={setting.is_enabled}
              onCheckedChange={onToggleEnabled}
            />
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

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>SMS</span>
          <span className="text-primary">Always</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span>Call</span>
          <Switch
            checked={setting.call_enabled}
            onCheckedChange={onToggleCall}
          />
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
            className="bg-muted/50 rounded p-2 text-sm cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {setting.sms_template}
          </div>
        )}
      </div>
    </div>
  );
}
