import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Mail, Phone, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DefaultPreferencesSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

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
      toast.success('Default preferences updated');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

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
      <CardHeader>
        <CardTitle>Default Notification Preferences</CardTitle>
        <CardDescription>
          These settings apply to all new appointments. Customers can change their preferences later.
        </CardDescription>
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
              checked={company?.default_sms_enabled ?? true}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ default_sms_enabled: checked })
              }
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
              checked={company?.default_email_enabled ?? true}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ default_email_enabled: checked })
              }
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
              checked={company?.default_call_enabled ?? true}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ default_call_enabled: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
