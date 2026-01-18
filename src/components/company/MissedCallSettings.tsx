import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PhoneMissed, Phone, MessageSquare, Clock, History, CheckCircle, XCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

type MissedCallAction = 'disabled' | 'sms_only' | 'callback_only' | 'callback_then_sms';

interface MissedCallCallback {
  id: string;
  customer_phone: string;
  status: string;
  created_at: string;
  initiated_at: string | null;
  completed_at: string | null;
  sms_fallback_sent: boolean;
}

export function MissedCallSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  // Local state for form
  const [localSettings, setLocalSettings] = useState({
    missed_call_action: 'disabled' as MissedCallAction,
    callback_delay_seconds: 30,
    callback_retry_count: 3,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-missed-call-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('missed_call_action, callback_delay_seconds, callback_retry_count')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: integrations } = useQuery({
    queryKey: ['tenant-integrations-missed-call', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, elevenlabs_api_key')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: recentCallbacks } = useQuery({
    queryKey: ['missed-call-callbacks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('missed_call_callbacks')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as MissedCallCallback[];
    },
    enabled: !!companyId,
  });

  // Sync local state with fetched data
  useEffect(() => {
    if (company) {
      setLocalSettings({
        missed_call_action: (company.missed_call_action as MissedCallAction) || 'disabled',
        callback_delay_seconds: company.callback_delay_seconds || 30,
        callback_retry_count: company.callback_retry_count || 3,
      });
      setHasChanges(false);
    }
  }, [company]);

  const hasTwilio = !!(integrations?.twilio_account_sid && integrations?.twilio_phone_number);
  const hasVoice = !!(hasTwilio && integrations?.elevenlabs_api_key);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      missed_call_action?: MissedCallAction;
      callback_delay_seconds?: number;
      callback_retry_count?: number;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-missed-call-settings'] });
      setSaveStatus('saved');
      setHasChanges(false);
      toast.success('Missed call settings saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      setSaveStatus('idle');
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const handleActionChange = (value: MissedCallAction) => {
    if ((value === 'callback_only' || value === 'callback_then_sms') && !hasVoice) {
      toast.error('AI callbacks require Twilio and ElevenLabs integrations');
      return;
    }
    if (value === 'sms_only' && !hasTwilio) {
      toast.error('SMS requires Twilio integration');
      return;
    }
    setLocalSettings(prev => ({ ...prev, missed_call_action: value }));
    setHasChanges(true);
  };

  const handleDelayChange = (value: string) => {
    const delay = parseInt(value);
    if (!isNaN(delay) && delay >= 10 && delay <= 300) {
      setLocalSettings(prev => ({ ...prev, callback_delay_seconds: delay }));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    updateMutation.mutate(localSettings);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'answered':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Answered</Badge>;
      case 'customer_called_back':
        return <Badge variant="secondary"><Phone className="h-3 w-3 mr-1" />Called Back</Badge>;
      case 'initiated':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'no_answer':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />No Answer</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneMissed className="h-5 w-5" />
            Missed Call Handling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = localSettings.missed_call_action !== 'disabled';

  const handleToggleEnabled = () => {
    if (isEnabled) {
      setLocalSettings(prev => ({ ...prev, missed_call_action: 'disabled' }));
    } else {
      setLocalSettings(prev => ({ ...prev, missed_call_action: 'sms_only' }));
    }
    setHasChanges(true);
  };
  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhoneMissed className="h-5 w-5" />
                Missed Call Handling
              </CardTitle>
              <CardDescription>
                Configure how to respond when customer calls are missed
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={!hasTwilio}
              />
              <span className="text-sm font-medium">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || saveStatus === 'saving'}
                size="sm"
                className="gap-2 ml-2"
              >
                <Save className="h-4 w-4" />
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasTwilio && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                Missed call handling requires{' '}
                <Link to="/integrations" className="text-secondary underline hover:no-underline">
                  Twilio integration
                </Link>{' '}
                to be configured.
              </AlertDescription>
            </Alert>
          )}

          {isEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>When a call is missed</Label>
                <Select
                  value={localSettings.missed_call_action}
                  onValueChange={handleActionChange}
                  disabled={!hasTwilio}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms_only">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        SMS Only - Send text message
                      </div>
                    </SelectItem>
                    <SelectItem value="callback_only" disabled={!hasVoice}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        AI Callback Only {!hasVoice && '(Requires ElevenLabs)'}
                      </div>
                    </SelectItem>
                    <SelectItem value="callback_then_sms" disabled={!hasVoice}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        AI Callback, then SMS fallback {!hasVoice && '(Requires ElevenLabs)'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(localSettings.missed_call_action === 'callback_only' || localSettings.missed_call_action === 'callback_then_sms') && (
                <div className="space-y-2">
                  <Label>Callback delay (seconds)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={10}
                      max={300}
                      value={localSettings.callback_delay_seconds}
                      onChange={(e) => handleDelayChange(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      Wait time before initiating AI callback (10-300 seconds)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This delay allows time for the customer to call back first
                  </p>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                <h4 className="font-medium flex items-center gap-2 text-card-foreground">
                  <MessageSquare className="h-4 w-4" />
                  How it works
                </h4>
                <ul className="text-sm text-card-foreground/70 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-card-foreground">1.</span>
                    Customer calls your business phone number
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-card-foreground">2.</span>
                    If the call is missed (no answer, busy, or failed), Twilio triggers the missed call handler
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-card-foreground">3.</span>
                    Based on your settings, the system either sends an SMS, initiates an AI callback, or both
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-card-foreground">4.</span>
                    AI callbacks use your ElevenLabs voice to greet the customer and help them book an appointment
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {recentCallbacks && recentCallbacks.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Callback Attempts
            </CardTitle>
            <CardDescription>
              Last 10 missed call callback attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCallbacks.map((callback) => (
                <div key={callback.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{callback.customer_phone}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(callback.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {callback.sms_fallback_sent && (
                      <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        SMS Sent
                      </Badge>
                    )}
                    {getStatusBadge(callback.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
