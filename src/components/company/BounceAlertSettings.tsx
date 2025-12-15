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
import { Bell, Mail, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

export function BounceAlertSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [threshold, setThreshold] = useState<number>(10);
  const [email, setEmail] = useState<string>('');
  const [enabled, setEnabled] = useState<boolean>(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-bounce-alerts', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('bounce_alert_threshold, bounce_alert_enabled, bounce_alert_email, last_bounce_alert_at')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Sync local state with fetched data
  useEffect(() => {
    if (company) {
      setThreshold(company.bounce_alert_threshold || 10);
      setEmail(company.bounce_alert_email || '');
      setEnabled(company.bounce_alert_enabled || false);
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      bounce_alert_threshold?: number;
      bounce_alert_enabled?: boolean;
      bounce_alert_email?: string | null;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-bounce-alerts', companyId] });
      toast.success('Bounce alert settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleSave = () => {
    if (enabled && !email) {
      toast.error('Please enter an email address');
      return;
    }
    if (enabled && threshold < 1) {
      toast.error('Threshold must be at least 1');
      return;
    }
    updateMutation.mutate({
      bounce_alert_threshold: threshold,
      bounce_alert_enabled: enabled,
      bounce_alert_email: email || null,
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
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Email Deliverability Alerts
        </CardTitle>
        <CardDescription>
          Get notified when bounce or complaint rates are too high
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Receive an email alert when the number of bounced or complained emails in a 24-hour period exceeds your threshold. 
            This helps you identify deliverability issues before they impact your sender reputation.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <Bell className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <Label htmlFor="bounce-alerts-enabled" className="text-base font-medium">
                Enable Bounce Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Send email when bounce/complaint threshold is exceeded
              </p>
            </div>
          </div>
          <Switch
            id="bounce-alerts-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bounce-threshold">Bounce/Complaint Threshold (24h)</Label>
            <Input
              id="bounce-threshold"
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
              placeholder="10"
              disabled={!enabled}
            />
            <p className="text-xs text-muted-foreground">
              Alert when this many bounces or complaints occur within 24 hours
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bounce-alert-email">Alert Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="bounce-alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                disabled={!enabled}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Email address to receive deliverability alerts
            </p>
          </div>
        </div>

        {company?.last_bounce_alert_at && (
          <p className="text-sm text-muted-foreground">
            Last alert sent: {new Date(company.last_bounce_alert_at).toLocaleString()}
          </p>
        )}

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
