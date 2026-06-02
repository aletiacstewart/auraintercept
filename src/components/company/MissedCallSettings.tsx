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
import { PhoneMissed, Phone, MessageSquare, Clock, History, CheckCircle, XCircle, AlertCircle, Loader2, Save, PhoneForwarded, Bot, Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';
import { PhoneNumberSetupWizard } from './PhoneNumberSetupWizard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type MissedCallAction = 'disabled' | 'sms_only' | 'callback_only' | 'callback_then_sms';
type CallRoutingMode = 'ai_direct' | 'ring_first';

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

  const [localSettings, setLocalSettings] = useState({
    missed_call_action: 'disabled' as MissedCallAction,
    callback_delay_seconds: 30,
    callback_retry_count: 3,
    call_routing_mode: 'ai_direct' as CallRoutingMode,
    business_phone: '',
    ring_timeout_seconds: 15,
    phone_number_setup_type: null as string | null,
    missed_call_reply_known_only: true,
  });
  const [showWizard, setShowWizard] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-missed-call-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('missed_call_action, callback_delay_seconds, callback_retry_count, call_routing_mode, business_phone, ring_timeout_seconds, phone_number_setup_type, missed_call_reply_known_only')
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
        .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, elevenlabs_api_key')
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

  useEffect(() => {
    if (company) {
      setLocalSettings({
        missed_call_action: (company.missed_call_action as MissedCallAction) || 'disabled',
        callback_delay_seconds: company.callback_delay_seconds || 30,
        callback_retry_count: company.callback_retry_count || 3,
        call_routing_mode: (company.call_routing_mode as CallRoutingMode) || 'ai_direct',
        business_phone: company.business_phone || '',
        ring_timeout_seconds: company.ring_timeout_seconds || 15,
        phone_number_setup_type: (company as any).phone_number_setup_type || null,
        missed_call_reply_known_only: (company as any).missed_call_reply_known_only !== false,
      });
      setHasChanges(false);
    }
  }, [company]);

  const hasSignalWire = !!(integrations?.signalwire_project_id && integrations?.signalwire_phone_number);
  const hasVoice = !!(hasSignalWire && integrations?.elevenlabs_api_key);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
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
      toast.success('Settings saved');
      triggerSetupProgressRefresh();
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      setSaveStatus('idle');
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const handleActionChange = (value: MissedCallAction) => {
    if ((value === 'callback_only' || value === 'callback_then_sms') && !hasVoice) {
      toast.error('AI callbacks require SignalWire and ElevenLabs integrations');
      return;
    }
    if (value === 'sms_only' && !hasSignalWire) {
      toast.error('SMS requires SignalWire integration');
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
            Call Routing & Missed Calls
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
      {/* Call Routing Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhoneForwarded className="h-5 w-5" />
                Call Routing
              </CardTitle>
              <CardDescription>
                Control how incoming calls are handled — AI answers directly or rings your phone first
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasSignalWire && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                Call routing requires{' '}
                <Link to="/integrations" className="text-secondary underline hover:no-underline">
                  SignalWire integration
                </Link>{' '}
                to be configured.
              </AlertDescription>
            </Alert>
          )}

          {/* Phone Number Setup Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  How is your number connected?
                </Label>
                <p className="text-xs text-muted-foreground">
                  This determines the recommended call routing mode
                </p>
              </div>
              <Dialog open={showWizard} onOpenChange={setShowWizard}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Settings2 className="h-3 w-3" />
                    Setup Guide
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Phone Number Setup Wizard</DialogTitle>
                  </DialogHeader>
                  <PhoneNumberSetupWizard 
                    signalWireNumber={integrations?.signalwire_phone_number || undefined}
                    selectedOption={localSettings.phone_number_setup_type as any}
                    onSelect={(option) => {
                      const autoRouting = option === 'conditional_forwarding' || option === 'unconditional_forwarding' ? 'ai_direct' : 'ring_first';
                      setLocalSettings(prev => ({ 
                        ...prev, 
                        phone_number_setup_type: option,
                        call_routing_mode: autoRouting as CallRoutingMode,
                      }));
                      setHasChanges(true);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <Select
              value={localSettings.phone_number_setup_type || 'not_configured'}
              onValueChange={(value) => {
                const setupType = value === 'not_configured' ? null : value;
                const autoRouting = (value === 'conditional_forwarding' || value === 'unconditional_forwarding') ? 'ai_direct' : 'ring_first';
                setLocalSettings(prev => ({ 
                  ...prev, 
                  phone_number_setup_type: setupType,
                  call_routing_mode: autoRouting as CallRoutingMode,
                }));
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select setup type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_configured">Not configured yet</SelectItem>
                <SelectItem value="conditional_forwarding">Conditional Call Forwarding (CFNA)</SelectItem>
                <SelectItem value="ported">Number Ported to SignalWire</SelectItem>
                <SelectItem value="unconditional_forwarding">Unconditional Forwarding</SelectItem>
                <SelectItem value="new_number">Using New AI Number</SelectItem>
              </SelectContent>
            </Select>

            {localSettings.phone_number_setup_type === 'conditional_forwarding' && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertCircle className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-xs">
                  <strong>Auto-configured to AI Direct.</strong> Your carrier already rings your phone before forwarding — the AI picks up immediately when the call arrives here.
                </AlertDescription>
              </Alert>
            )}

            {localSettings.phone_number_setup_type === 'unconditional_forwarding' && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertCircle className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-xs">
                  <strong>Auto-configured to AI Direct.</strong> All calls forward to the AI immediately since your carrier sends everything here.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>When a customer calls your number</Label>
              <Select
                value={localSettings.call_routing_mode}
                onValueChange={(value: CallRoutingMode) => {
                  setLocalSettings(prev => ({ ...prev, call_routing_mode: value }));
                  setHasChanges(true);
                }}
                disabled={!hasSignalWire}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select routing mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_direct">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Answers Directly — Agent picks up immediately
                    </div>
                  </SelectItem>
                  <SelectItem value="ring_first">
                    <div className="flex items-center gap-2">
                      <PhoneForwarded className="h-4 w-4" />
                      Ring My Phone First — AI takes over if unanswered
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {localSettings.call_routing_mode === 'ring_first' && (
              <div className="space-y-4 pl-1">
                <div className="space-y-2">
                  <Label>Your business/personal phone number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={localSettings.business_phone}
                    onChange={(e) => {
                      setLocalSettings(prev => ({ ...prev, business_phone: e.target.value }));
                      setHasChanges(true);
                    }}
                    disabled={!hasSignalWire}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the number that will ring first when a customer calls
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Ring timeout: {localSettings.ring_timeout_seconds} seconds</Label>
                  <Slider
                    value={[localSettings.ring_timeout_seconds]}
                    onValueChange={([value]) => {
                      setLocalSettings(prev => ({ ...prev, ring_timeout_seconds: value }));
                      setHasChanges(true);
                    }}
                    min={10}
                    max={30}
                    step={5}
                    disabled={!hasSignalWire}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to ring your phone before the AI agent takes over (10–30 seconds)
                  </p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/10">
                  <h4 className="font-medium text-sm text-card-foreground">How Ring First works</h4>
                  <ol className="text-sm text-card-foreground/70 space-y-1.5 list-decimal list-inside">
                    <li>Customer calls your SignalWire number</li>
                    <li>Your phone rings for {localSettings.ring_timeout_seconds} seconds</li>
                    <li>If you answer — it's a normal call, AI stays out of the way</li>
                    <li>If you don't answer — AI agent picks up instantly and helps the caller</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    The caller never gets voicemail or a dead line. Every call is handled.
                  </p>
                </div>
              </div>
            )}

            {localSettings.call_routing_mode === 'ai_direct' && (
              <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/10">
                <h4 className="font-medium text-sm text-card-foreground">AI Direct mode</h4>
                <p className="text-sm text-card-foreground/70">
                  Your AI agent answers every call immediately. Best for businesses that want 24/7 automated call handling without personal phone interruptions.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Missed Call Handling Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhoneMissed className="h-5 w-5" />
                Missed Call Follow-up
              </CardTitle>
              <CardDescription>
                Configure automated follow-up when calls are missed
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={!hasSignalWire}
              />
              <span className="text-sm font-medium">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>When a call is missed</Label>
                <Select
                  value={localSettings.missed_call_action}
                  onValueChange={handleActionChange}
                  disabled={!hasSignalWire}
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
                </div>
              )}
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
