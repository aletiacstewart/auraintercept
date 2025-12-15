import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

export function AlertsSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  // Unsubscribe alert state
  const [unsubEnabled, setUnsubEnabled] = useState(false);
  const [unsubThreshold, setUnsubThreshold] = useState(10);
  const [unsubEmail, setUnsubEmail] = useState('');
  
  // Bounce alert state
  const [bounceEnabled, setBounceEnabled] = useState(false);
  const [bounceThreshold, setBounceThreshold] = useState(10);
  const [bounceEmail, setBounceEmail] = useState('');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-alerts', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select(`
          unsubscribe_alert_threshold, unsubscribe_alert_enabled, unsubscribe_alert_email, last_unsubscribe_alert_at,
          bounce_alert_threshold, bounce_alert_enabled, bounce_alert_email, last_bounce_alert_at
        `)
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setUnsubEnabled(company.unsubscribe_alert_enabled || false);
      setUnsubThreshold(company.unsubscribe_alert_threshold || 10);
      setUnsubEmail(company.unsubscribe_alert_email || '');
      setBounceEnabled(company.bounce_alert_enabled || false);
      setBounceThreshold(company.bounce_alert_threshold || 10);
      setBounceEmail(company.bounce_alert_email || '');
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-alerts', companyId] });
      toast.success('Alert settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleSave = () => {
    if (unsubEnabled && !unsubEmail) {
      toast.error('Please enter an email for unsubscribe alerts');
      return;
    }
    if (bounceEnabled && !bounceEmail) {
      toast.error('Please enter an email for bounce alerts');
      return;
    }
    if ((unsubEnabled && unsubThreshold < 1) || (bounceEnabled && bounceThreshold < 1)) {
      toast.error('Threshold must be at least 1');
      return;
    }
    
    updateMutation.mutate({
      unsubscribe_alert_threshold: unsubThreshold,
      unsubscribe_alert_enabled: unsubEnabled,
      unsubscribe_alert_email: unsubEmail || null,
      bounce_alert_threshold: bounceThreshold,
      bounce_alert_enabled: bounceEnabled,
      bounce_alert_email: bounceEmail || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Email & Subscription Alerts
        </CardTitle>
        <CardDescription>
          Get notified about high unsubscribe rates and email deliverability issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure alerts to be notified when customer opt-outs or email bounces exceed your thresholds within a 24-hour period.
          </AlertDescription>
        </Alert>

        {/* Unsubscribe Alerts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <Label htmlFor="unsub-alerts-enabled" className="text-base font-medium">
                  Unsubscribe Rate Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alert when too many customers opt out
                </p>
              </div>
            </div>
            <Switch
              id="unsub-alerts-enabled"
              checked={unsubEnabled}
              onCheckedChange={setUnsubEnabled}
            />
          </div>

          {unsubEnabled && (
            <div className="pl-4 border-l-2 border-amber-500/30 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unsub-threshold">Threshold (24h)</Label>
                  <Input
                    id="unsub-threshold"
                    type="number"
                    min={1}
                    value={unsubThreshold}
                    onChange={(e) => setUnsubThreshold(parseInt(e.target.value) || 10)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unsub-email">Alert Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="unsub-email"
                      type="email"
                      value={unsubEmail}
                      onChange={(e) => setUnsubEmail(e.target.value)}
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
              </div>
              {company?.last_unsubscribe_alert_at && (
                <p className="text-xs text-muted-foreground">
                  Last alert: {new Date(company.last_unsubscribe_alert_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Bounce Alerts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Bell className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <Label htmlFor="bounce-alerts-enabled" className="text-base font-medium">
                  Email Deliverability Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alert when bounces or complaints are high
                </p>
              </div>
            </div>
            <Switch
              id="bounce-alerts-enabled"
              checked={bounceEnabled}
              onCheckedChange={setBounceEnabled}
            />
          </div>

          {bounceEnabled && (
            <div className="pl-4 border-l-2 border-destructive/30 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bounce-threshold">Threshold (24h)</Label>
                  <Input
                    id="bounce-threshold"
                    type="number"
                    min={1}
                    value={bounceThreshold}
                    onChange={(e) => setBounceThreshold(parseInt(e.target.value) || 10)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bounce-email">Alert Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bounce-email"
                      type="email"
                      value={bounceEmail}
                      onChange={(e) => setBounceEmail(e.target.value)}
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
              </div>
              {company?.last_bounce_alert_at && (
                <p className="text-xs text-muted-foreground">
                  Last alert: {new Date(company.last_bounce_alert_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Alert Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
