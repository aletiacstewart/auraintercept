import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Mail, Phone, Info, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DefaultPreferencesSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [localSettings, setLocalSettings] = useState({
    default_sms_enabled: true,
    default_email_enabled: true,
    default_call_enabled: true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-defaults', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('default_sms_enabled, default_email_enabled, default_call_enabled')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Sync local state with fetched data
  useEffect(() => {
    if (company) {
      setLocalSettings({
        default_sms_enabled: company.default_sms_enabled ?? true,
        default_email_enabled: company.default_email_enabled ?? true,
        default_call_enabled: company.default_call_enabled ?? true,
      });
      setHasChanges(false);
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      default_sms_enabled?: boolean;
      default_email_enabled?: boolean;
      default_call_enabled?: boolean;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-defaults', companyId] });
      setSaveStatus('saved');
      setHasChanges(false);
      toast.success('Default preferences saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('idle');
      toast.error('Failed to save preferences');
    },
  });

  const handleToggle = (key: keyof typeof localSettings, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    updateMutation.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Default Notification Preferences</CardTitle>
          <CardDescription>
            These settings apply to all new appointments. Customers can change their preferences later.
          </CardDescription>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saveStatus === 'saving'}
          size="sm"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            When a new appointment is booked, these default preferences will be automatically applied.
            Customers can update their preferences through the customer portal link in their confirmation email.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="sms-default" className="text-base font-medium">
                  SMS Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send text message reminders to customers
                </p>
              </div>
            </div>
            <Switch
              id="sms-default"
              checked={localSettings.default_sms_enabled}
              onCheckedChange={(checked) => handleToggle('default_sms_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="email-default" className="text-base font-medium">
                  Email Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email reminders to customers
                </p>
              </div>
            </div>
            <Switch
              id="email-default"
              checked={localSettings.default_email_enabled}
              onCheckedChange={(checked) => handleToggle('default_email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="call-default" className="text-base font-medium">
                  Voice Call Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send automated voice call reminders to customers
                </p>
              </div>
            </div>
            <Switch
              id="call-default"
              checked={localSettings.default_call_enabled}
              onCheckedChange={(checked) => handleToggle('default_call_enabled', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}